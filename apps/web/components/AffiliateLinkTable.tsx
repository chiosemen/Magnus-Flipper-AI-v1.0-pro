"use client";

import { Card } from "@/marketing-swoopa/components/ui/card";

interface AffiliateLink {
  id: string;
  url: string;
  status: string;
  [key: string]: any;
}

interface AffiliateLinkTableProps {
  links: AffiliateLink[];
  onCopy?: (url: string) => void;
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

export function AffiliateLinkTable({ links, onCopy, onEdit, onToggleStatus }: AffiliateLinkTableProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {links.length === 0 ? (
          <p className="text-center text-text-secondary py-8">No affiliate links found</p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">{link.url}</span>
                <span className="text-xs text-text-secondary">{link.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
