import express from "express";
import { jest } from "@jest/globals";
import type { AddressInfo } from "node:net";

type QueryResult<T> = {
  data: T | null;
  error: any;
};

const dealsSample = [
  { id: "1", title: "PS5", score: 92, price: 400, currency: "USD", created_at: "2024-01-01" },
  { id: "2", title: "GPU", score: 88, price: 650, currency: "USD", created_at: "2024-01-02" }
] as const;

function createQueryBuilder(result: QueryResult<any>) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    then: (resolve: (value: QueryResult<any>) => void) => {
      resolve(result);
      return Promise.resolve();
    },
    catch: () => builder
  };
  return builder;
}

async function loadRouterWithSupabaseMock(supabaseAdmin: any) {
  jest.resetModules();
  jest.unstable_mockModule("../src/lib/supabase.ts", () => ({
    supabaseAdmin
  }));

  const module = await import("../src/routes/deals.ts");
  return module.dealsRouter;
}

function createApp(router: express.Router) {
  const app = express();
  app.use(router);
  return app;
}

async function requestJson(app: express.Express, path: string) {
  return await new Promise<{ status: number; body: any }>((resolve, reject) => {
    const server = app.listen(0, async () => {
      try {
        const { port } = server.address() as AddressInfo;
        const response = await fetch(`http://127.0.0.1:${port}${path}`);
        const data = await response.json();
        resolve({ status: response.status, body: data });
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });
}

describe("deals router", () => {
  it("returns 503 when Supabase is not configured", async () => {
    const router = await loadRouterWithSupabaseMock(null);
    const app = createApp(router);

    const res = await requestJson(app, "/api/deals");
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      error: "Service Unavailable"
    });
  });

  it("returns deals payload from Supabase", async () => {
    const queryBuilder = createQueryBuilder({ data: dealsSample, error: null });
    const supabaseMock = {
      from: jest.fn().mockReturnValue(queryBuilder)
    };

    const router = await loadRouterWithSupabaseMock(supabaseMock);
    const app = createApp(router);

    const res = await requestJson(app, "/api/deals");

    expect(res.status).toBe(200);
    expect(res.body.deals).toHaveLength(2);
    expect(res.body.deals[0].title).toBe("PS5");
    expect(supabaseMock.from).toHaveBeenCalledWith("deals");
    expect(queryBuilder.gte).not.toHaveBeenCalled();
  });

  it("applies minScore filter when provided", async () => {
    const queryBuilder = createQueryBuilder({ data: dealsSample, error: null });
    const supabaseMock = {
      from: jest.fn().mockReturnValue(queryBuilder)
    };

    const router = await loadRouterWithSupabaseMock(supabaseMock);
    const app = createApp(router);

    const res = await requestJson(app, "/api/deals?minScore=90");

    expect(res.status).toBe(200);
    expect(queryBuilder.gte).toHaveBeenCalledWith("score", 90);
  });

  it("surfaces database errors with 500", async () => {
    const queryBuilder = createQueryBuilder({ data: null, error: new Error("boom") });
    const supabaseMock = {
      from: jest.fn().mockReturnValue(queryBuilder)
    };

    const router = await loadRouterWithSupabaseMock(supabaseMock);
    const app = createApp(router);

    const res = await requestJson(app, "/api/deals");

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      error: "Internal Server Error",
      message: "Failed to fetch deals"
    });
  });
});
