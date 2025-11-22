import express from 'express';
import dotenv from 'dotenv';
import { apiLogger, validateEnv, apiEnvSchema } from '@magnus-flipper-ai/core';
import routes from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(apiEnvSchema);

const app = express();
const port = Number(env.PORT) || 10000;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use(routes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(port, '0.0.0.0', () => {
  apiLogger.info(`🚀 API server started`, {
    port,
    nodeEnv: env.NODE_ENV,
    redisHost: env.REDIS_HOST,
  });
});
