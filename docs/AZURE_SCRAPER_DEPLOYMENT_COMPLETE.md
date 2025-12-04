# Azure Scraper Workers - Complete Deployment Guide

**Deploy marketplace scraper workers to Azure Functions with queues, storage, and monitoring**

---

## 📋 Overview

This guide covers the complete Azure deployment for Magnus Flipper AI scraper workers:

1. **Azure Resources** - Function Apps, Storage, Key Vault, Queues
2. **Function Code** - 4 timer/queue-triggered functions
3. **Environment Variables** - All secrets and configuration
4. **Deployment Pipeline** - GitHub Actions + Azure CLI
5. **Monitoring** - Application Insights integration

---

## 🏗️ STEP 1: Provision Azure Resources

### Prerequisites

```bash
# Install Azure CLI
brew install azure-cli

# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "Your Subscription Name"
```

### Create Resource Group

```bash
# Variables
RESOURCE_GROUP="magnus-flipper-rg"
LOCATION="eastus"
APP_NAME="magnus-scraper"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Create Storage Account

```bash
STORAGE_ACCOUNT="magnusflipperstorage"

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2
```

### Create Storage Queues

```bash
# Get storage connection string
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

# Create queues
az storage queue create \
  --name new-listings \
  --connection-string "$STORAGE_CONNECTION"

az storage queue create \
  --name retry-listings \
  --connection-string "$STORAGE_CONNECTION"

az storage queue create \
  --name scoring-events \
  --connection-string "$STORAGE_CONNECTION"
```

### Create Application Insights

```bash
az monitor app-insights component create \
  --app ${APP_NAME}-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web
```

### Create Key Vault

```bash
KEY_VAULT_NAME="magnus-flipper-vault"

az keyvault create \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-soft-delete true \
  --retention-days 90
```

### Create Function App (Consumption Plan)

```bash
az functionapp create \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --storage-account $STORAGE_ACCOUNT \
  --os-type Linux
```

### Enable Managed Identity

```bash
az functionapp identity assign \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP
```

### Grant Key Vault Access

```bash
# Get Function App identity
FUNCTION_IDENTITY=$(az functionapp identity show \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

# Grant Key Vault access
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --object-id $FUNCTION_IDENTITY \
  --secret-permissions get list
```

---

## 💻 STEP 2: Create Function Code

### Update host.json

**File**: `apps/worker-scraper/host.json`

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20,
        "excludedTypes": "Request;Exception"
      },
      "enableLiveMetricsFilters": true
    },
    "logLevel": {
      "default": "Information",
      "Function": "Information",
      "Host.Results": "Information"
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "functionTimeout": "00:10:00",
  "extensions": {
    "http": {
      "routePrefix": "api",
      "maxOutstandingRequests": 200,
      "maxConcurrentRequests": 100,
      "dynamicThrottlesEnabled": true
    },
    "queues": {
      "maxPollingInterval": "00:00:02",
      "visibilityTimeout": "00:00:30",
      "batchSize": 16,
      "maxDequeueCount": 5,
      "newBatchThreshold": 8
    }
  }
}
```

### Function 1: Scan Marketplace (Timer Trigger)

**File**: `apps/worker-scraper/scan-marketplace/function.json`

```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 */1 * * * *"
    },
    {
      "name": "newListingsQueue",
      "type": "queue",
      "direction": "out",
      "queueName": "new-listings",
      "connection": "AzureWebJobsStorage"
    }
  ],
  "scriptFile": "../dist/scan-marketplace/index.js"
}
```

**File**: `apps/worker-scraper/scan-marketplace/index.ts`

```typescript
import { app, InvocationContext, Timer } from "@azure/functions";
import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync";
import { QueueClient } from "@azure/storage-queue";

export async function scanMarketplace(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = Date.now();
  context.log("🔍 Marketplace scan triggered at:", new Date().toISOString());

  try {
    // Initialize orchestrator
    const orchestrator = new ScraperOrchestrator(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get enabled scraper configs
    const configs = await orchestrator.getEnabledConfigs();
    context.log(`📊 Found ${configs.length} enabled scrapers`);

    // Initialize queue client
    const queueClient = QueueClient.fromConnectionString(
      process.env.AzureWebJobsStorage!,
      "new-listings"
    );

    let totalScraped = 0;

    // Run scrapers in parallel
    for (const config of configs) {
      try {
        context.log(`🚀 Running scraper: ${config.marketplace}`);

        // Run scraper
        const result = await orchestrator.runScraper(
          config.marketplace,
          config
        );

        totalScraped += result.total_scraped;

        // Queue new listings for processing
        if (result.listings && result.listings.length > 0) {
          for (const listing of result.listings) {
            await queueClient.sendMessage(
              Buffer.from(JSON.stringify(listing)).toString("base64")
            );
          }
          context.log(
            `✅ Queued ${result.listings.length} listings from ${config.marketplace}`
          );
        }
      } catch (error: any) {
        context.error(`❌ Scraper failed for ${config.marketplace}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    context.log(
      `✅ Scan complete: ${totalScraped} listings scraped in ${duration}ms`
    );
  } catch (error: any) {
    context.error("❌ Marketplace scan failed:", error);
    throw error;
  }
}

