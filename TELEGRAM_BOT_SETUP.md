# Telegram Bot Setup Guide

## 1. Create Your Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts:
   - Enter a name for your bot (e.g., "Magnus Flipper Alerts")
   - Enter a username (e.g., `MagnusFlipperBot`)
4. BotFather will give you an **API token** - save this!

## 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=MagnusFlipperBot
TELEGRAM_BOT_SECRET=your-random-secret-string-for-webhook
```

### Generate a Bot Secret

Run this command to generate a secure secret:

```bash
openssl rand -hex 32
```

## 3. Set Bot Commands (Optional)

Send these commands to BotFather to set up the menu:

```
/setcommands
```

Then send:
```
start - Welcome and link account
profiles - View your search profiles
alerts - View recent alerts
status - Check connection status
help - Show help message
```

## 4. Run the Database Migration

```bash
# Connect to your database and run the migration
psql -d your_database -f db/migrations/001_sniper_profiles.sql
```

Or via Supabase:
1. Go to your Supabase dashboard
2. Open SQL Editor
3. Paste the contents of `db/migrations/001_sniper_profiles.sql`
4. Run the query

## 5. Start the Bot

```bash
# From the project root
cd apps/bot-telegram
npm install
npm start
```

## 6. Link User Accounts

### From the Web App:
1. User clicks "Link Telegram" in settings
2. API generates a one-time token
3. User is redirected to `t.me/MagnusFlipperBot?start=TOKEN`
4. Bot verifies token and links account

### Direct Link (for testing):
1. Start the bot: `/start`
2. Get your API key from the dashboard
3. Send: `/link YOUR_API_KEY`

## 7. Test Alerts

1. Create a sniper profile in the web app
2. Go to notification settings
3. Enable Telegram
4. Click "Send test alert"

## Architecture

```
User Action → API → Queue → Bot
    ↓
/telegram/link/start (API)
    ↓
Returns token + t.me link
    ↓
User opens bot with token
    ↓
Bot calls /telegram/link/complete (API)
    ↓
Account linked!
```

## Alert Flow

```
Crawler → Analyzer → Alerts Queue → Alerts Worker → Telegram API
```

1. Crawler finds new listings
2. Analyzer scores and detects changes
3. High-priority items queued for alerting
4. Alerts worker fetches user's telegram_chat_id
5. Sends message via Telegram Bot API

## Troubleshooting

### Bot not responding
- Check TELEGRAM_BOT_TOKEN is correct
- Ensure bot is running: `node apps/bot-telegram/src/index.js`
- Check logs for errors

### Link not working
- Verify token hasn't expired (15 min limit)
- Check TELEGRAM_BOT_SECRET matches in API and bot
- Ensure database tables exist

### Alerts not sending
- Verify user has telegram_enabled = true
- Check telegram_chat_id is set in users table
- Ensure alerts worker is running

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| TELEGRAM_BOT_TOKEN | From BotFather | `123456:ABC...` |
| TELEGRAM_BOT_USERNAME | Bot username without @ | `MagnusFlipperBot` |
| TELEGRAM_BOT_SECRET | Webhook verification | Random 32+ chars |

## Security Notes

- Never commit `.env` files
- Rotate TELEGRAM_BOT_SECRET periodically
- Use HTTPS for production webhooks
- Rate limit API endpoints

## Production Deployment

For production, consider using webhooks instead of polling:

```javascript
// In bot startup
const webhookUrl = `https://your-api.com/telegram/webhook`;
await bot.telegram.setWebhook(webhookUrl);
```

And handle the webhook in your API:
```javascript
router.post('/telegram/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});
```
