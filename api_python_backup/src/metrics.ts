type Counter = {
  labels: (kind: string, orgId: string) => { inc: (value?: number) => void };
};

let budgetThrottleCounter: Counter | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const promClient = require("prom-client");
  budgetThrottleCounter = new promClient.Counter({
    name: "budget_throttles_total",
    help: "Number of requests throttled by the budget guard",
    labelNames: ["kind", "org_id"],
  });
} catch (error) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("Prometheus client not available; budget metrics disabled.");
  }
}

export { budgetThrottleCounter };
