# Magnus Flipper AI — Monorepo

**OFFICIAL MONOREPO ROOT:**
/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

This is the production-grade monorepo for the Magnus Flipper AI system —
a multi-marketplace scanning engine with automated scoring, alerting,
queue-based workers, notification system, and a Next.js + Expo mobile platform.

**NOTE: The mobile app IS implemented in /mobile/.**
Some earlier documentation incorrectly refers to it as "planned but not built."

## 📌 Monorepo Structure

```
apps/
  ├── api/
  ├── scheduler/
  ├── web/
  ├── worker-crawler/
  ├── worker-analyzer/
  ├── worker-alerts/

packages/
  ├── core/                 (Redis, queues, shared utils)
  ├── crawlers/             (FB, Vinted, Gumtree)
  ├── valuation-engine/     (scoring engine)
  ├── sniper-engine/        (diff detection)
  ├── notifications/        (Telegram/WhatsApp/email/SMS)
  ├── api/                  (Magnus API gateway)
  ├── sdk/                  (shared TS SDK)

infra/
  ├── docker-compose.yml    (Redis + Postgres)
  ├── schema.sql

mobile/                      (Expo-based mobile app)
web/                         (Next.js web dashboard)

scripts/
  ├── magnus_stability_god_v3.sh
  ├── magnus_build_bootstrap.sh
  ├── magnus_git_push.sh
  ├── magnus_deploy_validate.sh

ARCHITECTURE.md              (full system overview)
```
