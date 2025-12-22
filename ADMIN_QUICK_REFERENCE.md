# Admin Security - Quick Reference

Fast reference for common admin security operations.

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Deploy database trigger
cd supabase && supabase db push

# 2. Activate middleware
cd apps/web
mv middleware-admin-example.ts middleware.ts

# 3. Set environment variable
vercel env add ADMIN_BOOTSTRAP_ENABLED production
# Enter: true

# 4. Deploy
git add . && git commit -m "feat: admin security" && git push

# 5. Bootstrap admin (ONE TIME)
curl -X POST https://your-app.vercel.app/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email": "chinye.osemene@icloud.com"}'

# 6. Disable bootstrap
vercel env add ADMIN_BOOTSTRAP_ENABLED production
# Enter: false

# 7. Redeploy
vercel --prod
```

---

## 📝 Code Snippets

### Protect an Admin Page
```typescript
import { requireAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin(); // ✅ Add this line
  return <div>Admin content for {admin.email}</div>;
}
```

### Protect an Admin API Route
```typescript
import { requireAdminAPI } from '@/lib/auth/admin-guard';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await requireAdminAPI(); // ✅ Add this
  if (result instanceof NextResponse) return result;

  const { user } = result;
  return NextResponse.json({ data: 'admin-only' });
}
```

### Check Admin Status (Non-Throwing)
```typescript
import { checkIsAdmin } from '@/lib/auth/admin-guard';

export default async function MaybePage() {
  const admin = await checkIsAdmin(); // ✅ Returns null if not admin

  return (
    <div>
      {admin ? <AdminUI /> : <RegularUI />}
    </div>
  );
}
```

---

## 🔍 SQL Queries

### Check if trigger is installed
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';
```

### Check if user is admin
```sql
SELECT id, email, role, is_admin
FROM public.profiles
WHERE email = 'chinye.osemene@icloud.com';
```

### List all admins
```sql
SELECT id, email, role, created_at
FROM public.profiles
WHERE is_admin = true
ORDER BY created_at;
```

### Promote user to admin (manual, via SQL)
```sql
UPDATE public.profiles
SET role = 'admin', is_admin = true
WHERE email = 'user@example.com';
```

### Demote admin to user
```sql
UPDATE public.profiles
SET role = 'user', is_admin = false
WHERE email = 'admin@example.com';
```

---

## 🛠️ Common Commands

### Deploy database changes
```bash
supabase db push
```

### Set environment variable (Vercel)
```bash
vercel env add ADMIN_BOOTSTRAP_ENABLED production
```

### Check environment variable (Vercel)
```bash
vercel env ls
```

### Remove environment variable (Vercel)
```bash
vercel env rm ADMIN_BOOTSTRAP_ENABLED production
```

### Test admin route protection
```bash
# Should return 401
curl https://your-app.vercel.app/api/admin/example

# Should return 403 (if non-admin)
curl https://your-app.vercel.app/api/admin/example \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Emergency Procedures

### Revoke admin access
```sql
UPDATE public.profiles
SET role = 'user', is_admin = false
WHERE id = 'USER_ID_HERE';
```

### Disable all non-essential admins
```sql
UPDATE public.profiles
SET role = 'user', is_admin = false
WHERE is_admin = true
  AND email NOT IN ('chinye.osemene@icloud.com');
```

### Check recent admin logins
```sql
-- Requires auth.audit_log_entries (if enabled)
SELECT *
FROM auth.audit_log_entries
WHERE payload->>'user_id' IN (
  SELECT id::text FROM public.profiles WHERE is_admin = true
)
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚨 Security Incidents

### Unauthorized admin access detected

1. **Immediate:**
   ```sql
   -- Revoke suspected account
   UPDATE public.profiles
   SET is_admin = false, role = 'user'
   WHERE id = 'SUSPECTED_USER_ID';
   ```

2. **Investigate:**
   - Check Vercel logs
   - Check Supabase auth logs
   - Review recent profile changes

3. **Prevent:**
   - Rotate `SUPABASE_SERVICE_ROLE_KEY`
   - Review environment variables
   - Audit admin list

### Bootstrap route exposed in production

1. **Immediate:**
   ```bash
   vercel env add ADMIN_BOOTSTRAP_ENABLED production
   # Enter: false
   vercel --prod
   ```

2. **Verify disabled:**
   ```bash
   curl https://your-app.vercel.app/admin/bootstrap
   # Should return: "Bootstrap endpoint is DISABLED"
   ```

3. **Delete route:**
   ```bash
   rm apps/web/app/admin/bootstrap/route.ts
   git commit -m "chore: remove bootstrap route"
   git push
   ```

---

## 📊 Monitoring Queries

### Count admins
```sql
SELECT COUNT(*) FROM public.profiles WHERE is_admin = true;
```

### Count users created today
```sql
SELECT COUNT(*)
FROM public.profiles
WHERE created_at::date = CURRENT_DATE;
```

### Check for profiles without auth users (orphaned)
```sql
SELECT p.id, p.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;
```

### Check for auth users without profiles
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

---

## 🔗 Quick Links

- **Full Guide:** `ADMIN_SECURITY_IMPLEMENTATION.md`
- **Profiles Deployment:** `supabase/PROFILES_DEPLOYMENT.md`
- **Admin Guard:** `apps/web/lib/auth/admin-guard.ts`
- **Middleware:** `apps/web/middleware.ts`
- **Bootstrap Route:** `apps/web/app/admin/bootstrap/route.ts`

---

**Last Updated:** 2025-12-22
