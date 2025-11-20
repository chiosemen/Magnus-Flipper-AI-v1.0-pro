// /api/index.js
// Vercel bridge – routes all requests to the Express app in packages/api
module.exports = require("../packages/api/dist/vercel-handler.js");
