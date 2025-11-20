import * as Sentry from "@sentry/node";
import type { Request, Response, NextFunction } from "express";
import { takeTokens, type BudgetKind } from "./tokenBucket";
import { budgetThrottleCounter } from "../metrics";

type BudgetOptions = {
  kind: BudgetKind;
  amount: number;
  burstMultiplier?: number;
  resolveOrgId: (req: Request) => string | undefined | null;
  onLimit?: (info: {
    req: Request;
    res: Response;
    kind: BudgetKind;
    limit: number;
    cap: number;
    used: number;
    remaining: number;
  }) => void;
};

export function budgetGuard(options: BudgetOptions) {
  return async function guard(req: Request, res: Response, next: NextFunction) {
    try {
      const resolvedOrgId = options.resolveOrgId(req);
      if (!resolvedOrgId) {
        return res.status(400).json({ error: "org_id required" });
      }
      const orgId = String(resolvedOrgId);

      const result = await takeTokens(options.kind, orgId, options.amount, {
        burstMultiplier: options.burstMultiplier,
      });

      if (!result.allowed) {
        Sentry.addBreadcrumb({
          category: "budget",
          level: "warning",
          data: {
            orgId: orgId,
            kind: options.kind,
            used: result.used,
            cap: result.cap,
          },
        });
        const metric = budgetThrottleCounter?.labels(options.kind, orgId);
        metric?.inc();

        options.onLimit?.({
          req,
          res,
          kind: options.kind,
          limit: result.limit,
          cap: result.cap,
          used: result.used,
          remaining: result.remaining,
        });
        return res.status(429).json({
          error: `${options.kind} budget exceeded`,
          limit: result.limit,
          remaining: result.remaining,
        });
      }

      res.setHeader(`X-Budget-${options.kind}-Remaining`, String(result.remaining));
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
