"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import { Input } from "@magnus-flipper-ai/ui/components/Input";
import { useState } from "react";
import type { AffiliateLink } from "@magnus-flipper-ai/core/types/affiliate";

interface AffiliateLinkTableProps {
  links: AffiliateLink[];
  onCopy?: (url: string) => void;
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

/**
 * AffiliateLinkTable - Displays affiliate links in a table
 * Uses design tokens and shared UI components
 */
export function AffiliateLinkTable({
  links,
  onCopy,
  onEdit,
  onToggleStatus,
}: AffiliateLinkTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLinks = links.filter(
    (link) =>
      link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    onCopy?.(url);
  };

  if (links.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">No affiliate links found</p>
          <Button variant="default">Create Your First Link</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-h4 font-heading font-semibold text-foreground">Affiliate Links</h2>
        <Input
          placeholder="Search links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary min-w-[200px]">
                Name
              </th>
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary hidden sm:table-cell">
                URL
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Clicks
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Conversions
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Revenue
              </th>
              <th className="text-center py-3 px-4 text-body-s font-semibold text-text-secondary">
                Status
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-text-muted">
                  No links match your search
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => (
                <tr
                  key={link.id}
                  className="border-b border-border hover:bg-surfaceSubtle transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="text-body-m font-medium text-foreground">{link.name}</div>
                  </td>
                  <td className="py-4 px-4 hidden sm:table-cell">
                    <code className="text-body-s text-text-secondary truncate max-w-[200px] block">
                      {link.url}
                    </code>
                  </td>
                  <td className="py-4 px-4 text-body-m text-foreground text-right">
                    {link.clicks.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-body-m text-foreground text-right">
                    {link.conversions.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-body-m font-semibold text-success text-right">
                    ${link.revenue.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-body-s ${
                        link.status === "active"
                          ? "bg-success/20 text-success"
                          : link.status === "paused"
                          ? "bg-warning/20 text-warning"
                          : "bg-text-muted/20 text-text-muted"
                      }`}
                    >
                      {link.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(link.fullUrl || link.url)}
                      >
                        Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit?.(link.id)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus?.(link.id)}
                      >
                        {link.status === "active" ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
