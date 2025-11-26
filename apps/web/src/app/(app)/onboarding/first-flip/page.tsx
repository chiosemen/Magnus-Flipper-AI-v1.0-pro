"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FirstFlipIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/first-flip/step-1");
  }, [router]);

  return null;
}
