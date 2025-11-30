import express from "express";
import cors from "cors";
import { createClient } from "redis";

const app = express();
app.use(cors());
app.use(express.json());

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis client error:", err));
await redis.connect();

app.get("/health", async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: "ok", time: new Date().toISOString() });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.get("/scrapes/latest", async (req, res) => {
  try {
    const raw = await redis.lRange("scraper:results", 0, 50);
    const parsed = raw.map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    });
    res.json(parsed.filter(Boolean));
  } catch (error) {
    console.error("Unable to fetch results:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.post("/scrapes/trigger", async (req, res) => {
  try {
    const payload = {
      createdAt: new Date().toISOString(),
      source: "manual",
      meta: req.body || {}
    };

    await redis.lPush("scraper:jobs", JSON.stringify(payload));
    res.json({ status: "queued", payload });
  } catch (error) {
    console.error("Failed to queue manual trigger:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
