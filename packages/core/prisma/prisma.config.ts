import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    provider: "postgresql",
    url: env("DATABASE_URL"),
  },
});
