// Simplified handler to test Vercel runtime
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Magnus Flipper AI API - Simple Handler',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

module.exports = app;
