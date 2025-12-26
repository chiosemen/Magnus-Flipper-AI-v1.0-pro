type GateResult = { ok: true; planTier?: string } | { ok: false; reason: string };

export async function requireEntitlementOrExit(
  userId: string | undefined,
  marketplace: string
): Promise<GateResult> {
  const apiBaseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    return { ok: false, reason: "api_base_missing" };
  }

  if (!userId) {
    return { ok: false, reason: "user_id_missing" };
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/entitlements/consume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, marketplace }),
    });

    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }

    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      plan_tier?: string;
    };

    if (json.ok !== true) {
      return { ok: false, reason: json.reason || "no_credits" };
    }

    return { ok: true, planTier: json.plan_tier };
  } catch (error) {
    console.warn("Entitlement check failed:", error);
    return { ok: false, reason: "entitlement_check_failed" };
  }
}
