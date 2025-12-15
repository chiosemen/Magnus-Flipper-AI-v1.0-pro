# Queue Package

BullMQ queue infrastructure for ingestion jobs.

## Exports

- `redis` - IORedis connection instance
- `ingestQueue` - BullMQ queue for ingestion jobs
- Types: `IngestRunPayload`, `ScrapeJob`, `JobStatus`, etc.

## Usage

```typescript
import { ingestQueue, redis } from "@magnus-flipper-ai/queue";

// Enqueue a job
await ingestQueue.add("scrape-job", jobData);

// Read status
const status = await redis.hgetall(`ingest:${jobId}:status`);
```
