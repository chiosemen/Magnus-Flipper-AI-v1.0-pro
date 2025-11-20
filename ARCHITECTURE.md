# Magnus Flipper AI - Architecture Overview

This document outlines the high-level architecture of the Magnus Flipper AI project, which is designed as a scalable, queue-based monorepo.

## High-Level Components

The system is composed of several key components that interact through a message queue system (Redis + BullMQ) and a persistent database (Postgres/Supabase).

1.  **API Gateway (`apps/api`)**
    *   Provides REST/GraphQL endpoints for mobile and web applications.
    *   Allows users to configure and manage "Sniper Profiles" (what items to watch).

2.  **Job Scheduler (`apps/scheduler`)**
    *   Periodically fetches active `sniper_profiles` from the database.
    *   Enqueues `scan:profile` jobs into Redis for each active profile.

3.  **Crawler Workers (`apps/worker-crawler`)**
    *   Consumes `scan:marketplace:<name>` jobs (e.g., `scan:marketplace:fb`, `scan:marketplace:gumtree`).
    *   Uses the appropriate crawler package (e.g., `@magnus-flipper-ai/fb-marketplace-crawler`) to scrape raw listing data from the specified marketplace.
    *   Enqueues the raw listing snapshots to the `analyze:listings` queue.

4.  **Diff & Valuation Worker (`apps/worker-analyzer`)**
    *   Consumes `analyze:listings` jobs.
    *   Normalizes raw listing data and stores it in the `listings` table.
    *   Utilizes the `@magnus-flipper-ai/valuation-engine` to calculate various scores (Undervalue, Quick Flip, Demand Velocity, Rarity, Profitability).
    *   Uses the `@magnus-flipper-ai/sniper-engine` to detect new listings or price drops by comparing current listings with cached/historical data.
    *   If a new and interesting listing or a significant price drop is detected, it enqueues an alert job to the `alerts:dispatch` queue.

5.  **Alert Dispatcher (`apps/worker-alerts`)**
    *   Consumes `alerts:dispatch` jobs.
    *   Looks up the user's preferred notification channels (Telegram, WhatsApp, email, push) from the `users` table.
    *   Uses the `@magnus-flipper-ai/notifications` package to fan out alerts to the relevant notification handlers.

6.  **Telegram Bot App (`apps/bot-telegram`)**
    *   (Placeholder) A separate application for interacting with users via Telegram (e.g., long polling or webhooks).

7.  **Redis**
    *   Used as a high-performance message broker for BullMQ queues.
    *   Acts as a simple de-duplication cache for job processing.

8.  **Postgres (Supabase)**
    *   Persistent storage for core data models: `users`, `sniper_profiles`, `listings`, and `profile_listings`.

## Monorepo Layout

```
Magnus-Flipper-AI/
  apps/
    api/                    # REST/GraphQL for mobile + web
    worker-crawler/         # all marketplace crawlers
    worker-analyzer/        # diff, valuation, scoring
    worker-alerts/          # Telegram, WhatsApp, email, push
    bot-telegram/           # Telegram bot app (long polling / webhook)
    scheduler/              # Job scheduler for scan:profile jobs
  packages/
    core/                   # shared types, utils, logging, queue connections
    crawlers/
      fb-marketplace/       # Facebook Marketplace crawler
      gumtree/              # Placeholder for Gumtree crawler
      ebay/                 # Placeholder for eBay crawler
      vinted/               # Placeholder for Vinted crawler
      craigslist/           # Placeholder for Craigslist crawler
    valuation-engine/       # Auto-scoring logic
    notifications/          # Notification handlers (Telegram, WhatsApp, email, push)
    sniper-engine/          # HTML Diff Scanner / change detection
  infra/
    docker-compose.yml      # Docker Compose setup for Redis, Postgres
    k8s/...                 # (Future) Kubernetes configurations
    schema.sql              # SQL schema for Postgres database
```

## Core Data Model (Simplified)

See `infra/schema.sql` for detailed table definitions.

*   **`users`**: Stores user information and notification preferences.
*   **`sniper_profiles`**: Defines what items users want to watch across marketplaces.
*   **`listings`**: Normalized snapshots of scraped listings.
*   **`profile_listings`**: Links sniper profiles to matched listings for alerts and tracking.

## Queue Design (Redis + BullMQ)

*   **`scan:profile`**: "Run a search for this profile." Enqueued by the Scheduler.
*   **`scan:marketplace:<name>`**: Per-marketplace queue (e.g., `scan:marketplace:fb`). Enqueued by the `scan:profile` worker.
*   **`analyze:listings`**: "Diff, score, and detect underpricing for these raw listings." Enqueued by Crawler Workers.
*   **`alerts:dispatch`**: "Send message through Telegram/WhatsApp/Email." Enqueued by the Analyzer Worker.

## Job Flow

1.  **Scheduler**: For each active `sniper_profile`, enqueues a repeating `scan:profile` job.
2.  **Profile Scanner Worker (within Scheduler)**: Loads profile from DB, then enqueues a job to the appropriate `scan:marketplace:<name>` queue.
3.  **Marketplace Worker (`apps/worker-crawler`)**: Uses the relevant crawler package (e.g., `fb-marketplace-crawler`), scrapes raw listing snapshots, and enqueues them to `analyze:listings`.
4.  **Analyzer Worker (`apps/worker-analyzer`)**: Normalizes listings, calculates scores, detects new listings/price drops, and if interesting, enqueues to `alerts:dispatch`.
5.  **Alert Worker (`apps/worker-alerts`)**: For each alert job, looks up user's channels and fans out to relevant notification handlers using the `notifications` package.
