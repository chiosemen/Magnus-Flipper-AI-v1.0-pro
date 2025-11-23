"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const core_1 = require("@magnus-flipper-ai/core");
const logger = (0, core_1.createLogger)('notifications');
async function sendNotification(payload) {
    try {
        switch (payload.channel) {
            case 'telegram':
                // Telegram notifications have been disabled
                logger.warn('Telegram notifications are disabled and no longer supported');
                return false;
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
//# sourceMappingURL=sender.js.map