/**
 * Smoke tests for critical API endpoints
 * Run these after deployment to verify basic functionality
 *
 * Usage: pnpm test:smoke
 */

const API_URL = process.env.API_URL || "http://localhost:4000";

describe("Magnus Flipper API - Smoke Tests", () => {
  describe("Health Checks", () => {
    it("should return 200 from root endpoint", async () => {
      const response = await fetch(`${API_URL}/`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain("Magnus Flipper");
    });

    it("should return health status", async () => {
      const response = await fetch(`${API_URL}/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("uptime");
    });

    it("should return liveness probe", async () => {
      const response = await fetch(`${API_URL}/health/liveness`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("alive");
    });

    it("should return readiness probe", async () => {
      const response = await fetch(`${API_URL}/health/readiness`);
      const data = await response.json();
      expect([200, 503]).toContain(response.status); // May be 503 if DB not configured
      expect(data).toHaveProperty("checks");
    });

    it("should return detailed status", async () => {
      const response = await fetch(`${API_URL}/health/status`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.service).toBe("magnus-flipper-api");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("memory");
      expect(data).toHaveProperty("database");
    });
  });

  describe("Metrics", () => {
    it("should return Prometheus metrics", async () => {
      const response = await fetch(`${API_URL}/metrics`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("http_requests_total");
      expect(text).toContain("http_request_duration_seconds");
    });
  });

  describe("API Endpoints", () => {
    it("should return deals list", async () => {
      const response = await fetch(`${API_URL}/api/deals`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("deals");
      expect(Array.isArray(data.deals)).toBe(true);
    });

    it("should filter deals by minScore", async () => {
      const response = await fetch(`${API_URL}/api/deals?minScore=90`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("deals");
      expect(Array.isArray(data.deals)).toBe(true);
      // All deals should have score >= 90
      data.deals.forEach((deal: any) => {
        expect(deal.score).toBeGreaterThanOrEqual(90);
      });
    });

    it("should return 401 for watchlists without auth", async () => {
      const response = await fetch(`${API_URL}/api/watchlists`);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 for alerts without auth", async () => {
      const response = await fetch(`${API_URL}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: "test",
          channel: "email",
        }),
      });
      expect(response.status).toBe(401);
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await fetch(`${API_URL}/`);
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBeTruthy();
      expect(response.headers.get("strict-transport-security")).toBeTruthy();
      expect(response.headers.has("x-powered-by")).toBe(false); // Should be hidden
    });
  });

  describe("Rate Limiting", () => {
    it("should include rate limit headers", async () => {
      const response = await fetch(`${API_URL}/api/deals`);
      expect(response.headers.has("ratelimit-limit")).toBe(true);
      expect(response.headers.has("ratelimit-remaining")).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await fetch(`${API_URL}/api/nonexistent`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Not Found");
    });

    it("should handle malformed JSON", async () => {
      const response = await fetch(`${API_URL}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json }",
      });
      expect([400, 401]).toContain(response.status);
    });
  });

  describe("API Versioning", () => {
    it("should support v1 routes", async () => {
      const response = await fetch(`${API_URL}/api/v1/deals`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("deals");
    });

    it("should support legacy routes (backwards compatibility)", async () => {
      const response = await fetch(`${API_URL}/api/deals`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("deals");
    });
  });
});
