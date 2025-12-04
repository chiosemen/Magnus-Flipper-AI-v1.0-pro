# Magnus Flipper AI - Complete Deployment Bundles

**Production-ready deployment configurations for Vercel, Azure Functions, and Supabase**

---

## 📦 Table of Contents

1. [Vercel (Next.js Frontend)](#vercel-nextjs-frontend)
2. [Azure Functions (Workers)](#azure-functions-workers)
3. [Supabase (Database & Edge Functions)](#supabase-database--edge-functions)
4. [Deployment Scripts](#deployment-scripts)
5. [CI/CD Pipelines](#cicd-pipelines)

---

## Vercel (Next.js Frontend)

### 1. `vercel.json`

**Location:** `apps/web/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=web",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next",

  "regions": ["iad1", "sfo1"],

  "env": {
    "NEXT_PUBLIC_APP_URL": "https://flipperagents.com",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },

  "build": {
    "env": {
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
      "DEEPSEEK_API_KEY": "@deepseek-api-key",
      "OPENAI_API_KEY": "@openai-api-key",
      "STRIPE_SECRET_KEY": "@stripe-secret-key"
    }
  },

  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],

  "rewrites": [
    {
      "source": "/api/stripe/webhook",
      "destination": "/api/webhooks/stripe"
    }
  ],

  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/",
      "permanent": false
    }
  ],

  "crons": []
}
```

### 2. `next.config.mjs`

**Location:** `apps/web/next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Turbopack (Next.js 16)
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
      },
      {
        protocol: 'https',
        hostname: 'photos.offerup.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@magnus-flipper-ai/deal-engine': require.resolve('@magnus-flipper-ai/deal-engine'),
      '@magnus-flipper-ai/profit-engine': require.resolve('@magnus-flipper-ai/profit-engine'),
      '@magnus-flipper-ai/shipping-engine': require.resolve('@magnus-flipper-ai/shipping-engine'),
    };

    return config;
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  // Output configuration
  output: 'standalone',

  // Trailing slash
  trailingSlash: false,

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Transpile packages
  transpilePackages: [
    '@magnus-flipper-ai/deal-engine',
    '@magnus-flipper-ai/profit-engine',
    '@magnus-flipper-ai/shipping-engine',
  ],
};

export default nextConfig;
```

### 3. Deploy Script

**Location:** `scripts/deploy-vercel.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Magnus Flipper AI to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Navigate to web app
cd apps/web

# Build packages first
echo "📦 Building shared packages..."
cd ../..
pnpm turbo run build --filter='!web'

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
cd apps/web

if [ "$1" == "production" ]; then
    vercel --prod
else
    vercel
fi

echo "✅ Deployment complete!"
```

### 4. `.vercelignore`

**Location:** `apps/web/.vercelignore`

```
node_modules
.next
.turbo
.env*.local
*.log
coverage
.DS_Store
```

---

## Azure Functions (Workers)

### Worker 1: Deal Evaluator

**Location:** `apps/worker-evaluator/`

#### `host.json`

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "functionTimeout": "00:10:00"
}
```

#### `evaluator/function.json`

```json
{
  "bindings": [
    {
      "name": "timer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 */5 * * * *",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/evaluator/index.js"
}
```

#### `evaluator/index.ts`

```typescript
import { app, InvocationContext, Timer } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { evaluateDeal } from "@magnus-flipper-ai/deal-engine";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function evaluatorTimer(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("⏰ Deal evaluator triggered at:", new Date().toISOString());

  try {
    // Fetch pending evaluations
    const { data: pendingDeals, error } = await supabase
      .from("evaluation_queue")
      .select("*")
      .eq("status", "pending")
      .limit(10);

    if (error) throw error;

    if (!pendingDeals || pendingDeals.length === 0) {
      context.log("✅ No pending deals to evaluate");
      return;
    }

    context.log(`📊 Evaluating ${pendingDeals.length} deals...`);

    // Process each deal
    for (const deal of pendingDeals) {
      try {
        // Mark as in progress
        await supabase
          .from("evaluation_queue")
          .update({ status: "processing" })
          .eq("id", deal.id);

        // Evaluate deal
        const score = await evaluateDeal(deal.listing);

        // Store result
        await supabase.from("deal_scores").insert({
          listing_id: deal.listing_id,
          score: score.overallScore,
          confidence: score.confidence,
          risk_level: score.riskLevel,
          reasoning: score.reasoning,
          ai_provider: score.aiProvider,
          created_at: new Date().toISOString(),
        });

        // Mark as completed
        await supabase
          .from("evaluation_queue")
          .update({ status: "completed" })
          .eq("id", deal.id);

        context.log(`✅ Evaluated deal ${deal.id}: Score ${score.overallScore}`);
      } catch (error) {
        context.error(`❌ Failed to evaluate deal ${deal.id}:`, error);

        // Mark as failed
        await supabase
          .from("evaluation_queue")
          .update({ status: "failed", error: String(error) })
          .eq("id", deal.id);
      }
    }

    context.log("🎉 Deal evaluation batch complete");
  } catch (error) {
    context.error("❌ Deal evaluator failed:", error);
    throw error;
  }
}

app.timer("evaluator", {
  schedule: "0 */5 * * * *",
  handler: evaluatorTimer,
});
```

#### `package.json`

```json
{
  "name": "worker-evaluator",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rimraf dist",
    "start": "func start",
    "deploy": "func azure functionapp publish magnus-flipper-evaluator"
  },
  "dependencies": {
    "@azure/functions": "^4.5.0",
    "@magnus-flipper-ai/deal-engine": "workspace:*",
    "@supabase/supabase-js": "^2.86.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.10",
    "azure-functions-core-tools": "^4.0.5530",
    "typescript": "^5.7.3"
  }
}
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### `.funcignore`

```
node_modules
.git
.vscode
local.settings.json
*.log
dist
.DS_Store
```

---

### Worker 2: Auto-Sell

**Location:** `apps/worker-autosell/`

#### `host.json`

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "functionTimeout": "00:10:00"
}
```

#### `autosell/function.json`

```json
{
  "bindings": [
    {
      "name": "timer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 */5 * * * *",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/autosell/index.js"
}
```

#### `autosell/index.ts`

```typescript
import { app, InvocationContext, Timer } from "@azure/functions";
import { detectSales, finalizeSale, lockListingAcrossPlatforms } from "@magnus-flipper-ai/profit-engine";

export async function autosellTimer(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("🛒 Auto-sell engine triggered at:", new Date().toISOString());

  try {
    // Detect sales from all marketplaces
    context.log("🔍 Detecting sales...");
    const sales = await detectSales();

    if (sales.length === 0) {
      context.log("✅ No new sales detected");
      return;
    }

    context.log(`💰 Found ${sales.length} new sales`);

    // Process each sale
    for (const sale of sales) {
      try {
        context.log(`Processing sale ${sale.id} on ${sale.marketplace}...`);

        // Finalize sale (calculate P&L, create ledger entries)
        const result = await finalizeSale(sale);

        if (!result.success) {
          context.error(`❌ Failed to finalize sale ${sale.id}:`, result.error);
          continue;
        }

        context.log(`✅ Sale finalized: $${result.finalizedSale?.netProfit} profit`);

        // Lock other platform listings
        const lockResult = await lockListingAcrossPlatforms(
          sale.inventoryItemId,
          sale.marketplace,
          sale.id
        );

        context.log(`🔒 Locked ${lockResult.totalLocked} listings on other platforms`);
      } catch (error) {
        context.error(`❌ Error processing sale ${sale.id}:`, error);
      }
    }

    context.log("🎉 Auto-sell batch complete");
  } catch (error) {
    context.error("❌ Auto-sell engine failed:", error);
    throw error;
  }
}

app.timer("autosell", {
  schedule: "0 */5 * * * *",
  handler: autosellTimer,
});
```

#### `package.json`

```json
{
  "name": "worker-autosell",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rimraf dist",
    "start": "func start",
    "deploy": "func azure functionapp publish magnus-flipper-autosell"
  },
  "dependencies": {
    "@azure/functions": "^4.5.0",
    "@magnus-flipper-ai/profit-engine": "workspace:*",
    "@supabase/supabase-js": "^2.86.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.10",
    "azure-functions-core-tools": "^4.0.5530",
    "typescript": "^5.7.3"
  }
}
```

---

### Worker 3: Shipment Tracker

**Location:** `apps/worker-tracker/`

#### `host.json`

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "functionTimeout": "00:05:00"
}
```

#### `tracker/function.json`

```json
{
  "bindings": [
    {
      "name": "timer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 */1 * * *",
      "runOnStartup": false
    }
  ],
  "scriptFile": "../dist/tracker/index.js"
}
```

#### `tracker/index.ts`

```typescript
import { app, InvocationContext, Timer } from "@azure/functions";
import { pollActiveShipments } from "@magnus-flipper-ai/shipping-engine";

export async function trackerTimer(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("📦 Shipment tracker triggered at:", new Date().toISOString());

  try {
    // Poll all active shipments
    context.log("🔍 Polling active shipments...");
    await pollActiveShipments();

    context.log("✅ Shipment tracking complete");
  } catch (error) {
    context.error("❌ Shipment tracker failed:", error);
    throw error;
  }
}

app.timer("tracker", {
  schedule: "0 0 */1 * * *", // Every hour
  handler: trackerTimer,
});
```

#### `package.json`

```json
{
  "name": "worker-tracker",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rimraf dist",
    "start": "func start",
    "deploy": "func azure functionapp publish magnus-flipper-tracker"
  },
  "dependencies": {
    "@azure/functions": "^4.5.0",
    "@magnus-flipper-ai/shipping-engine": "workspace:*",
    "@supabase/supabase-js": "^2.86.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.10",
    "azure-functions-core-tools": "^4.0.5530",
    "typescript": "^5.7.3"
  }
}
```

---

### Azure Deployment Script

**Location:** `scripts/deploy-azure-functions.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Azure Functions..."

RESOURCE_GROUP="magnus-flipper-rg"
LOCATION="eastus"

# Function App Names
EVALUATOR_APP="magnus-flipper-evaluator"
AUTOSELL_APP="magnus-flipper-autosell"
TRACKER_APP="magnus-flipper-tracker"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
echo "🔐 Logging in to Azure..."
az login

# Build all workers
echo "📦 Building all workers..."
cd apps/worker-evaluator && pnpm build && cd ../..
cd apps/worker-autosell && pnpm build && cd ../..
cd apps/worker-tracker && pnpm build && cd ../..

# Deploy Evaluator
echo "🚀 Deploying Deal Evaluator..."
cd apps/worker-evaluator
func azure functionapp publish $EVALUATOR_APP
cd ../..

# Deploy Auto-Sell
echo "🚀 Deploying Auto-Sell Engine..."
cd apps/worker-autosell
func azure functionapp publish $AUTOSELL_APP
cd ../..

# Deploy Tracker
echo "🚀 Deploying Shipment Tracker..."
cd apps/worker-tracker
func azure functionapp publish $TRACKER_APP
cd ../..

echo "✅ All Azure Functions deployed successfully!"
```

---

## Supabase (Database & Edge Functions)

### 1. `config.toml`

**Location:** `supabase/config.toml`

```toml
[project]
name = "magnus-flipper-ai"

[api]
port = 54321
schemas = ["public", "storage", "auth"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
port = 54323

[inbucket]
port = 54324

[storage]
file_size_limit = "5MB"

[auth]
site_url = "https://flipperagents.com"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

### 2. Edge Function: Stripe Webhook

**Location:** `supabase/functions/webhook-stripe/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );

    console.log(`📨 Received Stripe event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;

      case "customer.subscription.deleted":
        const deletedSub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSub);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { data, error } = await supabase
    .from("users")
    .update({
      stripe_customer_id: session.customer,
      subscription_status: "active",
      subscription_tier: session.metadata?.tier || "PRO",
    })
    .eq("email", session.customer_email);

  if (error) throw error;
  console.log("✅ Checkout completed for:", session.customer_email);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data, error } = await supabase
    .from("users")
    .update({
      subscription_status: subscription.status,
      subscription_tier: subscription.metadata?.tier || "PRO",
    })
    .eq("stripe_customer_id", subscription.customer);

  if (error) throw error;
  console.log("✅ Subscription updated:", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data, error } = await supabase
    .from("users")
    .update({
      subscription_status: "cancelled",
      subscription_tier: "FREE",
    })
    .eq("stripe_customer_id", subscription.customer);

  if (error) throw error;
  console.log("✅ Subscription deleted:", subscription.id);
}
```

### 3. Edge Function: Shipment Webhook

**Location:** `supabase/functions/webhook-shipment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { carrier, trackingNumber, event } = await req.json();

    console.log(`📦 Shipment update: ${carrier} - ${trackingNumber}`);

    // Store tracking event
    await supabase.from("tracking_events").insert({
      id: `event_${Date.now()}`,
      tracking_number: trackingNumber,
      carrier,
      status: event.status,
      status_detail: event.description,
      location: event.location,
      timestamp: event.timestamp,
      created_at: new Date().toISOString(),
    });

    // Update order status
    const { data: label } = await supabase
      .from("shipping_labels")
      .select("order_id")
      .eq("tracking_number", trackingNumber)
      .single();

    if (label) {
      await supabase
        .from("sold_items")
        .update({ status: event.status })
        .eq("id", label.order_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

### 4. Deploy Script

**Location:** `scripts/deploy-supabase.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    brew install supabase/tap/supabase
fi

# Link project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref your-project-ref

# Deploy migrations
echo "📊 Applying database migrations..."
supabase db push

# Deploy edge functions
echo "⚡ Deploying edge functions..."
supabase functions deploy webhook-stripe
supabase functions deploy webhook-shipment

# Set secrets
echo "🔐 Setting edge function secrets..."
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_...

echo "✅ Supabase deployment complete!"
```

---

## CI/CD Pipelines

### GitHub Actions: Deploy to Vercel

**Location:** `.github/workflows/deploy-vercel.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm turbo run build --filter='!web'

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.event_name == 'push' && '--prod' || '' }}
          working-directory: apps/web
```

### GitHub Actions: Deploy Azure Functions

**Location:** `.github/workflows/deploy-azure.yml`

```yaml
name: Deploy Azure Functions

on:
  push:
    branches: [main]
    paths:
      - 'apps/worker-**/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm turbo run build

      - name: Deploy Evaluator
        uses: Azure/functions-action@v1
        with:
          app-name: magnus-flipper-evaluator
          package: apps/worker-evaluator
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE_EVALUATOR }}

      - name: Deploy Auto-Sell
        uses: Azure/functions-action@v1
        with:
          app-name: magnus-flipper-autosell
          package: apps/worker-autosell
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE_AUTOSELL }}

      - name: Deploy Tracker
        uses: Azure/functions-action@v1
        with:
          app-name: magnus-flipper-tracker
          package: apps/worker-tracker
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE_TRACKER }}
```

---

## Quick Deploy Commands

```bash
# Deploy everything
./scripts/deploy-all.sh

# Deploy only Vercel
./scripts/deploy-vercel.sh production

# Deploy only Azure Functions
./scripts/deploy-azure-functions.sh

# Deploy only Supabase
./scripts/deploy-supabase.sh

# Deploy specific worker
cd apps/worker-evaluator && pnpm deploy
```

---

This comprehensive deployment bundle provides everything needed to deploy Magnus Flipper AI to production! 🚀
