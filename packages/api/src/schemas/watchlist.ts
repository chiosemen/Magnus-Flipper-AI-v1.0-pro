import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const WatchlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  keywords: z.array(z.string()),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  created_at: z.string().datetime()
});

export const WatchlistCreateSchema = z.object({
  name: z.string(),
  keywords: z.array(z.string()).min(1),
  min_price: z.number().optional(),
  max_price: z.number().optional()
});
