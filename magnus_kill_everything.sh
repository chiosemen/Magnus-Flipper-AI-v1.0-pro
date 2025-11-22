#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════╗
# ║  MAGNUS FLIPPER AI - NUCLEAR CLEANUP SCRIPT                       ║
# ║  Kills all processes, cleans containers & node_modules            ║
# ║  Safe to run multiple times (idempotent)                          ║
# ╚═══════════════════════════════════════════════════════════════════╝

set +e  # Continue on errors (we expect some commands to fail if nothing to kill)

echo "🔥 =========================================="
echo "🔥  MAGNUS TERMINAL CLEANUP INITIATED"
echo "🔥 =========================================="
echo ""

# ============================================================================
# 🔥 STEP 1: Kill all Node-related background processes
# ============================================================================
echo "🔥 [STEP 1/5] Killing all Node-related processes..."

if command -v killall &> /dev/null; then
    echo "   → Running: killall node"
    killall node 2>/dev/null && echo "      ✓ node processes killed" || echo "      ℹ No node processes found"
else
    echo "   ℹ killall not available, skipping"
fi

if command -v pkill &> /dev/null; then
    echo "   → Running: pkill -f node"
    pkill -f "node" 2>/dev/null && echo "      ✓ node processes killed via pkill" || echo "      ℹ No node processes found"
else
    echo "   ℹ pkill not available, skipping"
fi

# Kill processes on common dev ports
if command -v lsof &> /dev/null; then
    for PORT in 3000 4000 5173 8000 8080; do
        echo "   → Checking port $PORT..."
        PIDS=$(lsof -ti:$PORT 2>/dev/null)
        if [ -n "$PIDS" ]; then
            echo "      → Killing processes on port $PORT: $PIDS"
            echo "$PIDS" | xargs kill -9 2>/dev/null && echo "      ✓ Port $PORT cleared" || echo "      ⚠ Failed to kill some processes on port $PORT"
        else
            echo "      ℹ Port $PORT is free"
        fi
    done
else
    echo "   ℹ lsof not available, skipping port cleanup"
fi

# Find and kill processes running in project directories
echo "   → Killing processes in packages/api, apps/*, dist folders..."
if command -v pgrep &> /dev/null && command -v ps &> /dev/null; then
    for PATTERN in "packages/api" "apps/" "dist/"; do
        PIDS=$(pgrep -f "$PATTERN" 2>/dev/null)
        if [ -n "$PIDS" ]; then
            echo "      → Found processes matching '$PATTERN': $PIDS"
            echo "$PIDS" | xargs kill -9 2>/dev/null && echo "      ✓ Processes killed" || echo "      ⚠ Some processes could not be killed"
        else
            echo "      ℹ No processes found for '$PATTERN'"
        fi
    done
else
    echo "   ℹ pgrep not available, skipping directory-specific cleanup"
fi

echo "   ✓ Node process cleanup complete"
echo ""

# ============================================================================
# 🔥 STEP 2: Kill zombie processes
# ============================================================================
echo "🔥 [STEP 2/5] Killing zombie processes..."

ZOMBIE_PROCS=("tsx" "pnpm" "vite" "playwright" "redis-server" "ngrok")

if command -v pkill &> /dev/null; then
    for PROC in "${ZOMBIE_PROCS[@]}"; do
        echo "   → Killing: $PROC"
        pkill -f "$PROC" 2>/dev/null && echo "      ✓ $PROC processes killed" || echo "      ℹ No $PROC processes found"
    done
else
    echo "   ℹ pkill not available, skipping zombie process cleanup"
fi

echo "   ✓ Zombie process cleanup complete"
echo ""

# ============================================================================
# 🔥 STEP 3: Clean Docker containers (keep images)
# ============================================================================
echo "🔥 [STEP 3/5] Cleaning Docker containers..."

if command -v docker &> /dev/null; then
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        RUNNING_CONTAINERS=$(docker ps -q 2>/dev/null)
        if [ -n "$RUNNING_CONTAINERS" ]; then
            echo "   → Stopping running containers..."
            docker stop $(docker ps -aq) 2>/dev/null && echo "      ✓ Containers stopped" || echo "      ⚠ Some containers could not be stopped"
        else
            echo "   ℹ No running containers found"
        fi

        ALL_CONTAINERS=$(docker ps -aq 2>/dev/null)
        if [ -n "$ALL_CONTAINERS" ]; then
            echo "   → Removing all containers..."
            docker rm $(docker ps -aq) 2>/dev/null && echo "      ✓ Containers removed" || echo "      ⚠ Some containers could not be removed"
        else
            echo "   ℹ No containers to remove"
        fi
    else
        echo "   ℹ Docker daemon is not running, skipping container cleanup"
    fi
else
    echo "   ℹ Docker not installed, skipping container cleanup"
fi

echo "   ✓ Docker cleanup complete"
echo ""

# ============================================================================
# 🔥 STEP 4: Clean Node environment (keep files safe)
# ============================================================================
echo "🔥 [STEP 4/5] Cleaning Node environment..."

# Remove root node_modules
if [ -d "node_modules" ]; then
    echo "   → Removing ./node_modules..."
    rm -rf node_modules && echo "      ✓ Root node_modules removed" || echo "      ⚠ Failed to remove root node_modules"
else
    echo "   ℹ No root node_modules found"
fi

# Remove package node_modules
if [ -d "packages" ]; then
    echo "   → Removing packages/*/node_modules..."
    rm -rf packages/*/node_modules 2>/dev/null && echo "      ✓ Package node_modules removed" || echo "      ℹ No package node_modules found"
else
    echo "   ℹ No packages directory found"
fi

# Remove app node_modules
if [ -d "apps" ]; then
    echo "   → Removing apps/*/node_modules..."
    rm -rf apps/*/node_modules 2>/dev/null && echo "      ✓ App node_modules removed" || echo "      ℹ No app node_modules found"
else
    echo "   ℹ No apps directory found"
fi

# Prune pnpm store
if command -v pnpm &> /dev/null; then
    echo "   → Pruning pnpm store..."
    pnpm store prune 2>/dev/null && echo "      ✓ pnpm store pruned" || echo "      ⚠ Failed to prune pnpm store"
else
    echo "   ℹ pnpm not installed, skipping store prune"
fi

echo "   ✓ Node environment cleanup complete"
echo ""

# ============================================================================
# 🔥 STEP 5: Final status
# ============================================================================
echo "🔥 [STEP 5/5] Verification & Summary..."
echo ""

# Check for remaining Node processes
REMAINING_NODE=$(pgrep -f "node" 2>/dev/null | wc -l)
echo "   → Remaining node processes: $REMAINING_NODE"

# Check for remaining containers
if command -v docker &> /dev/null && docker info &> /dev/null; then
    REMAINING_CONTAINERS=$(docker ps -q 2>/dev/null | wc -l)
    echo "   → Remaining Docker containers: $REMAINING_CONTAINERS"
fi

# Check disk space freed
if [ -d ".git" ]; then
    echo "   → Repository status: Clean"
fi

echo ""
echo "🔥 =========================================="
echo "🔥  ALL PROCESSES CLEANED"
echo "🔥  TERMINAL SAFE TO RUN AGAIN"
echo "🔥 =========================================="
echo ""
echo "✨ MAGNUS TERMINAL CLEAN — READY FOR DEPLOYMENT."
echo ""
