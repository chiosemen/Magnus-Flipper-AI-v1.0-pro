export function isDemoMode(): boolean {
  if (typeof process === "undefined") return false;
  const val = process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE ?? "false";
  return val === "true" || val === "1";
}
