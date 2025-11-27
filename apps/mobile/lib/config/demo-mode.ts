export function isDemoMode(): boolean {
  const val =
    process.env.EXPO_PUBLIC_DEMO_MODE ??
    process.env.NEXT_PUBLIC_DEMO_MODE ??
    process.env.DEMO_MODE ??
    "false";
  return val === "true" || val === "1";
}
