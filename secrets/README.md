# Secrets Directory

This directory contains environment variable vault files.

## Quick Start

1. **Copy the template:**
   ```bash
   cp secrets/env.vault.template.json secrets/env.vault.local.json
   ```

2. **Edit `env.vault.local.json`** with your real secrets (never commit this file!)

3. **Run the Env Vault Keeper** in Cursor:
   ```
   Run EnvVaultKeeper
   ```

## Files

- `env.vault.template.json` - Template with placeholders (safe to commit)
- `env.vault.local.json` - Your real secrets (git-ignored, never commit!)

See `docs/env/ENV_VAULT_README.md` for full documentation.
