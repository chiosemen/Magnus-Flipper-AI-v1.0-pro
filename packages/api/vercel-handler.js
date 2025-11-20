// Vercel serverless function entry point
// This file must be at /api/vercel-handler.js (Vercel's /api convention)
// It imports the compiled Express app from ./dist/vercel-handler.js

// Using dynamic import to load ES module
module.exports = async (req, res) => {
  const { default: app } = await import('./dist/vercel-handler.js');
  return app(req, res);
};
