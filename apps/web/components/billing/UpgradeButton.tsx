import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpgradeButtonProps {
  plan?: string;
  href?: string;
  onClick?: () => void;
}

export function UpgradeButton({ plan = "Pro", href = "/billing", onClick }: UpgradeButtonProps) {
  return (
    <Button onClick={onClick} asChild>
      <Link href={href}>Upgrade to {plan}</Link>
    </Button>
  );
}
