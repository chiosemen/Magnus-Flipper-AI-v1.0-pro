import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error(
    '[analyzer] REDIS_URL is not set. The worker will still run but cannot reach Redis.'
  );
}

const client: RedisClientType | null = redisUrl ? createClient({ url: redisUrl }) : null;

async function analyze(item: any): Promise<any> {
  console.log(`[analyzer] Analyzing item: ${JSON.stringify(item)}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    analyzedAt: new Date().toISOString(),
    item
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('[analyzer] Starting worker');

  if (client) {
    client.on('error', (err) => console.error('[analyzer] Redis error', err));
    await client.connect();
    console.log('[analyzer] Connected to Redis');
  }

  while (true) {
    try {
      if (!client) {
        console.warn('[analyzer] No Redis client available, sleeping...');
        await wait(5000);
        continue;
      }

      const rawJob = await client.rPop('analysis:queue');

      if (!rawJob) {
        await wait(5000);
        continue;
      }

      const job = JSON.parse(rawJob);
      const result = await analyze(job);

      await client.lPush('analysis:results', JSON.stringify(result));
      console.log('[analyzer] Job analyzed successfully');
    } catch (err) {
      console.error('[analyzer] Error during analysis loop', err);
      await wait(5000);
    }
  }
}

main().catch((err) => {
  console.error('[analyzer] Fatal startup error', err);
});