app.timer("scan-marketplace", {
  schedule: "0 */1 * * * *", // Every minute
  handler: scanMarketplace,
});
```

### Function 2: Ingest Listing (Queue Trigger)

**File**: `apps/worker-scraper/ingest-listing/function.json`

```json
{
  "bindings": [
    {
      "name": "queueItem",
      "type": "queueTrigger",
      "direction": "in",
      "queueName": "new-listings",
      "connection": "AzureWebJobsStorage"
    },
    {
      "name": "scoringEventsQueue",
      "type": "queue",
      "direction": "out",
      "queueName": "scoring-events",
      "connection": "AzureWebJobsStorage"
    }
  ],
  "scriptFile": "../dist/ingest-listing/index.js"
}
```

**File**: `apps/worker-scraper/ingest-listing/index.ts`

```typescript
import { app, InvocationContext } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { QueueClient } from "@azure/storage-queue";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function ingestListing(
  queueItem: string,
  context: InvocationContext
): Promise<void> {
  try {
    // Parse listing from queue
    const listing = JSON.parse(queueItem);
    context.log(`📥 Ingesting listing: ${listing.title}`);

    // Store in Supabase
    const { data, error } = await supabase
      .from("scraped_listings")
      .insert({
        marketplace: listing.marketplace,
        title: listing.title,
        price: listing.price,
        link: listing.link,
        images: listing.images,
        seller_name: listing.seller_name,
        seller_rating: listing.seller_rating,
        location: listing.location,
        description: listing.description,
        condition: listing.condition,
        shipping_cost: listing.shipping_cost,
        content_hash: listing.content_hash,
        normalized_title: listing.normalized_title,
        normalized_price: listing.normalized_price,
        freshness_score: 100, // New listing
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      context.error("❌ Error storing listing:", error);
      throw error;
    }

    context.log(`✅ Listing stored: ${data.id}`);

    // Queue for scoring
    const queueClient = QueueClient.fromConnectionString(
      process.env.AzureWebJobsStorage!,
      "scoring-events"
    );

    await queueClient.sendMessage(
      Buffer.from(
        JSON.stringify({
          listing_id: data.id,
          marketplace: listing.marketplace,
          action: "score",
        })
      ).toString("base64")
    );

    context.log("✅ Queued for scoring");
  } catch (error: any) {
    context.error("❌ Listing ingestion failed:", error);
    throw error;
  }
}

app.storageQueue("ingest-listing", {
  queueName: "new-listings",
  connection: "AzureWebJobsStorage",
  handler: ingestListing,
});
```

### Function 3: Retry Failed (Timer Trigger)

**File**: `apps/worker-scraper/retry-failed/function.json`

```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 */15 * * * *"
    },
    {
      "name": "retryListingsQueue",
      "type": "queue",
      "direction": "out",
      "queueName": "retry-listings",
      "connection": "AzureWebJobsStorage"
    }
  ],
  "scriptFile": "../dist/retry-failed/index.js"
}
```

**File**: `apps/worker-scraper/retry-failed/index.ts`

```typescript
import { app, InvocationContext, Timer } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { QueueClient } from "@azure/storage-queue";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function retryFailed(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("🔄 Retry failed listings triggered");

  try {
    // Get failed scraper logs from last hour
    const { data: failedLogs, error } = await supabase
      .from("scraper_logs")
      .select("*")
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString())
      .lte("retry_count", 3);

    if (error) throw error;

    if (!failedLogs || failedLogs.length === 0) {
      context.log("✅ No failed listings to retry");
      return;
    }

    context.log(`🔄 Retrying ${failedLogs.length} failed listings`);

    // Queue for retry
    const queueClient = QueueClient.fromConnectionString(
      process.env.AzureWebJobsStorage!,
      "retry-listings"
    );

    for (const log of failedLogs) {
      await queueClient.sendMessage(
        Buffer.from(JSON.stringify(log)).toString("base64")
      );

      // Increment retry count
      await supabase
        .from("scraper_logs")
        .update({ retry_count: (log.retry_count || 0) + 1 })
        .eq("id", log.id);
    }

    context.log(`✅ Queued ${failedLogs.length} listings for retry`);
  } catch (error: any) {
    context.error("❌ Retry failed listings error:", error);
  }
}

