"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const core_1 = require("@magnus-flipper-ai/core");
const logger = (0, core_1.createLogger)('notifications');
async function sendNotification(payload) {
    try {
        switch (payload.channel) {
            case 'telegram':
                return await sendTelegramNotification(payload);
            case 'email':
                // TODO: Implement email notifications
                logger.warn('Email notifications not yet implemented');
                return false;
            case 'push':
                // TODO: Implement push notifications
                logger.warn('Push notifications not yet implemented');
                return false;
            default:
                logger.error(`Unknown notification channel: ${payload.channel}`);
                return false;
        }
    }
    catch (error) {
        logger.error('Failed to send notification', { error, payload });
        return false;
    }
}
async function sendTelegramNotification(payload) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        logger.error('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }
    try {
        const bot = new node_telegram_bot_api_1.default(token);
        const chatId = payload.metadata?.chatId || process.env.TELEGRAM_CHAT_ID;
        if (!chatId) {
            logger.error('No chat ID provided for Telegram notification');
            return false;
        }
        const message = `*${payload.subject}*\n\n${payload.message}`;
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        });
        logger.info('Telegram notification sent successfully', { chatId, subject: payload.subject });
        return true;
    }
    catch (error) {
        logger.error('Failed to send Telegram notification', { error });
        return false;
    }
}
//# sourceMappingURL=sender.js.map