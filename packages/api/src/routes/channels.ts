import express from "express";
import crypto from "crypto";
import { registry } from "../registry.ts";
import { supabaseAdmin } from "../lib/supabase.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

export const channelsRouter = express.Router();

// GET /api/me/channels - Get user's notification channels
registry.registerPath({
  method: "get",
  path: "/api/me/channels",
  summary: "Get user's notification channel settings",
  responses: {
    200: { description: "Channel settings" }
  }
});

channelsRouter.get(
  "/api/me/channels",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(`
        telegram_chat_id,
        telegram_enabled,
        whatsapp_number,
        whatsapp_enabled,
        push_enabled,
        sms_number,
        sms_enabled
      `)
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      telegram: {
        enabled: user.telegram_enabled,
        linked: !!user.telegram_chat_id,
        chat_id: user.telegram_chat_id ? "***" + user.telegram_chat_id.slice(-4) : null
      },
      whatsapp: {
        enabled: user.whatsapp_enabled,
        linked: !!user.whatsapp_number,
        number: user.whatsapp_number ? "***" + user.whatsapp_number.slice(-4) : null
      },
      push: {
        enabled: user.push_enabled
      },
      sms: {
        enabled: user.sms_enabled,
        number: user.sms_number ? "***" + user.sms_number.slice(-4) : null
      }
    });
  })
);

// PATCH /api/me/channels - Update channel preferences
const UpdateChannelsSchema = z.object({
  telegram_enabled: z.boolean().optional(),
  whatsapp_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional()
});

channelsRouter.patch(
  "/api/me/channels",
  requireAuth,
  validateRequest({ body: UpdateChannelsSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(req.body)
      .eq("id", req.user.id);

    if (error) {
      return res.status(500).json({ error: "Failed to update channels" });
    }

    res.json({ success: true });
  })
);

// POST /api/telegram/link/start - Generate Telegram link token
channelsRouter.post(
  "/api/telegram/link/start",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { error } = await supabaseAdmin
      .from("telegram_link_tokens")
      .insert({
        user_id: req.user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      return res.status(500).json({ error: "Failed to generate link token" });
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "MagnusFlipperBot";

    res.json({
      token,
      expires_at: expiresAt.toISOString(),
      link: `https://t.me/${botUsername}?start=${token}`,
      instructions: `Open the link or search for @${botUsername} in Telegram and send: /start ${token}`
    });
  })
);

// POST /api/telegram/link/complete - Complete Telegram linking (called by bot)
channelsRouter.post(
  "/api/telegram/link/complete",
  asyncHandler(async (req, res) => {
    const { token, chat_id } = req.body;

    if (!token || !chat_id) {
      return res.status(400).json({ error: "Token and chat_id required" });
    }

    // Verify bot secret
    const botSecret = req.headers["x-bot-secret"];
    if (botSecret !== process.env.TELEGRAM_BOT_SECRET) {
      return res.status(403).json({ error: "Invalid bot secret" });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Database not available" });
    }

    // Find and validate token
    const { data: linkToken, error: tokenError } = await supabaseAdmin
      .from("telegram_link_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !linkToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update user with chat_id
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        telegram_chat_id: chat_id.toString(),
        telegram_enabled: true
      })
      .eq("id", linkToken.user_id);

    if (updateError) {
      return res.status(500).json({ error: "Failed to link Telegram" });
    }

    // Mark token as used
    await supabaseAdmin
      .from("telegram_link_tokens")
      .update({ used: true })
      .eq("id", linkToken.id);

    res.json({ success: true, user_id: linkToken.user_id });
  })
);

// POST /api/whatsapp/link - Link WhatsApp number
const WhatsAppLinkSchema = z.object({
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format")
});

channelsRouter.post(
  "/api/whatsapp/link",
  requireAuth,
  validateRequest({ body: WhatsAppLinkSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { phone_number } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabaseAdmin
      .from("whatsapp_verifications")
      .insert({
        user_id: req.user.id,
        phone_number,
        verification_code: code,
        expires_at: expiresAt.toISOString()
      });

    // TODO: Send verification code via WhatsApp/Twilio
    console.log(`[WHATSAPP] Would send code ${code} to ${phone_number}`);

    res.json({
      success: true,
      message: "Verification code sent",
      expires_at: expiresAt.toISOString()
    });
  })
);

// POST /api/whatsapp/verify - Verify WhatsApp code
channelsRouter.post(
  "/api/whatsapp/verify",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code required" });
    }

    const { data: verification, error } = await supabaseAdmin
      .from("whatsapp_verifications")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("verification_code", code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !verification) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    await supabaseAdmin
      .from("users")
      .update({
        whatsapp_number: verification.phone_number,
        whatsapp_enabled: true
      })
      .eq("id", req.user.id);

    await supabaseAdmin
      .from("whatsapp_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    res.json({ success: true });
  })
);

// POST /api/test-alert - Send test alert
channelsRouter.post(
  "/api/test-alert",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { channel } = req.body;
    if (!channel || !["telegram", "whatsapp", "email", "push"].includes(channel)) {
      return res.status(400).json({ error: "Valid channel required" });
    }

    const testAlert = {
      listing: {
        id: "test-123",
        title: "Test Alert - iPhone 14 Pro",
        price: 599,
        oldPrice: 799,
        dropPercentage: "25",
        location: "Test Location",
        url: "https://example.com/listing/test",
        scores: {
          overall: 85,
          estimatedResaleValue: 750,
          estimatedProfit: 151,
          profitability: 80
        }
      },
      alertType: "PRICE_DROP",
      reason: "Test alert"
    };

    // TODO: Actually send the test alert
    console.log(`[TEST-ALERT] Would send to ${channel}:`, testAlert);

    res.json({
      success: true,
      message: `Test alert sent to ${channel}`,
      alert: testAlert
    });
  })
);
