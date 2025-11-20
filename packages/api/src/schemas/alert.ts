import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const AlertSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  deal_id: z.string().uuid(),
  channel: z.enum(["email", "sms", "push"]),
  sent_at: z.string().datetime().optional(),
  status: z.enum(["pending", "sent", "failed"])
});

export const AlertCreateSchema = z.object({
  user_id: z.string().uuid(),
  deal_id: z.string().uuid(),
  channel: z.enum(["email", "sms", "push"])
});
