const { createWorker } = require('@magnus-flipper-ai/core/src/queue');
const { Client } = require('pg');
const { sendSniperAlert, sendTelegramAlert } = require('@magnus-flipper-ai/notifications');

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
    console.log('[Alerts Worker] Connected to PostgreSQL.');
  } catch (err) {
    console.error('[Alerts Worker] Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
}

const alertsWorker = createWorker('alerts:dispatch', async (job) => {
  const { profile, listing, oldListing, newListing, type } = job.data;
  console.log(`[Alerts Worker] Dispatching ${type} alert for profile: ${profile.id}`);

  try {
    const userRes = await pgClient.query('SELECT telegram_chat_id, whatsapp_number FROM users WHERE id = $1', [profile.user_id]);
    const user = userRes.rows[0];

    if (!user) {
      console.warn(`[Alerts Worker] User not found for profile ${profile.id}. Skipping alert dispatch.`);
      return;
    }

    let telegramPayload = null;

    if (type === 'new') {
      telegramPayload = await sendSniperAlert(listing, 'new');
    } else if (type === 'price_drop') {
      telegramPayload = await sendSniperAlert({ oldListing, newListing }, 'price_drop');
    }

    if (user.telegram_chat_id && telegramPayload) {
      telegramPayload.chatId = user.telegram_chat_id;
      await sendTelegramAlert(telegramPayload);
    }

  } catch (error) {
    console.error(`[Alerts Worker] Error dispatching alert for profile ${profile.id}:`, error);
    throw error; // Re-throw to mark job as failed
  }
});

connectDb();
console.log('Alerts Worker started.');

// Graceful shutdown
process.on('SIGINT', async () => {
  await alertsWorker.close();
  await pgClient.end();
  console.log('Alerts Worker shut down.');
  process.exit(0);
});