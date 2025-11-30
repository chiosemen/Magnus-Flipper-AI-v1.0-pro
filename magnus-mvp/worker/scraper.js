import axios from "axios";
import pkg from "redis";

const { createClient } = pkg;

const redisUrl = process.env.REDIS_URL;

const client = createClient({
  url: redisUrl
});

async function runScraper() {
  console.log("[worker] starting scraper loop");

  await client.connect();
  console.log("[worker] connected to redis");

  while (true) {
    try {
      const fakeListing = {
        id: Date.now(),
        title: "Sample Product",
        price: (Math.random() * 100).toFixed(2),
        source: "test",
        created_at: new Date().toISOString()
      };

      await client.lPush("scrapes", JSON.stringify(fakeListing));
      console.log("[worker] pushed listing:", fakeListing.title);

      await new Promise((r) => setTimeout(r, 5000));
    } catch (err) {
      console.error("[worker] error:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

runScraper();
