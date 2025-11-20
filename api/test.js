// Simple test endpoint to verify Vercel can run basic Node.js
module.exports = (req, res) => {
  res.status(200).json({
    message: "Test endpoint working",
    nodeVersion: process.version,
    platform: process.platform,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasRedisUrl: !!process.env.REDIS_URL
    }
  });
};
