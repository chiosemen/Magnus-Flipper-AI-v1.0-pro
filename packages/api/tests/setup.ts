/**
 * Jest test setup
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error"; // Reduce noise in test output

// Global test timeout
jest.setTimeout(10000);
