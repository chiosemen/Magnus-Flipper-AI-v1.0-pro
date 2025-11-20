import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express from "express";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    integrations: [nodeProfilingIntegration()],
  });
}

// Express glue (for Nest use app.connectMicroservice or useNestServer)
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler() as express.RequestHandler;
}

export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler() as express.RequestHandler;
}

export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({}) as express.ErrorRequestHandler;
}

// Helper to capture exceptions in async jobs
export function captureJobException(err: unknown, context?: Record<string, any>) {
  Sentry.captureException(err, { extra: context });
}
