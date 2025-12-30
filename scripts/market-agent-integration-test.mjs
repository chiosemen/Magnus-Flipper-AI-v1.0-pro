const baseUrl = process.env.MARKET_AGENT_BASE_URL || "http://localhost:3000";
const token = process.env.MARKET_AGENT_AUTH_TOKEN || "";
const demoMode = !token;
const demoParam = demoMode ? "&demo=true" : "";

const headers = {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { response, json, text };
}

async function run() {
  const marketplace = "facebook";
  const q = "macbook pro";
  const encodedQ = encodeURIComponent(q);

  const enrichUrl = `${baseUrl}/api/demo?mode=enrich&marketplace=${marketplace}&country=GB&q=${encodedQ}${demoParam}`;
  const enrichPayload = {
    items: [
      {
        title: "Macbook Pro 14",
        priceText: "£1200",
        url: "https://example.com/item-1",
        image: "",
      },
      {
        title: "Macbook Pro 16",
        priceText: "£1500",
        url: "https://example.com/item-2",
        image: "",
      },
    ],
  };

  const enrich = await request(enrichUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(enrichPayload),
  });

  assert(
    enrich.response.ok,
    `Enrich failed: ${enrich.response.status} ${enrich.text}`
  );

  const searchUrl = `${baseUrl}/api/demo?mode=search&marketplace=${marketplace}&country=GB&q=${encodedQ}&maxItems=5${demoParam}`;

  // Increase concurrent requests to 10-20
  const concurrentCount = 15;
  const startTime = Date.now();
  
  const concurrent = await Promise.all(
    Array.from({ length: concurrentCount }).map(() =>
      request(searchUrl, { method: "GET", headers })
    )
  );

  const endTime = Date.now();
  const avgLatency = (endTime - startTime) / concurrentCount;

  // Assert no non-200 responses (except 200 is acceptable)
  const non200Responses = concurrent.filter((entry) => entry.response.status !== 200);
  assert(
    non200Responses.length === 0,
    `Found ${non200Responses.length} non-200 responses: ${non200Responses.map((r) => r.response.status).join(", ")}`
  );

  // Assert JSON parse succeeds
  const parseErrors = concurrent.filter((entry) => !entry.json);
  assert(parseErrors.length === 0, `Found ${parseErrors.length} responses that failed JSON parse`);

  // Collect cache statuses
  const cacheStatuses = concurrent
    .map((entry) => entry.json?.meta?.cacheStatus)
    .filter(Boolean);

  const hasServerErrors = concurrent.some((entry) => entry.response.status >= 500);
  assert(!hasServerErrors, "One or more concurrent requests returned 5xx");

  await new Promise((resolve) => setTimeout(resolve, 500));

  const finalAttempt = await request(searchUrl, { method: "GET", headers });
  assert(
    finalAttempt.response.status !== 409,
    `Lock still busy after concurrency: ${finalAttempt.text}`
  );

  if (finalAttempt.json?.meta?.cacheStatus === "lock-busy") {
    throw new Error("Lock status still busy after cooldown");
  }

  // Print summary
  console.log("market-agent-integration-test: ok");
  console.log(`Summary:`);
  console.log(`  Requests: ${concurrentCount}`);
  console.log(`  Avg latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`  Cache statuses: ${[...new Set(cacheStatuses)].join(", ")}`);
  console.log(`  All responses: 200 OK`);
}

run().catch((error) => {
  console.error("market-agent-integration-test: failed");
  console.error(error?.message || error);
  process.exit(1);
});
