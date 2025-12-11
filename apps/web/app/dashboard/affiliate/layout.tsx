"use client";

import { Stack } from "../../../components/ui/stack";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../../lib/utils";

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/affiliate/links", label: "Links" },
    { href: "/dashboard/affiliate/creatives", label: "Creatives" },
    { href: "/dashboard/affiliate/earnings", label: "Earnings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <Stack
            direction="row"
            spacing={2}
            className="overflow-x-auto py-4 -mx-4 sm:mx-0 px-4 sm:px-0"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "whitespace-nowrap",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </Stack>
        </div>
      </div>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
