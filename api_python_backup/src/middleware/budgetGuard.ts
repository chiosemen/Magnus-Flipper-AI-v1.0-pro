import * as Sentry from "@sentry/node";
import { Request, Response, NextFunction } from "express";
import { takeTokens } from "../budget/tokenBucket";
import { budgetThrottleCounter } from "../metrics";

export function budgetGuard(kind: "alerts" | "llm", tokensPerRequest: (req: Request) => number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawOrgId = (req as any).orgId || req.headers["x-org-id"];
      if (!rawOrgId) return res.status(400).json({ error: "Missing org context" });
      const orgId = String(rawOrgId);

      const amount = tokensPerRequest(req);
      const result = await takeTokens(kind, orgId, amount);

      if (!result.allowed) {
        Sentry.addBreadcrumb({
          category: "budget",
          level: "warning",
          data: { orgId, kind, used: result.used, cap: result.cap },
        });
        const metric = budgetThrottleCounter?.labels(kind, orgId);
        metric?.inc();

        return res.status(429).json({
          error: "Budget exceeded",
          kind,
          used: result.used,
          limit: result.limit,
          cap: result.cap,
          retry_after_seconds: 60,
        });
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}
