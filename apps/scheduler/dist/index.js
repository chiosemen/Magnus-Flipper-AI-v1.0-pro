"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.workerEnvSchema);
function main() {
    core_1.schedulerLogger.info('🕐 Scheduler started', {
        nodeEnv: env.NODE_ENV,
    });
    core_1.schedulerLogger.info('Scheduler queue integration is disabled. Worker emits a heartbeat but performs no work.');
    const heartbeat = setInterval(() => {
        core_1.schedulerLogger.debug('Scheduler heartbeat', { timestamp: new Date().toISOString() });
    }, 5 * 60 * 1000);
    const shutdown = (signal) => {
        core_1.schedulerLogger.info(`Received ${signal}, shutting down gracefully`);
        clearInterval(heartbeat);
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
main();
//# sourceMappingURL=index.js.map