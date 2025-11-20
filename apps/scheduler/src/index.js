const { createQueue, createWorker, createScheduler, redisConnection } = require('@magnus-flipper-ai/core/src/queue');
const { Client } = require('pg');

const scanProfileQueue = createQueue('scan:profile');

const pgClient = new Client({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'sniper_db',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function connectDb() {
  try {
    await pgClient.connect();
    console.log('[Scheduler] Connected to PostgreSQL.');
  } catch (err) {
    console.error('[Scheduler] Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
}

async function enqueueScanJobs() {
  console.log('[Scheduler] Fetching active sniper profiles...');
  try {
    const res = await pgClient.query('SELECT id, marketplace, query, min_price, max_price, location, radius_km, conditions, scan_interval_seconds FROM sniper_profiles WHERE is_active = TRUE');
    const profiles = res.rows;

    for (const profile of profiles) {
      const scanIntervalMs = profile.scan_interval_seconds * 1000;
      console.log(`[Scheduler] Enqueuing scan for profile ${profile.id} (${profile.query}) every ${profile.scan_interval_seconds} seconds.`);
      await scanProfileQueue.add(
        `scan-profile-${profile.id}`,
        { profileId: profile.id, profile },
        { repeat: { every: scanIntervalMs, jobId: `scan-profile-repeat-${profile.id}` } }
      );
    }
    console.log(`[Scheduler] Enqueued scan jobs for ${profiles.length} active profiles.`);
  } catch (error) {
    console.error('[Scheduler] Error enqueuing scan jobs:', error);
  }
}

async function startScheduler() {
  await connectDb();
  // Clear any existing repeating jobs to prevent duplicates on restart
  const jobs = await scanProfileQueue.getRepeatableJobs();
  for (const job of jobs) {
    await scanProfileQueue.removeRepeatableByKey(job.key);
  }
  await enqueueScanJobs();

  // Start a worker to process the scan:profile queue (this worker will then fan out to marketplace specific queues)
  const profileScannerWorker = createWorker('scan:profile', async (job) => {
    const { profileId, profile } = job.data;
    console.log(`[Scheduler] Processing scan:profile job for profile: ${profileId}`);

    const marketplaceQueue = createQueue(`scan:marketplace:${profile.marketplace}`);
    await marketplaceQueue.add(
      `scan-${profile.marketplace}-${profile.id}`,
      { profile },
      { jobId: `scan-${profile.marketplace}-${profile.id}-${Date.now()}` }
    );
    console.log(`[Scheduler] Enqueued scan for ${profile.marketplace} for profile: ${profile.id}`);
  });

  console.log('Scheduler started.');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await profileScannerWorker.close();
    await scanProfileQueue.close();
    await pgClient.end();
    console.log('Scheduler shut down.');
    process.exit(0);
  });
}

startScheduler();
