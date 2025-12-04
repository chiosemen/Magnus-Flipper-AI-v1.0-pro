# SUPABASE DEPLOYMENT PLAN

**Last Updated**: 2024-01-15  
**Purpose**: Supabase database, auth, and storage configuration for production

---

## DATABASE SCHEMA VERIFICATION

### Prisma Schema

The database schema is managed via Prisma. Verify:

- [ ] `packages/core/prisma/schema.prisma` is up to date
- [ ] All migrations applied to production database
- [ ] Schema matches application requirements

### Key Tables

Verify these tables exist and have correct structure:

- `users` - User accounts
- `inventory` - Inventory items
- `listings` - Marketplace listings
- `sold_items` - Completed sales
- `shipping_labels` - Shipping labels
- `tracking_events` - Shipment tracking
- `ledger_entries` - Financial ledger
- `subscriptions` - User subscriptions
- `marketplace_credentials` - API credentials
- `worker_logs` - Worker execution logs
- `sale_events` - Sale detection events
- `ev_corrections` - EV correction data
- `historical_stats` - Historical statistics
- `portfolio_snapshots` - Portfolio snapshots

### Migration Strategy

1. **Development**:
   ```bash
   pnpm generate
   pnpm prisma migrate dev
   ```

2. **Production**:
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Verify**:
   ```bash
   pnpm prisma db pull
   ```

---

## ROW LEVEL SECURITY (RLS) REVIEW

### RLS Policy Checklist

Enable RLS on all tables and verify policies:

#### `users` Table
- [ ] RLS enabled
- [ ] Users can read their own data
- [ ] Users can update their own data
- [ ] Service role can read/write all (for admin operations)

#### `inventory` Table
- [ ] RLS enabled
- [ ] Users can read/write their own inventory
- [ ] Service role can read/write all

#### `listings` Table
- [ ] RLS enabled
- [ ] Users can read/write their own listings
- [ ] Public read access for active listings (if needed)
- [ ] Service role can read/write all

#### `sold_items` Table
- [ ] RLS enabled
- [ ] Users can read their own sold items
- [ ] Service role can read/write all

#### `shipping_labels` Table
- [ ] RLS enabled
- [ ] Users can read their own shipping labels
- [ ] Service role can read/write all

#### `ledger_entries` Table
- [ ] RLS enabled
- [ ] Users can read their own ledger entries
- [ ] Service role can read/write all

#### `subscriptions` Table
- [ ] RLS enabled
- [ ] Users can read their own subscriptions
- [ ] Service role can read/write all

### Policy Examples

```sql
-- Example: Users can only read their own inventory
CREATE POLICY "Users can read own inventory"
ON inventory FOR SELECT
USING (auth.uid() = user_id);

-- Example: Service role has full access
CREATE POLICY "Service role full access"
ON inventory FOR ALL
USING (auth.role() = 'service_role');
```

---

## STORAGE BUCKETS

### Required Buckets

Configure these storage buckets:

1. **`shipping-labels`**
   - **Purpose**: Store shipping label PDFs
   - **Public**: No (private)
   - **File Size Limit**: 10MB
   - **Allowed MIME Types**: `application/pdf`
   - **Policies**:
     - Users can upload their own labels
     - Users can read their own labels
     - Service role has full access

2. **`inventory-images`** (if applicable)
   - **Purpose**: Store inventory item images
   - **Public**: Yes (with signed URLs)
   - **File Size Limit**: 5MB
   - **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`

3. **`user-uploads`** (if applicable)
   - **Purpose**: User-uploaded files
   - **Public**: No
   - **File Size Limit**: 10MB

### Bucket Configuration

1. Create buckets in Supabase dashboard
2. Configure policies:
   ```sql
   -- Example: Shipping labels bucket policy
   CREATE POLICY "Users can upload own labels"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'shipping-labels' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

---

## SERVICE ROLE USAGE