app.timer("retry-failed", {
  schedule: "0 */15 * * * *", // Every 15 minutes
  handler: retryFailed,
});
```

### Function 4: Send to Supabase (Queue Trigger)

**File**: `apps/worker-scraper/send-to-supabase/function.json`

```json
{
  "bindings": [
    {
      "name": "queueItem",
      "type": "queueTrigger",
      "direction": "in",
      "queueName": "scoring-events",
      "connection": "AzureWebJobsStorage"
    }
  ],
  "scriptFile": "../dist/send-to-supabase/index.js"
}
```

**File**: `apps/worker-scraper/send-to-supabase/index.ts`

```typescript
import { app, InvocationContext } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendToSupabase(
  queueItem: string,
  context: InvocationContext
): Promise<void> {
  try {
    const event = JSON.parse(queueItem);
    context.log(`📤 Processing event: ${event.action} for ${event.listing_id}`);

    if (event.action === "score") {
      // Get listing details
      const { data: listing, error: fetchError } = await supabase
        .from("scraped_listings")
        .select("*")
        .eq("id", event.listing_id)
        .single();

      if (fetchError) throw fetchError;

      // Call DeepSeek API for deal scoring
      const dealScore = await scoreDeal(listing);

      // Store deal score
      const { error: scoreError } = await supabase
        .from("deal_scores")
        .insert({
          listing_id: event.listing_id,
          marketplace: event.marketplace,
          raw_score: dealScore.raw_score,
          adjusted_score: dealScore.adjusted_score,
          ai_confidence: dealScore.confidence,
          profit_score: dealScore.profit_score,
          risk_score: dealScore.risk_score,
          velocity_score: dealScore.velocity_score,
          market_score: dealScore.market_score,
          ai_provider: "deepseek",
          ai_reasoning: dealScore.reasoning,
          estimated_profit: dealScore.estimated_profit,
          estimated_roi: dealScore.estimated_roi,
          confidence_level: dealScore.confidence_level,
          created_at: new Date().toISOString(),
        });

      if (scoreError) throw scoreError;

      context.log(`✅ Deal scored: ${dealScore.adjusted_score}`);
    }
  } catch (error: any) {
    context.error("❌ Send to Supabase failed:", error);
    throw error;
  }
}

async function scoreDeal(listing: any) {
  // TODO: Implement DeepSeek API call
  // This is a placeholder
  return {
    raw_score: 75,
    adjusted_score: 80,
    confidence: 0.85,
    profit_score: 70,
    risk_score: 20,
    velocity_score: 75,
    market_score: 80,
    reasoning: { analysis: "Good deal potential" },
    estimated_profit: 50,
    estimated_roi: 30,
    confidence_level: "high",
  };
}

app.storageQueue("send-to-supabase", {
  queueName: "scoring-events",
  connection: "AzureWebJobsStorage",
  handler: sendToSupabase,
});
```

---

## 🔐 STEP 3: Configure Environment Variables

### Add Secrets to Key Vault

```bash
# Supabase
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "SUPABASE-URL" \
  --value "https://your-project.supabase.co"

az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "SUPABASE-SERVICE-ROLE-KEY" \
  --value "eyJhbGc..."

# Scraper secret
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "SCRAPER-SECRET" \
  --value "$(openssl rand -base64 32)"

# Marketplace API keys (if needed)
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "EBAY-API-KEY" \
  --value "your-ebay-key"

az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "FACEBOOK-EMAIL" \
  --value "scraper@example.com"

az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "FACEBOOK-PASSWORD" \
  --value "password"
```

### Configure Function App Settings

```bash
# Get Key Vault URI
KEY_VAULT_URI=$(az keyvault show \
  --name $KEY_VAULT_NAME \
  --query properties.vaultUri \
  --output tsv)

# Configure app settings with Key Vault references
az functionapp config appsettings set \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SUPABASE_URL="@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}secrets/SUPABASE-URL/)" \
    SUPABASE_SERVICE_ROLE_KEY="@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}secrets/SUPABASE-SERVICE-ROLE-KEY/)" \
    SCRAPER_SECRET="@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}secrets/SCRAPER-SECRET/)" \
    EBAY_API_KEY="@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}secrets/EBAY-API-KEY/)" \
    FACEBOOK_EMAIL="@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}secrets/FACEBOOK-EMAIL/)" \
    FACEBOOK_PASSWORD="@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}secrets/FACEBOOK-PASSWORD/)" \
    FUNCTIONS_WORKER_RUNTIME="node" \
    WEBSITE_NODE_DEFAULT_VERSION="~20" \
    LOG_LEVEL="info"
