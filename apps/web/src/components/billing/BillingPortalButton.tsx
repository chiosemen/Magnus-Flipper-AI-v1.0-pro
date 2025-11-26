"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { openPortal } from "@/lib/queries/useBilling";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    try {
      setLoading(true);
      const { url } = await openPortal();
      window.location.href = url;
    } catch (err) {
      alert("Unable to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={handlePortal} disabled={loading}>
      {loading ? "Opening portal..." : "Open billing portal"}
    </Button>
  );
}
