import { Suspense } from "react";
import CheckoutSuccessClient from "./success-client";

export const dynamic = "force-dynamic";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}

function SuccessFallback() {
  return (
    <div className="mx-auto max-w-xl py-24 text-center text-sm text-muted-foreground">
      Confirming your scan...
    </div>
  );
}
