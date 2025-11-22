"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
const queue_1 = require("@magnus-flipper-ai/queue");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.botEnvSchema);
const bot = new node_telegram_bot_api_1.default(env.TELEGRAM_BOT_TOKEN, { polling: true });
async function main() {
    core_1.botLogger.info('🤖 Telegram bot started', {
        nodeEnv: env.NODE_ENV,
    });
    // Command: /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `
🎯 *Welcome to Magnus Flipper AI!*

I can help you find profitable items on Facebook Marketplace.

*Available commands:*
/crawl - Start a new marketplace crawl
/status - Check system status
/help - Show this help message
    `;
        bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        });
    });
    // Command: /help
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const helpMessage = `
*Magnus Flipper AI Commands:*

/start - Welcome message
/crawl - Trigger a marketplace crawl
/status - Check system health
/help - Show this message
    `;
        bot.sendMessage(chatId, helpMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        });
    });
    // Command: /crawl
    bot.onText(/\/crawl/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const job = {
                id: `crawl-${Date.now()}`,
                url: 'https://www.facebook.com/marketplace',
                marketplace: 'facebook',
                searchQuery: 'electronics',
                createdAt: new Date(),
            };
            await queue_1.crawlerQueue.add('crawl', job);
            bot.sendMessage(chatId, `✅ Crawl job queued successfully!\nJob ID: ${job.id}`, { disable_web_page_preview: true });
            core_1.botLogger.info('Crawl job queued via Telegram', { jobId: job.id, chatId });
        }
        catch (error) {
            core_1.botLogger.error('Failed to queue crawl job', { error, chatId });
            bot.sendMessage(chatId, '❌ Failed to queue crawl job. Please try again later.');
        }
    });
    // Command: /status
    bot.onText(/\/status/, (msg) => {
        const chatId = msg.chat.id;
        const statusMessage = `
🟢 *System Status: Online*

All services operational.
    `;
        bot.sendMessage(chatId, statusMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        });
    });
    // Error handling
    bot.on('polling_error', (error) => {
        core_1.botLogger.error('Telegram polling error', { error: error.message });
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        core_1.botLogger.info('Received SIGTERM, shutting down gracefully');
        await bot.stopPolling();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        core_1.botLogger.info('Received SIGINT, shutting down gracefully');
        await bot.stopPolling();
        process.exit(0);
    });
}
main().catch((error) => {
    core_1.botLogger.error('Fatal error in bot', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map