### When to Use Service Role Key

**Use service role key for**:
- Server-side operations (API routes, workers)
- Admin operations
- Bypassing RLS when necessary
- Webhook handlers (Stripe → Supabase)

**Never use service role key for**:
- Client-side code
- Public API endpoints
- User-facing operations

### Implementation

```typescript
// Server-side (API route, worker)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key
);

// Client-side (React components)
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Anon key
);
```

---

## WEBHOOKS FROM STRIPE TO SUPABASE

### Webhook Flow

1. **Stripe** → Sends webhook event
2. **Vercel API Route** (`/api/stripe/webhook`) → Receives webhook
3. **Supabase** → Updates database via service role client

### Webhook Handler

The webhook handler in `apps/web/app/api/stripe/webhook/route.ts`:
- Verifies webhook signature
- Processes subscription events
- Updates Supabase `subscriptions` table
- Updates user tier in `users` table

### Database Updates

Webhook events update:
- `subscriptions` table (create/update/delete)
- `users.subscription_tier` field
- `ledger_entries` table (for payment records)

### Testing

Test webhook events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## AUTHENTICATION CONFIGURATION

### Auth Providers

Configure in Supabase dashboard:

- [ ] Email/Password authentication enabled
- [ ] Email confirmation required (recommended)
- [ ] Password reset enabled
- [ ] OAuth providers (if applicable):
  - [ ] Google
  - [ ] GitHub
  - [ ] Apple

### Auth Policies

- [ ] Email confirmation required for new signups
- [ ] Password requirements configured
- [ ] Rate limiting enabled
- [ ] Session timeout configured

---

## DATABASE BACKUP

### Backup Strategy

1. **Automatic Backups**: Supabase provides daily backups
2. **Point-in-Time Recovery**: Available on paid plans
3. **Manual Backups**: Export via Supabase dashboard

### Backup Verification

- [ ] Automatic backups enabled
- [ ] Backup retention period configured
- [ ] Test restore procedure documented

---

## PERFORMANCE OPTIMIZATION

### Indexes

Verify indexes exist on:
- `users.id` (primary key)
- `inventory.user_id`
- `listings.user_id`
- `sold_items.user_id`
- `shipping_labels.tracking_number`
- `ledger_entries.user_id`
- `subscriptions.user_id`

### Query Optimization

- [ ] Use indexes for common queries
- [ ] Avoid N+1 queries
- [ ] Use connection pooling
- [ ] Monitor slow queries

---

## MONITORING

### Supabase Dashboard

Monitor:
- Database size
- API requests
- Storage usage
- Auth usage
- Realtime connections

### Alerts

Set up alerts for:
- High database usage
- Failed auth attempts
- Storage quota warnings
- API rate limit warnings

---

## SECURITY CHECKLIST

- [ ] RLS enabled on all tables
- [ ] Service role key stored securely (never in client)
- [ ] Anon key safe for client use (RLS protects data)
- [ ] Storage bucket policies configured
- [ ] Auth policies configured
- [ ] Database backups enabled
- [ ] Connection pooling enabled
- [ ] SSL/TLS enforced

---

## TROUBLESHOOTING

### Common Issues

1. **RLS Blocking Queries**:
   - Check policy conditions
   - Verify user authentication
   - Use service role for admin operations

2. **Connection Issues**:
   - Verify connection string
   - Check firewall rules
   - Verify credentials

3. **Storage Upload Failures**:
   - Check bucket policies
   - Verify file size limits
   - Check MIME type restrictions

---

## NEXT STEPS

1. ✅ Review database schema
2. ✅ Apply migrations
3. ✅ Configure RLS policies
4. ✅ Set up storage buckets
5. ✅ Configure auth providers
6. ✅ Test webhook integration
7. ✅ Enable backups
8. ✅ Set up monitoring

---

**END OF SUPABASE DEPLOYMENT PLAN**

