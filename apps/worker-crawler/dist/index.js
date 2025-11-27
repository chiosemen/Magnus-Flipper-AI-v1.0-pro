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
async function main() {
    core_1.crawlerLogger.info('🕷️  Crawler worker started', {
        nodeEnv: env.NODE_ENV,
    });
    core_1.crawlerLogger.info('Crawler queue integration is disabled. Worker logs heartbeats only.');
    const heartbeat = setInterval(() => {
        core_1.crawlerLogger.debug('Crawler heartbeat', { timestamp: new Date().toISOString() });
    }, 5 * 60 * 1000);
    const shutdown = (signal) => {
        core_1.crawlerLogger.info(`Received ${signal}, shutting down gracefully`);
        clearInterval(heartbeat);
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
main().catch((error) => {
    core_1.crawlerLogger.error('Fatal error in worker', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map