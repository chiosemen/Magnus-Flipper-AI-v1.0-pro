import { get } from "@vercel/edge-config";

export type ExecutionMode = "off" | "admin" | "public";

const ALLOWED_MODES: ExecutionMode[] = ["off", "admin", "public"];

export function asExecutionMode(value: unknown): ExecutionMode | null {
  if (typeof value !== "string") return null;
  return ALLOWED_MODES.includes(value as ExecutionMode)
    ? (value as ExecutionMode)
    : null;
}

export async function getExecutionMode(): Promise<ExecutionMode> {
  try {
    const mode = asExecutionMode(await get("execution_mode"));
    if (mode) return mode;
  } catch (error) {
    console.warn("[execution-mode] Edge Config read failed:", error);
  }

  const envMode = asExecutionMode(process.env.EXECUTION_MODE);
  if (envMode) return envMode;

  return "off";
}

export function isExecutionAllowedForRequest(args: {
  mode: ExecutionMode;
  isAdmin: boolean;
}): boolean {
  const { mode, isAdmin } = args;

  if (mode === "off") return false;
  if (mode === "public") return true;
  if (mode === "admin") return isAdmin;

  return false;
}
