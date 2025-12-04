# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-04

### Features

- add worker runtimes, Dockerfiles, Azure pipelines, Terraform infra (#62) (00f6247)
- add worker runtimes, Dockerfiles, infra (33e2bf9)
- **analytics**: add comprehensive analytics features and marketplace support (#60) (7950753)
- **analytics**: add comprehensive analytics features and marketplace support (#59) (49e31b3)
- **ui**: add Vinted, eBay, and Gumtree marketplace support (#57) (51eb940)
- Complete Backend Auto-Fix - Serverless API, Crawlers, Queue Engine (#51) (d82778e)
- Complete Backend Auto-Fix - Serverless API, Crawlers, Queue Engine (#50) (d06d609)
- Add Magnus Foundry DevOps - Complete Mobile CI/CD Stack (#45) (787f724)
- Add Magnus Foundry DevOps - Complete Mobile CI/CD Stack (#44) (7189c2f)
- **testing**: Add E2E test harness with Cypress (23b90f3)
- **marketing**: Add full marketplace landing page (87a666e)
- **web**: Implement Step 1 - Shell & Layout architecture (#41) (b6f9868)
- Add multi-tier membership system and Azure deployment infrastructure (d2e60fc)
- complete Azure migration and saved search backend implementation (#36) (a0d55a4)
- Design complete Magnus Flipper AI frontend dashboard (8b12140)
- Add complete premium admin dashboard UI (8edac1b)
- Add comprehensive cleanup script for development environment (e69b2bd)
- Optimize Docker infrastructure with production-ready multi-stage builds (9afd618)
- Complete clean monorepo rebuild (e5bce9c)
- Update render.yaml with optimized deployment configuration (dd77d16)
- Add deployment status checker and quick start guide (7d25b19)
- Add comprehensive deployment automation (b0f9fbb)
- Complete Expo SDK 54 upgrade, SDK workspace build, and Vercel deployment pack (1aafbe7)
- add magnus_stability_god_v4.sh script (a13102f)

### Fixes

- remove invalid saved_searches migration (public.users table missing) (3323ac3)
- complete monorepo repair for Prisma v7 + workspace normalization (#56) (c303271)
- **core**: add SubscriptionPlan type + restructure types barrel (507c06f)
- add missing core entrypoint for Vercel resolver (3a2b637)
- remove private:true to enable workspace resolution on Vercel (cf78460)
- normalize all Magnus workspace packages for Vercel (#54) (dcf9a2e)
- normalize all Magnus workspace packages for Vercel (773fd2f)
- update lockfile after workspace repair (030bd65)
- correct workspace paths so core package resolves (b3a841c)
- rebuild core package metadata (8e9df85)
- full workspace rebuild for Vercel compatibility (d3737df)
- resolved merge conflict for ui-config package (59efbf0)
- add exports field to all workspace packages for proper module resolution (9c06a4f)
- full monorepo repair for Vercel workspace resolution (3743db8)
- restore skeleton components + simplify vercel config (#53) (6343c1e)
- regenerate pnpm lockfile for Vercel monorepo deploy (7ebb3fc)
- Remove Terraform provider binary + add .terraform to .gitignore (c8b6dbf)
- **api**: Resolve API build errors and stabilize Express routes (9ff4659)
- clean SDK package.json merge conflicts and JSON errors (1c86801)
- Resolve SDK merge conflicts + repair JSON + regenerate lockfile (2d83d65)
- clean sdk package.json and remove prepare script (3d1bc76)
- Remove duplicate 'web' service definition in docker-compose.yml (c5ae2fc)
- Add explicit type annotations to Express Router instances (d36ea9d)
- Heal monorepo for successful Docker builds (a986072)
- Resolve Docker build issues for fb-marketplace-crawler (44d0009)
- Replace Zod .errors with .issues for v3+ compatibility (86a2805)
- heal GitHub Actions + standardize pnpm + remove failing workflows (fc65e48)
- Standardize pnpm version to 9.15.4 across all configs (1e08659)
- Change worker plans from free to starter (4d17ffb)
- Update render.yaml to match official Render Blueprint specification (5121498)
- Add pnpm installation and enable Puppeteer Chromium download (5b4a209)
- Convert Redis from database to private service in render.yaml (822279b)
- Update all service plans from starter to free in render.yaml (5325054)
- Update render.yaml to comply with 2025 Blueprint requirements (a869a8a)
- Correct start command paths in render.yaml (57c94f7)
- Fix all Render service deployment configurations (d87778b)
- Use connectionString property for Redis keyvalue service (7406e38)
- Update render.yaml to use keyvalue service type for Redis (ae70f99)
- Update render.yaml to 2025 platform spec (ecf9117)
- Add IP allow list to Redis service in render.yaml (6408e4d)
- Configure SDK to properly export React components for Next.js (49dd0a8)
- Correct render.yaml configuration for Render deployment (654d662)
- update @react-navigation/native in mobile project and root lockfile (2d9af49)
- use npx expo-doctor in stability script (054816b)

### Build System

- Update compiled dist files and lockfile after API fixes (e0344af)
- Update compiled dist files with router type annotations (9422ea5)

### Refactoring

- completely remove bot-telegram microservice from monorepo (39c0167)

### Documentation

- Add comprehensive implementation summary and next steps guide (d686e44)
- Add comprehensive production validation documentation (c717bc6)
- add AI grounding files and fix mobile dependencies (06b2a0d)

### Chores

- Phase 12P — Automated Release System (48c4f1b)
- Phase 12O — Remove unused Dockerfile.worker-alerts (022733d)
- Phase 12O — Production Hardening Fixes (56f56a4)
- Phase 12N — Post-merge CI + Vercel auto-repair (b078b4b)
- Feature/update mvp (#64) (59d11ad)
- Feature/update mvp (#63) (c313839)
- Update azure-pipelines.yml for Azure Pipelines (47eaf51)
- Marketplace Scraper Activation + Alert System (#61) (f8f682f)
-  EBAY  (- Marke)
- Claude/safe code prompt 01 kl tc kmds wfk raq9i5 rhtj5 (#58) (3b34bec)
-  EBAY  (- Marke)
- Claude/fix pnpm workspace 01 fr1p vx gt1v qo nwx dr3ti fn (#55) (056c996)
- use root vercel config for pnpm workspace monorepo (2ef8fa6)
- Merge remote-tracking branch 'origin/claude/fix-pnpm-workspace-01FR1pVxGt1vQoNwxDr3tiFn' (0d65c9e)
- simplify Vercel deployment configuration (67466b1)
- add TypeScript build artifacts to gitignore (#52) (4f65c11)
- add TypeScript build artifacts to gitignore (e417d25)
- Claude/repair workspace packages 01 ta m xc rax22 tkd bc cwj3p3 s (#49) (4838d48)
- Claude/repair workspace packages 01 ta m xc rax22 tkd bc cwj3p3 s (#48) (122ca14)
- Claude/setup foundry build 01 xwj whsl kg sekf sph pdsg lb (#43) (c497c53)
- SAFE SNAPSHOT — Codex dist cleanup + new deploy scripts (e02bbf5)
- PATCH 24 — Post-Merge Verification & Deploy Readiness Report (386a7ae)
- Claude/sync checkpoint 01 yd sjq2 qp7o zq49zb4ip1 vc (#42) (fff52e9)
- Merge Patch 17 — E2E test harness (0ad7a66)
- CLEANUP — sync small local edits (b113645)
- sync local changes before Claude patch (b9785e7)
- Claude/mobile UI expo router 01 a3 f5y b5e9w3 ka f lct jh gmp (#39) (239e198)
- Claude/nextjs marketplace UI 014s rmc exmbh5 ef zqyjm r db w (#38) (86dae60)
- Merge branch 'fix-api' (f890c2d)
- initial project import (7bacc4d)
- delete apps/bot-telegram folder and clean lockfile (#35) (5251cbd)
- Merge pull request #34 from chiosemen/claude/remove-bot-telegram-refs-01W5RZJRHPHcYqfWNHL9JDnj (d396517)
- Merge pull request #32 from chiosemen/claude/fix-sdk-merge-conflicts-018WUFyVVAW3M5ZsiLayUxUK (f31a812)
- Merge pull request #30 from chiosemen/claude/fix-lockfile-sync-01B3eyhb28QEW4ZLaZzNwKd8 (02710c5)
- Verify and regenerate pnpm-lock.yaml for Docker build fix (03175d4)
- Merge pull request #28 from chiosemen/claude/fix-docker-compose-duplicates-011j6jU9iTNCo9rUA1DMD51B (38f1ee0)
- Merge pull request #27 from chiosemen/claude/design-magnus-flipper-frontend-01JVx8p4YvySrCxLqaPsR8M5 (fc48943)
- Remove duplicate pages and unused components after merge (f2ea44b)
- Merge branch 'main' into claude/design-magnus-flipper-frontend-01JVx8p4YvySrCxLqaPsR8M5 (4a89646)
- Merge pull request #26 from chiosemen/claude/build-admin-dashboard-014rByHuq5DMHqg8bTqKxJzf (4fbb725)
- Merge pull request #25 from chiosemen/claude/fix-ts2742-router-error-01GSBByK6aD4wZo3DueGFTSF (b425356)
- Merge pull request #24 from chiosemen/claude/fix-monorepo-docker-build-01GSBByK6aD4wZo3DueGFTSF (fe4e0a2)
- local updates restored after docker fix merge (d6ffed3)
- Merge branch 'claude/fix-docker-build-issues-0178rCSEQTyJHB6hHcfT12ts' (4306a5d)
- Upgrade puppeteer to ^23.10.0 (6e6b03b)
- Merge pull request #23 from chiosemen/claude/fix-docker-build-issues-0178rCSEQTyJHB6hHcfT12ts (584e37b)
- Merge pull request #22 from chiosemen/claude/fix-docker-build-errors-01FSiqYvV464zyPrXW4XRMfS (b7d4cfd)
- Update build dependencies and lockfile (5b0b391)
- Merge pull request #21 from chiosemen/claude/node-cleanup-script-01FK1z6CZtWQZXxVfs8o6c9V (0536d42)
- Merge pull request #20 from chiosemen/claude/patch-render-yaml-01RiC7wwvY3zwxTca2VF2ZGJ (9daeba5)
- Merge pull request #19 from chiosemen/claude/patch-render-yaml-01RiC7wwvY3zwxTca2VF2ZGJ (27c36c3)
- Merge pull request #18 from chiosemen/claude/patch-render-yaml-01RiC7wwvY3zwxTca2VF2ZGJ (00ad469)
- Merge pull request #17 from chiosemen/claude/fix-render-yaml-01SxQ3bn4it7SydJ6ik3dE5f (7dc4019)
- Merge pull request #16 from chiosemen/claude/validate-docker-files-013FjwctwHWHedJfge4A1dmY (466830b)
- ready for Render deploy (3a88dcf)
- Merge pull request #15 from chiosemen/claude/plan-magnus-flipper-rebuild-01ATctUodiTc1Tv28bhwvx48 (83c5623)
- Merge pull request #14 from chiosemen/claude/deploy-all-services-017wUaF9TtncEUVTh9wBDRof (2c4167e)
- Merge pull request #13 from chiosemen/claude/validate-frontend-api-01FT654PXXxM7bgNtXHmjH6c (514faef)
- Merge pull request #11 from chiosemen/claude/fix-deployment-failures-01AMCXGoteJgZ4cCHfrBUwWF (387606b)
- Merge pull request #10 from chiosemen/claude/fix-recurring-error-014PHp73e5YCUXPEmd8QnwRA (2d94c43)
- Merge pull request #9 from chiosemen/claude/fix-api-deployment-01UzfE7Jn2BPDEWeWxgEac31 (ae8420e)
- Merge pull request #8 from chiosemen/claude/fix-yaml-rendering-01EBY6oXdQQWxs3mhvYxoWt8 (a490b10)
- Merge pull request #7 from chiosemen/claude/analyze-build-logs-01Cj4mMqYeGgM77NazJxaxi6 (78aed0e)
- Merge pull request #6 from chiosemen/claude/fix-render-ip-allowlist-012LvKkajFE7kagEj45dSSiN (aa9e41a)
- Merge pull request #5 from chiosemen/claude/fix-environment-variables-01APrV2i388ASrYKhvqKfp5W (80a632d)
- Automated Render + Vercel deployment suite (6f5ffe8)
- Merge pull request #1 from chiosemen/claude/fix-render-yaml-01UnoNNzf4iKjReBizdjm6k7 (a7a0e4f)
- 🚀 Production pack, Namespace Fortress v4, Render deploy prep, crawler integration (3c48168)
- add Render deployment pack + Supabase schema (dd95fc1)
- Production Ready v1.0 – Complete Deployment Pack – 20251120_144023 (7846d44)
- Production Readiness Patch – 20251120_140040 (f76b39d)
- Magnus auto-commit at 2025-11-19_23-28-21 (010a187)
- Initial full monorepo import (655b8d3)

## [Unreleased]

### Features
- Automated release and versioning system (Phase 12P)
- GitHub Release workflow with changelog generation
- Release promotion pipeline for production deployments

### Infrastructure
- Docker image digest pinning for immutable deployments
- Production tag management (prod-vX.Y.Z)
- Automated changelog generation from conventional commits

### CI/CD
- Release workflow with version bumping
- Promote release workflow for production promotion
- Integration with existing stage-and-promote pipeline

