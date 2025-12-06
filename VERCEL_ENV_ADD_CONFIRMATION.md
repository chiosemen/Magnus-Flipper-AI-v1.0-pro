# Magnus Flipper – Vercel Production Env Variables Addition

**Generated:** December 6, 2025  
**Project:** magnus-flipper-web  
**Target:** Production environment only

---

## ✅ Validation Summary

### Variable Name Validation

All three environment variable names match exactly what the `apps/web` codebase expects:

| Variable Name | Codebase Usage | Status |
|--------------|----------------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Used in Stripe client initialization | **VALID** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Used in 12+ files (supabase clients, middleware, API routes) | **VALID** |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Used in 12+ files (supabase clients, middleware, API routes) | **VALID** |

### Value Format Validation

| Variable Name | Provided Value | Format Check | Status |
|--------------|----------------|--------------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SHXb9...` | ✅ Starts with `pk_live_` (Live key) | **VALID** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Valid JWT format | **VALID** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hfqhwdbdsvdbrorpnnbf.supabase.co` | ✅ Valid HTTPS URL, matches Supabase pattern | **VALID** |

### Collision Check

**Current State:**
- `vercel.json` references these variables with `@` syntax (e.g., `@supabase-url`), indicating they should be Vercel secrets
- No duplicate definitions found in codebase
- No conflicting values in `.env` files (none found in repo)

**Status:** ✅ **NO COLLISIONS DETECTED**

---

## 📋 Exact Vercel CLI Commands

Run these commands **one at a time** in your terminal. Each command will prompt you to paste the value.

### Command 1: Stripe Publishable Key

```bash
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
```

**When prompted, paste this value:**
```
pk_live_51SHXb9KqQqlLoDGp2RuiePPZRzJ8V3yLDreOydK35IKn1N8MozHpjYPXFpAIFeB4x3pQ9WjbVlgf9htGKBP73my700EIhliJuB
```

**Options to select:**
- Environment: `Production`
- Sensitive: `No` (NEXT_PUBLIC_ vars are safe to expose to client)

---

### Command 2: Supabase Anon Key

```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

**When prompted, paste this value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcWh3ZGJkc3ZkYnJvcnBubmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTY0NjgsImV4cCI6MjA3Nzc3MjQ2OH0.JKFmb7fekwR7EtIGr4DdwLYzBYX9xevfs4wdjoNG1Cw
```

**Options to select:**
- Environment: `Production`
- Sensitive: `No` (NEXT_PUBLIC_ vars are safe to expose to client)

---

### Command 3: Supabase URL

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

**When prompted, paste this value:**
```
https://hfqhwdbdsvdbrorpnnbf.supabase.co
```

**Options to select:**
- Environment: `Production`
- Sensitive: `No` (NEXT_PUBLIC_ vars are safe to expose to client)

---

## 🔍 Verification Commands

After adding all three variables, verify they're set correctly:

```bash
# List all production environment variables
vercel env ls production

# Verify specific variables exist
vercel env ls production | grep -E "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_URL"
```

---

## 📊 Environment Matrix Confirmation

# Magnus Flipper – Vercel Env Matrix (Updated)

| Variable Name                     | Target  | Scope   | Sensitive? | Status      | Value Preview                    |
|----------------------------------|---------|---------|------------|-------------|----------------------------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel  | Client  | No         | **TO ADD**  | `pk_live_51SHXb9...` (Live key)  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Vercel  | Client  | No         | **TO ADD**  | `eyJhbGciOiJIUzI1NiIs...` (JWT)  |
| `NEXT_PUBLIC_SUPABASE_URL`            | Vercel  | Client  | No         | **TO ADD**  | `https://hfqhwdbdsvdbrorpnnbf.supabase.co` |

**Status Legend:**
- **TO ADD** = Variable needs to be added via `vercel env add` command
- **Added/OK** = Variable successfully added and verified

---

## ⚠️ Important Notes

1. **No Code Changes Required**
   - The codebase already expects these exact variable names
   - No modifications to `.vercel/project.json` needed
   - `vercel.json` will automatically use these values once set

2. **Security**
   - All three variables are `NEXT_PUBLIC_*` (safe for client-side exposure)
   - They are NOT sensitive secrets
   - They will be embedded in the Next.js build output

3. **Environment Scope**
   - These commands add variables to **Production only**
   - Preview and Development environments are NOT affected
   - To add to other environments, run the same commands with `preview` or `development` instead of `production`

4. **Whitespace Handling**
   - Values have been validated for leading/trailing whitespace
   - All values are clean and ready to paste

5. **Next Steps After Adding**
   - Trigger a new production deployment: `vercel --prod`
   - Monitor deployment logs to ensure variables are loaded correctly
   - Verify the app works with these values

---

## ✅ Pre-Flight Checklist

Before running the commands:

- [ ] You are logged into Vercel CLI (`vercel login`)
- [ ] You are in the correct project directory
- [ ] You have the exact values ready to paste
- [ ] You understand these will be added to Production environment only

---

## 🚀 Execution Order

1. Run Command 1 (Stripe Publishable Key)
2. Run Command 2 (Supabase Anon Key)
3. Run Command 3 (Supabase URL)
4. Verify with `vercel env ls production`
5. Trigger deployment: `vercel --prod`

---

**END OF CONFIRMATION DOCUMENT**

