import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Middleware to verify JWT token from Supabase Auth
 * Extracts user info and attaches to req.user
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!supabaseAdmin) {
      return res.status(500).json({
        error: "Configuration Error",
        message: "Authentication service not configured",
      });
    }

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.substring(7);

    if (supabaseAdmin) {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
        };
      }
    }
  } catch (error) {
    console.error("Optional auth error:", error);
  }

  next();
}
