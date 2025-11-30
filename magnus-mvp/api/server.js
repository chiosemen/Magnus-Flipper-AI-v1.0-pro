import express from "express";
import cors from "cors";
import { createClient } from "redis";

const app = express();
app.use(cors());
app.use(express.json());

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/scrapes/latest", async (req, res) => {
  const data = await redis.lRange("scraper:results", 0, 50);
  res.json(data.map(JSON.parse));
});

app.listen(3000, () => {
  console.log("API listening on port 3000");
});