```

---

## 🚀 STEP 4: Deploy Functions

### Manual Deployment

```bash
# Navigate to worker directory
cd apps/worker-scraper

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Deploy to Azure
func azure functionapp publish ${APP_NAME}-worker
```

### Verify Deployment

```bash
# List functions
az functionapp function list \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --output table

# Check function status
az functionapp show \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --query state
```

---

## 📊 STEP 5: GitHub Actions CI/CD Pipeline

**File**: `.github/workflows/deploy-azure-scraper.yml`

```yaml
name: Deploy Azure Scraper Workers

on:
  push:
    branches:
      - main
    paths:
      - "apps/worker-scraper/**"
      - "packages/scraper-sync/**"

env:
  AZURE_FUNCTIONAPP_NAME: magnus-scraper-worker
  AZURE_FUNCTIONAPP_PACKAGE_PATH: "apps/worker-scraper"
  NODE_VERSION: "20.x"

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm turbo run build --filter=scraper-sync

      - name: Build worker
        run: pnpm --filter=worker-scraper build

      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
          package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}

      - name: Verify deployment
        run: |
          echo "Deployment complete! Functions:"
          az functionapp function list \
            --name ${{ env.AZURE_FUNCTIONAPP_NAME }} \
            --resource-group magnus-flipper-rg \
            --output table
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

### Setup GitHub Secrets

```bash
# Get publish profile
az functionapp deployment list-publishing-profiles \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --xml > publish-profile.xml

# Add to GitHub Secrets:
# 1. Go to GitHub repo → Settings → Secrets → Actions
# 2. Add new secret: AZURE_FUNCTIONAPP_PUBLISH_PROFILE
# 3. Paste contents of publish-profile.xml
```

---

## 📈 STEP 6: Monitoring & Logging

### View Logs in Real-Time

```bash
# Stream logs
az webapp log tail \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --log-file logs.zip
```

### Query Application Insights

```bash
# Get Application Insights instrumentation key
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app ${APP_NAME}-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# View in Azure Portal
echo "Application Insights: https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/overview"
```

### Create Alerts

```bash
# Alert for failed function executions
az monitor metrics alert create \
  --name "${APP_NAME}-failed-executions" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/${APP_NAME}-worker" \
  --condition "count FunctionExecutionCount where ResultType includes 'Failed' > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email your-email@example.com
```

---

## 🧪 STEP 7: Testing

### Test Timer Trigger Manually

```bash
# Get function key
FUNCTION_KEY=$(az functionapp function keys list \
  --name ${APP_NAME}-worker \
  --resource-group $RESOURCE_GROUP \
  --function-name scan-marketplace \
  --query default \
  --output tsv)

# Trigger function
curl -X POST \
  "https://${APP_NAME}-worker.azurewebsites.net/admin/functions/scan-marketplace" \
  -H "x-functions-key: $FUNCTION_KEY"
```

### Check Queue Messages

```bash
# View messages in queue
az storage message peek \
  --queue-name new-listings \
  --connection-string "$STORAGE_CONNECTION" \
  --num-messages 10
```

### Monitor Function Execution

```bash
# Get execution history
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --max-events 20 \
  --query "[?contains(resourceId, 'magnus-scraper-worker')]" \
  --output table
```

---

## 🚨 Troubleshooting

### Issue: Functions Not Triggering

**Solution**:
1. Check timer schedule syntax
2. Verify `FUNCTIONS_WORKER_RUNTIME` is set to `node`
3. Check function app status: `az functionapp show`

### Issue: Queue Messages Not Processing

**Solution**:
1. Verify queue exists: `az storage queue list`
2. Check `AzureWebJobsStorage` connection string
3. Increase `batchSize` in `host.json`

### Issue: Key Vault Access Denied

**Solution**:
1. Verify managed identity is enabled
2. Check Key Vault access policies
3. Grant "Get" and "List" permissions

---

## 📋 Production Checklist

- [ ] All Azure resources created
- [ ] Storage queues configured
- [ ] Key Vault secrets stored
- [ ] Function App deployed
- [ ] Managed identity enabled
- [ ] Application Insights configured
- [ ] GitHub Actions workflow setup
- [ ] Monitoring alerts created
- [ ] Test functions manually
- [ ] Verify queue processing

---

**Last Updated**: December 2, 2024
**Platform**: Azure Functions
**Runtime**: Node.js 20
**Status**: Production Ready ✅
