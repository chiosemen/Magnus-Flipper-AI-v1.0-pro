import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { botLogger, validateEnv, botEnvSchema } from '@magnus-flipper-ai/core';
import { crawlerQueue, analyzerQueue } from '@magnus-flipper-ai/queue';
import { CrawlJob, AnalysisJob } from '@magnus-flipper-ai/shared';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(botEnvSchema);

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

async function main() {
  botLogger.info('🤖 Telegram bot started', {
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
      const job: CrawlJob = {
        id: `crawl-${Date.now()}`,
        url: 'https://www.facebook.com/marketplace',
        marketplace: 'facebook',
        searchQuery: 'electronics',
        createdAt: new Date(),
      };

      await crawlerQueue.add('crawl', job);

      bot.sendMessage(
        chatId,
        `✅ Crawl job queued successfully!\nJob ID: ${job.id}`,
        { disable_web_page_preview: true }
      );

      botLogger.info('Crawl job queued via Telegram', { jobId: job.id, chatId });
    } catch (error) {
      botLogger.error('Failed to queue crawl job', { error, chatId });
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
    botLogger.error('Telegram polling error', { error: error.message });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    botLogger.info('Received SIGTERM, shutting down gracefully');
    await bot.stopPolling();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    botLogger.info('Received SIGINT, shutting down gracefully');
    await bot.stopPolling();
    process.exit(0);
  });
}

main().catch((error) => {
  botLogger.error('Fatal error in bot', { error });
  process.exit(1);
});
