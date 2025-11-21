import type { Request, Response, Router } from "express";
import { Telegraf } from "telegraf";
import { supabaseAdmin } from "../lib/supabase.ts";
import { logger } from "../lib/logger.ts";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = botToken ? new Telegraf(botToken) : null;

export function registerTelegramRoutes(router: Router) {
  /**
   * GET /telegram/health
   * Basic integration health (no secrets leaked).
   */
  router.get("/telegram/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      botConfigured: Boolean(botToken),
      supabaseConfigured: Boolean(supabaseAdmin),
    });
  });

  /**
   * GET /telegram/:chatId/profiles
   * Used by the Telegram bot /status command to show linked scan profiles.
   */
  router.get("/telegram/:chatId/profiles", async (req: Request, res: Response) => {
    if (!supabaseAdmin) {
      return res.status(503).json({ ok: false, message: "Supabase not configured" });
    }

    const chatId = req.params.chatId;

    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("telegram_chat_id", chatId)
        .single();

      if (userError) {
        logger.error({ err: userError }, "Failed to fetch user by telegram_chat_id");
        return res.status(500).json({ ok: false, message: "Internal error" });
      }

      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "No Magnus account linked to this Telegram chat yet.",
        });
      }

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("scan_profiles")
        .select("id, marketplace, query, min_price, max_price, location, config, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (profilesError) {
        logger.error({ err: profilesError }, "Failed to fetch scan profiles");
        return res.status(500).json({ ok: false, message: "Internal error" });
      }

      return res.json({
        ok: true,
        count: profiles?.length ?? 0,
        profiles: profiles ?? [],
      });
    } catch (err: any) {
      logger.error({ err }, "Error in /telegram/:chatId/profiles");
      return res.status(500).json({ ok: false, message: "Internal error" });
    }
  });

  /**
   * OPTIONAL: Telegram webhook endpoint
   * Set this as your bot's webhook URL if you want Telegram → API → queues.
   */
  router.post("/telegram/webhook", async (req: Request, res: Response) => {
    if (!bot) {
      return res.status(503).json({ ok: false, message: "Bot token not configured" });
    }
    try {
      await bot.handleUpdate(req.body);
      return res.sendStatus(200);
    } catch (err: any) {
      logger.error({ err }, "Error in /telegram/webhook");
      return res.status(500).json({ ok: false });
    }
  });
}
