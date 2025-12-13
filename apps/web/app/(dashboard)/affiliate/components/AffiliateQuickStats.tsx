import { Card } from "@magnus-flipper-ai/ui/components";
import Link from "next/link";

/**
 * Affiliate Quick Stats - Navigation cards for quick access
 */
export function AffiliateQuickStats() {
  const quickLinks = [
    {
      title: "Links",
      description: "Manage affiliate links",
      href: "/dashboard/affiliate/links",
      icon: "🔗",
      count: null,
    },
    {
      title: "Earnings",
      description: "View earnings and payouts",
      href: "/dashboard/affiliate/earnings",
      icon: "💰",
      count: null,
    },
    {
      title: "Creatives",
      description: "Banners and promotional materials",
      href: "/dashboard/affiliate/creatives",
      icon: "🎨",
      count: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {quickLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="p-6 hover:shadow-card-hover transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{link.icon}</div>
              <div className="flex-1">
                <h3 className="text-h5 font-heading font-semibold text-foreground mb-1">
                  {link.title}
                </h3>
                <p className="text-body-s text-text-secondary">{link.description}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
