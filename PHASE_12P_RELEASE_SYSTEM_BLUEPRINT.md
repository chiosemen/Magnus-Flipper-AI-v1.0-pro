# Phase 12P — Automated Release & Versioning System Blueprint

## Overview

Phase 12P implements a complete automated release and versioning system for the Magnus Flipper AI monorepo. This system provides semantic versioning, automated changelog generation, GitHub releases, and production promotion workflows.

## Architecture

### Components

1. **Version Bump Script** (`scripts/release/bump-version.sh`)
   - Bumps versions across monorepo
   - Updates root, apps, and published packages
   - Supports major, minor, patch, or specific version

2. **Changelog Generator** (`scripts/release/generate-changelog.js`)
   - Generates CHANGELOG.md from git commits
   - Uses conventional commit format
   - Groups changes by type (feat, fix, infra, worker, etc.)

3. **Release Workflow** (`.github/workflows/release.yml`)
   - Manual trigger with version type selection
   - Bumps version, generates changelog, creates tag
   - Creates GitHub Release with notes
   - Optional deployment triggers

4. **Promote Release Workflow** (`.github/workflows/promote-release.yml`)
   - Promotes staging images to production tags
   - Uses digest pinning for immutable deployments
   - Updates Container Apps to production
   - Updates GitHub Release with deployment info

## Versioning Strategy

### Semantic Versioning (SemVer)

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Version Storage

Versions are stored in:
- `package.json` (root)
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/*/package.json` (published packages only)

### Git Tags

- Format: `vX.Y.Z` (e.g., `v1.4.0`)
- Created automatically on release
- Used for changelog generation (commits since last tag)

## Release Process

### 1. Create Release

**Manual Trigger**: GitHub Actions → Release workflow

**Inputs**:
- `version_type`: patch | minor | major
- `specific_version`: Override with specific version (optional)
- `skip_deploy`: Skip deployment triggers (optional)

**Steps**:
1. Checkout repository
2. Bump version across monorepo
3. Generate changelog from commits
4. Build and validate
5. Commit version changes
6. Create Git tag
7. Get Docker image digests
8. Generate release notes
9. Create GitHub Release
10. (Optional) Trigger deployments

### 2. Promote Release

**Manual Trigger**: GitHub Actions → Promote Release workflow

**Inputs**:
- `version`: Release version (e.g., `v1.4.0`)
- `skip_production`: Dry-run mode (optional)

**Steps**:
1. Authenticate to Azure
2. Get staging image digests
3. Tag images with `prod-vX.Y.Z`
4. Push production tags to ACR
5. Deploy to production Container Apps (digest-pinned)
6. Update GitHub Release with deployment info

## Changelog Generation

### Conventional Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

### Supported Types

- `feat`: New features
- `fix`: Bug fixes
- `perf`: Performance improvements
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes
- `test`: Test changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `infra`: Infrastructure changes
- `worker`: Worker updates
- `build`: Build system changes

### Changelog Structure

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Features
- Description (commit hash)

### Fixes
- Description (commit hash)

### Infrastructure
- Description (commit hash)
```

## Docker Image Tagging

### Staging Tags

- Format: `staging-${GITHUB_RUN_NUMBER}`
- Created by `stage-and-promote.yml` workflow
- Used for staging deployments

### Production Tags

- Format: `prod-vX.Y.Z`
- Created by `promote-release.yml` workflow
- Tagged from staging images
- Used for production deployments

### Digest Pinning

All production deployments use digest-pinned images:
```
magnusacr.azurecr.io/worker-scraper@sha256:abc123...
```

This ensures immutable, reproducible deployments.

## Workflow Integration

### Existing Workflows

- **ci-build.yml**: Validates builds on PRs
- **stage-and-promote.yml**: Deploys to staging, promotes to production

### New Workflows

- **release.yml**: Creates releases with versioning
- **promote-release.yml**: Promotes releases to production

### Workflow Safety

✅ **Preserved**:
- `stage-and-promote.yml` (not modified)
- `ci-build.yml` (not modified)
- `vercel.json` (minimal, unchanged)

✅ **No Breaking Changes**:
- Existing CI/CD pipelines continue to work
- Staging deployments unchanged
- Production promotion still available via stage-and-promote

## Usage Examples

### Create a Patch Release

1. Go to GitHub Actions → Release workflow
2. Click "Run workflow"
3. Select `patch` version type
4. Click "Run workflow"
5. Review generated changelog
6. Release is created with tag `v1.0.1`

### Create a Minor Release

1. Go to GitHub Actions → Release workflow
2. Click "Run workflow"
3. Select `minor` version type
4. Click "Run workflow"
5. Release is created with tag `v1.1.0`

### Promote Release to Production

1. Go to GitHub Actions → Promote Release workflow
2. Click "Run workflow"
3. Enter version: `v1.1.0`
4. Click "Run workflow"
5. Images are tagged with `prod-v1.1.0`
6. Production Container Apps are updated

## File Structure

```
.
├── .github/
│   └── workflows/
│       ├── release.yml              # Release creation workflow
│       └── promote-release.yml      # Production promotion workflow
├── scripts/
│   └── release/
│       ├── bump-version.sh          # Version bumping script
│       └── generate-changelog.js     # Changelog generator
├── CHANGELOG.md                      # Auto-generated changelog
└── package.json                     # Root version
```

## Benefits

1. **Automated Versioning**: No manual version updates
2. **Reproducible Builds**: Git tags for every release
3. **Clear History**: Auto-generated changelog
4. **Immutable Deployments**: Digest-pinned images
5. **Production Safety**: Separate promotion workflow
6. **Traceability**: GitHub Releases with deployment info

## Future Enhancements

- [ ] Automatic version bumping on merge to main
- [ ] Pre-release validation (tests, builds)
- [ ] Release notes from PR descriptions
- [ ] Slack/email notifications on release
- [ ] Rollback workflow using release tags
- [ ] Version comparison in release notes

## Troubleshooting

### Version Bump Fails

- Check that all package.json files are valid JSON
- Ensure write permissions on package.json files
- Verify pnpm workspace structure

### Changelog Empty

- Check for commits since last tag
- Verify conventional commit format
- Check git log output

### Promotion Fails

- Verify Azure authentication
- Check ACR access permissions
- Ensure staging images exist
- Verify Container App names

## Conclusion

Phase 12P provides a complete, automated release system that:
- ✅ Maintains semantic versioning
- ✅ Generates changelogs automatically
- ✅ Creates GitHub Releases
- ✅ Promotes releases to production safely
- ✅ Integrates with existing CI/CD
- ✅ Preserves all safety rules

The system is ready for production use and can be extended as needed.

