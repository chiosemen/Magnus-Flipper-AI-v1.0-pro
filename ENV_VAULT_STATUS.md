# Magnus Env Vault Status

Generated: 2025-12-09T18:37:26.342Z

## Environments

- **local**: 43 keys
- **staging**: 41 keys
- **production**: 42 keys

## Key Differences

### local vs staging

- Only in local: EXPO_PROJECT_TOKEN, EXPO_ROBOT_TOKEN
- Only in staging: —

### staging vs production

- Only in staging: —
- Only in production: ALLOWED_ORIGINS

### local vs production

- Only in local: EXPO_PROJECT_TOKEN, EXPO_ROBOT_TOKEN
- Only in production: ALLOWED_ORIGINS

## Notes

- Keep SERVICE_ROLE and DB URLs server-side only (GitHub, Azure, workers).
- NEXT_PUBLIC_* vars are for Vercel / frontend only.
- Passwords in URLs must be URL-encoded for special chars.
