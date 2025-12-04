console.log("Magnus Worker started.");

const REDIS_URL = process.env.REDIS_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log("Env check:", {
  hasRedis: !!REDIS_URL,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasSupabaseKey: !!SUPABASE_KEY
});

// TODO: plug in your real scraping / queue logic here.
// This is just a placeholder loop.

setInterval(() => {
  console.log(`[${new Date().toISOString()}] Worker heartbeat...`);
}, 30000);
