import fs from "node:fs";
import path from "node:path";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../registry.ts";

import "../routes/deals.ts";
import "../routes/alerts.ts";
import "../routes/watchlists.ts";

const generator = new OpenApiGeneratorV3(registry.definitions);

const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Magnus Flipper AI API",
    version: "1.0.0",
    description: "Auto-generated OpenAPI spec from Zod schemas."
  },
  servers: [{ url: "https://api.magnus-flipper-ai.com" }]
});

const out = path.resolve("src/openapi/openapi.yaml");
fs.writeFileSync(out, generator.generateYaml(doc));
console.log("✅ OpenAPI spec generated at:", out);
