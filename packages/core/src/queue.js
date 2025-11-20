const { Queue, Worker, QueueScheduler } = require('bullmq');

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

function createQueue(name) {
  return new Queue(name, { connection: REDIS_CONNECTION });
}

function createWorker(name, processor) {
  return new Worker(name, processor, { connection: REDIS_CONNECTION });
}

function createScheduler(name) {
  return new QueueScheduler(name, { connection: REDIS_CONNECTION });
}

module.exports = {
  createQueue,
  createWorker,
  createScheduler,
  redisConnection: REDIS_CONNECTION,
};
