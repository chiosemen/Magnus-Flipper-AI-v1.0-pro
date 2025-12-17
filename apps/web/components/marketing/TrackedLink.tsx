"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConversionPath } from "@/lib/hooks/useConversionPath";
import type { ComponentProps } from "react";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  intent?: "primary" | "secondary" | "footer" | "header";
  children: React.ReactNode;
}

/**
 * TrackedLink Component
 * 
 * Wrapper around Next.js Link that automatically tracks clicks with conversion system.
 * Non-intrusive - preserves all Link props and behavior.
 */
export function TrackedLink({ intent = "secondary", children, href, ...props }: TrackedLinkProps) {
  const pathname = usePathname();
  const { trackClick } = useConversionPath();

  const handleClick = () => {
    const target = typeof href === "string" ? href : href.pathname || "/";
    trackClick({
      source: pathname || "/",
      target,
      intent,
    });
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}

