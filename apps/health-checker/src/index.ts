import axios from "axios";
import { sendHealthAlert } from "@magnus-flipper-ai/notifications/healthAlert";

type ServiceConfig = {
  name: string;
  url: string;
  expectedStatus?: number;
};

const SERVICES: ServiceConfig[] = [
  {
    name: "web",
    url: process.env.MAGNUS_WEB_URL || "https://your-vercel-url-here.vercel.app",
    expectedStatus: 200,
  },
  {
    name: "api",
    url: process.env.MAGNUS_API_URL || "https://your-render-api-here.onrender.com/health",
    expectedStatus: 200,
  },
  {
    name: "expo-updates",
    url: "https://u.expo.dev/YOUR-PROJECT-ID/production",
    expectedStatus: 200,
  },
  // Add more if needed (workers, queues, etc.)
];

const INTERVAL_MS = Number(process.env.HEALTH_CHECK_INTERVAL_MS || 60_000);

async function checkService(service: ServiceConfig) {
  const start = Date.now();
  try {
    const resp = await axios.get(service.url, { timeout: 10_000 });
    const duration = Date.now() - start;

    const okStatus = service.expectedStatus ?? 200;
    const isOk = resp.status === okStatus;

    if (isOk) {
      console.log(
        `[OK] ${service.name} (${resp.status}) ${duration}ms → ${service.url}`
      );
    } else {
      console.warn(
        `[WARN] ${service.name} status ${resp.status} (expected ${okStatus}) ${duration}ms → ${service.url}`
      );
      await sendHealthAlert(service.name, "WARN", `Unexpected status ${resp.status}`);
    }
  } catch (err: any) {
    const duration = Date.now() - start;
    await sendHealthAlert(service.name, "DOWN", err?.message || "Unknown error");
    console.error(
      `[ERROR] ${service.name} failed in ${duration}ms → ${service.url} :: ${err?.message || err}`
    );
  }
}

async function runOnce() {
  console.log("🔍 Running health checks at", new Date().toISOString());
  await Promise.all(SERVICES.map(checkService));
}

async function main() {
  console.log("🚑 Magnus Health-Check Worker started.");
  await runOnce();

  setInterval(() => {
    void runOnce();
  }, INTERVAL_MS);
}

void main();
