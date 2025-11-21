import axios from "axios";

export async function sendHealthAlert(service, status, message) {
  console.log(`⚠️ HEALTH ALERT — ${service}: ${status} :: ${message}`);

  // 🔔 Telegram (if configured)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `⚠️ *Service Health Alert*\n\nService: ${service}\nStatus: ${status}\nMessage: ${message}`,
          parse_mode: "Markdown"
        }
      );
    } catch (err) {
      console.error("Telegram alert failed:", err?.message);
    }
  }
}
