import { beforeAll, afterEach, vi } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Reset nock after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Ensure test environment variables are set
beforeAll(() => {
  // Set defaults for test environment if not present
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = 'postgresql://postgres:test@localhost:5433/magnus_test';
  }
  if (!process.env.TEST_REDIS_URL) {
    process.env.TEST_REDIS_URL = 'redis://localhost:6380';
  }
});

