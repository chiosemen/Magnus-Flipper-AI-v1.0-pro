import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const DealSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  title: z.string().openapi({ example: "Nike Air Max 97" }),
  price: z.number().openapi({ example: 120 }),
  currency: z.string().openapi({ example: "USD" }),
  score: z.number().min(0).max(100).openapi({ example: 87 }),
  url: z.string().url().openapi({ example: "https://www.nike.com" }),
  created_at: z.string().datetime().openapi({ example: "2025-11-06T12:00:00Z" })
});

export const DealsResponseSchema = z.object({
  deals: z.array(DealSchema)
});
