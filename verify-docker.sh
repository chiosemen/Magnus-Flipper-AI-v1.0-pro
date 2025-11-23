#!/bin/bash
# verify-docker.sh
# Verification script for Magnus Flipper AI Docker migration
# Tests that all services build correctly and workspace packages are available

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Service definitions
SERVICES=(
    "worker-alerts:apps/worker-alerts/Dockerfile:@magnus-flipper-ai/notifications"
    "worker-crawler:apps/worker-crawler/Dockerfile:@magnus-flipper-ai/fb-marketplace-crawler"
    "worker-analyzer:apps/worker-analyzer/Dockerfile:@magnus-flipper-ai/core"
    "api:apps/api/Dockerfile:@magnus-flipper-ai/queue"
    "scheduler:apps/scheduler/Dockerfile:@magnus-flipper-ai/queue"
    "web:apps/web/Dockerfile:next"
)

# Helper functions
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}→ $1${NC}"
}

# Pre-flight checks
print_header "Pre-flight Checks"

print_step "Checking Docker installation"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
else
    print_error "Docker not found"
    exit 1
fi

print_step "Checking Docker Compose installation"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose installed: $COMPOSE_VERSION"
else
    print_error "Docker Compose not found"
    exit 1
fi

print_step "Checking monorepo structure"
if [[ -f "pnpm-workspace.yaml" ]]; then
    print_success "Found pnpm-workspace.yaml"
else
    print_error "pnpm-workspace.yaml not found - are you in the monorepo root?"
    exit 1
fi

print_step "Checking Dockerfile existence"
for service_def in "${SERVICES[@]}"; do
    IFS=':' read -r name dockerfile pkg <<< "$service_def"
    if [[ -f "$dockerfile" ]]; then
        print_success "Found $dockerfile"
    else
        print_error "Missing $dockerfile"
    fi
done

# Build verification
print_header "Building Docker Images"

for service_def in "${SERVICES[@]}"; do
    IFS=':' read -r name dockerfile pkg <<< "$service_def"

    print_step "Building $name"
    if docker build -f "$dockerfile" -t "magnus-$name:test" . > /tmp/build-$name.log 2>&1; then
        print_success "Built magnus-$name:test"

        # Check if build log contains expected patterns
        if grep -q "pnpm install --frozen-lockfile" /tmp/build-$name.log; then
            print_success "  - Uses pnpm install --frozen-lockfile"
        fi

        if grep -q "pnpm -r build" /tmp/build-$name.log; then
            print_success "  - Uses pnpm -r build"
        fi
    else
        print_error "Failed to build magnus-$name:test"
        echo "Build log:"
        tail -20 /tmp/build-$name.log
    fi
done

# Module resolution verification
print_header "Verifying Workspace Package Resolution"

for service_def in "${SERVICES[@]}"; do
    IFS=':' read -r name dockerfile pkg <<< "$service_def"

    print_step "Testing $name can resolve $pkg"

    # Skip Next.js web app (different test)
    if [[ "$name" == "web" ]]; then
        # For Next.js, just verify the image exists
        if docker image inspect "magnus-$name:test" > /dev/null 2>&1; then
            print_success "$name image exists"
        else
            print_error "$name image not found"
        fi
        continue
    fi

    # Test module resolution for Node services
    if docker run --rm "magnus-$name:test" node -e "try { require('$pkg'); console.log('OK'); } catch(e) { console.error('FAIL:', e.message); process.exit(1); }" 2>&1 | grep -q "OK"; then
        print_success "$name can require('$pkg')"
    else
        print_error "$name cannot require('$pkg')"
    fi
done

# Image inspection
print_header "Inspecting Built Images"

print_step "Checking image sizes"
echo ""
docker images --filter "reference=magnus-*:test" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

for service_def in "${SERVICES[@]}"; do
    IFS=':' read -r name dockerfile pkg <<< "$service_def"

    SIZE=$(docker images "magnus-$name:test" --format "{{.Size}}")
    print_info "$name image size: $SIZE"
done

# Docker Compose verification
print_header "Docker Compose Configuration Check"

print_step "Validating docker-compose.yml"
if docker-compose config > /dev/null 2>&1; then
    print_success "docker-compose.yml is valid"
else
    print_error "docker-compose.yml has errors"
fi

print_step "Checking build contexts in docker-compose.yml"
if grep -q "context: \." docker-compose.yml; then
    print_success "Build context is set to monorepo root (.)"
else
    print_error "Build context may not be set correctly"
fi

# Dockerfile pattern verification
print_header "Dockerfile Pattern Verification"

for service_def in "${SERVICES[@]}"; do
    IFS=':' read -r name dockerfile pkg <<< "$service_def"

    print_step "Checking $dockerfile patterns"

    # Check for COPY . .
    if grep -q "COPY \. \." "$dockerfile"; then
        print_success "  - Uses COPY . ."
    else
        print_error "  - Missing COPY . ."
    fi

    # Check for pnpm install --frozen-lockfile
    if grep -q "pnpm install --frozen-lockfile" "$dockerfile"; then
        print_success "  - Uses pnpm install --frozen-lockfile"
    else
        print_error "  - Missing pnpm install --frozen-lockfile"
    fi

    # Check for pnpm -r build
    if grep -q "pnpm -r build" "$dockerfile"; then
        print_success "  - Uses pnpm -r build"
    else
        print_error "  - Missing pnpm -r build"
    fi

    # Check for workspace config copy in runner
    if grep -q "COPY.*pnpm-workspace.yaml" "$dockerfile"; then
        print_success "  - Copies pnpm-workspace.yaml to runner"
    else
        print_error "  - Missing pnpm-workspace.yaml in runner"
    fi

    # Check for packages copy from builder
    if grep -q "COPY --from=builder.*packages" "$dockerfile"; then
        print_success "  - Copies packages from builder"
    else
        print_error "  - Missing packages copy from builder"
    fi
done

# Summary
print_header "Verification Summary"

echo ""
echo -e "Total tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:      ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:      ${RED}$FAILED_TESTS${NC}"
echo ""

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}║   ✓ ALL VERIFICATIONS PASSED!         ║${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}║   Your Docker setup is ready!         ║${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Deploy: docker-compose up -d"
    echo "  2. Monitor: docker-compose logs -f"
    echo "  3. Check health: docker-compose ps"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}║   ✗ SOME VERIFICATIONS FAILED          ║${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}║   Please review errors above           ║${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check build logs in /tmp/build-*.log"
    echo "  2. Review DOCKER_MIGRATION_CHECKLIST.md"
    echo "  3. Ensure building from monorepo root"
    echo "  4. Verify pnpm-workspace.yaml is correct"
    echo ""
    exit 1
fi
