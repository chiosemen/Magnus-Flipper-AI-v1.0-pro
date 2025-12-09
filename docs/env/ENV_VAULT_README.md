# Env Vault Pack – Magnus Flipper AI

## Overview

The Env Vault Pack centralizes all environment variables in one JSON vault file, making it easy to:
- Keep secrets organized and consistent across environments
- Generate `.env` files for local development
- Sync secrets to GitHub, Vercel, Azure, and other platforms
- Diff environments to catch missing variables

## Files

- **`secrets/env.vault.template.json`**  
  Template with placeholder values (safe to commit).

- **`secrets/env.vault.local.json`**  
  **REAL secrets. Never commit.** Git-ignored.  
  Source of truth for all environments.

- **`.cursor/agents/env_vault_keeper.json`**  
  Cursor agent definition.

- **`tools/env_vault_keeper.js`**  
  Implements:
  - Vault validation
  - Env diffs (local/staging/prod)
  - `.env`, `.env.staging`, `.env.production` generation
  - `ENV_SYNC_COMMANDS.sh` creation

- **`ENV_VAULT_STATUS.md`**  
  Generated status + diff report.

- **`ENV_SYNC_COMMANDS.sh`**  
  Generated sync commands for GitHub, Vercel, Azure.

## Setup

1. **Copy template → local vault:**

   ```bash
   cp secrets/env.vault.template.json secrets/env.vault.local.json
   ```

2. **Edit `secrets/env.vault.local.json`** with real values (local only, never commit)

3. **Verify `.gitignore`** includes:
   ```
   secrets/env.vault.local.json
   ENV_SYNC_COMMANDS.sh
   .env
   .env.staging
   .env.production
   ```

## Usage

### In Cursor

Run the Env Vault Keeper agent:

```
Run EnvVaultKeeper
```

This will:
- Validate the vault structure
- Detect missing keys between environments
- Generate `ENV_VAULT_STATUS.md` with diff report
- Generate `.env`, `.env.staging`, `.env.production` files
- Generate `ENV_SYNC_COMMANDS.sh` with platform-specific sync commands

### Manual Usage

You can also run the tool directly:

```bash
node tools/env_vault_keeper.js
```

## Workflow

### 1. Fill the vault once

Edit `secrets/env.vault.local.json` with the real Supabase, Stripe, Redis, Azure, OpenAI, etc. values for each environment.

### 2. Run Env Vault Keeper

In Cursor:
> `Run EnvVaultKeeper`

It will:
- Tell you which keys are missing between `local/staging/prod`  
- Generate `.env`, `.env.staging`, `.env.production`  
- Generate `ENV_SYNC_COMMANDS.sh`

### 3. Review outputs

- **`ENV_VAULT_STATUS.md`** → See missing/mismatched keys
- **`.env*`** → Used by local tools and workers
- **`ENV_SYNC_COMMANDS.sh`** → Run manually to sync GitHub/Vercel/Azure

### 4. Sync to platforms

Open `ENV_SYNC_COMMANDS.sh` and:

- Copy/paste the **GitHub** section into your terminal (with `gh` installed)  
- Copy/paste the **Vercel** section when you're in the project dir  
- Copy/paste the **Azure** section once `az` is logged in and pointing at your subscription

## Security

- **Never commit** `secrets/env.vault.local.json`
- Keep `.env*` files out of git (already in `.gitignore`)
- Review `ENV_SYNC_COMMANDS.sh` before running
- Secrets are never printed to console, only written to files

## Environment Structure

The vault supports three environments:

- **`local`** - Developer laptop / Cursor / local runs
- **`staging`** - Cloud staging environment
- **`production`** - Live app hitting real marketplaces

Each environment has its own `values` object with key-value pairs.

## Platform-Specific Variables

### GitHub Actions Secrets
- `SUPABASE_DB_URL`
- `SUPABASE_STAGING_DB_URL`
- `AZURE_*` credentials
- `VERCEL_TOKEN`
- API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`)

### Vercel Environment Variables
- `NEXT_PUBLIC_*` vars (public, safe for frontend)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `AI_GATEWAY_API_KEY`

### Azure Container Apps Secrets
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SUPABASE_DB_URL`
- `REDIS_URL`
- API keys

### Expo EAS Secrets
- `EXPO_PUBLIC_*` variables
- Run from `apps/mobile` directory

## Troubleshooting

### "Vault file not found"
Copy `secrets/env.vault.template.json` to `secrets/env.vault.local.json` and fill in values.

### "Environment missing or invalid"
Ensure all three environments (`local`, `staging`, `production`) exist in the vault with a `values` object.

### Missing keys in sync commands
Add the missing keys to the production environment in `secrets/env.vault.local.json` and run the keeper again.

## Future Enhancements

- **EnvDiffV2**: Compare just two environments and print a pretty diff
- **Vault encryption**: Encrypt the local vault file
- **Platform-specific validation**: Validate that required keys exist per platform
