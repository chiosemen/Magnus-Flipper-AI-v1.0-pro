import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
// import { alertsQueue } from '@magnus/notifications/queues'; // This import path is incorrect based on current structure

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// /start
bot.start(async ctx => {
  await ctx.reply(
    `🔥 Welcome to Magnus Flipper Sniper Bot.\n\n` +
    `I’ll send you instant alerts when underpriced items appear.\n\n` +
    `Tap "Link Account" to connect your Magnus profile.`,
    Markup.inlineKeyboard([
      Markup.button.url('🔗 Link Account', `${process.env.MAGNUS_API_URL}/link/telegram?chat_id=${ctx.chat.id}`)
    ])
  );
});

// Callback when backend finishes linking and wants to confirm
bot.command('linked', async ctx => {
  await ctx.reply(`✅ Telegram chat linked to your Magnus account.\nUse /status to see active sniper profiles.`);
});

// /status – list profiles (via API)
bot.command('status', async ctx => {
  const chatId = ctx.chat.id;
  try {
    const res = await axios.get(`${process.env.MAGNUS_API_URL}/telegram/${chatId}/profiles`, {
      headers: { 'x-api-key': process.env.MAGNUS_API_KEY }
    });

    if (!res.data.length) {
      return ctx.reply('You have no active sniper profiles yet. Configure them inside the Magnus app.');
    }

    const msg = res.data.map((p: any) =>
      `• ${p.marketplace.toUpperCase()} – "${p.query}" (£${p.min_price}–£${p.max_price}) – ${p.is_active ? '🟢' : '⚪️'}`
    ).join('\n');

    await ctx.reply('Your sniper profiles:\n\n' + msg);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    await ctx.reply('Failed to fetch profiles. Please try again later.');
  }
});

// This piece is used by the alerts worker
export async function sendAlertToTelegram(payload: {
  chatId: string;
  title: string;
  price: string;
  url: string;
  marketplace: string;
}) {
  await bot.telegram.sendMessage(
    payload.chatId,
    `🎯 *New ${payload.marketplace.toUpperCase()} snipe found!*\n\n` +
    `*${payload.title}*\n` +
    `Price: *${payload.price}*\n\n` +
    `[View listing](${payload.url})`,
    { parse_mode: 'Markdown', disable_web_page_preview: false }
  );
}

bot.launch().then(() => console.log('🚀 Telegram Sniper Bot running'));
