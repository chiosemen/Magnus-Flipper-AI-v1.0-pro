import express from "express";
import { budgetGuard } from "./middleware/budgetGuard";
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "./sentry";

initSentry();
const app = express();
app.use(express.json());

app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

function createAlertHandler(req: express.Request, res: express.Response) {
  // Placeholder implementation. Replace with actual alert logic.
  res.json({ status: "queued" });
}

app.post("/api/alerts/send", budgetGuard("alerts", () => 1), createAlertHandler);

function estimateTokens(req: express.Request) {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  const approx = Math.ceil(prompt.length / 4);
  return Math.max(1, approx);
}

function llmHandler(req: express.Request, res: express.Response) {
  // Placeholder implementation. Replace with actual LLM logic.
  res.json({ output: "Generated text", tokensConsumed: estimateTokens(req) });
}

app.post("/api/llm/generate", budgetGuard("llm", estimateTokens), llmHandler);

app.use(sentryErrorHandler());

export default app;
