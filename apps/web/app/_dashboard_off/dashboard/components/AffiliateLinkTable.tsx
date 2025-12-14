"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  status: "active" | "paused";
  createdAt: string;
}

interface AffiliateLinkTableProps {
  links: AffiliateLink[];
  onCopy?: (url: string) => void;
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

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

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" justify="between" align="center" className="flex-wrap gap-4">
          <CardTitle>Affiliate Links</CardTitle>
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
        </Stack>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="hidden sm:table-cell">URL</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No links found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <code className="text-xs text-muted-foreground truncate max-w-[200px] block">
                        {link.url}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">{link.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{link.conversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      ${link.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={link.status === "active" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}
                      >
                        {link.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={2} justify="end" className="flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(link.url)}
                          className="text-xs"
                        >
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(link.id)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus?.(link.id)}
                          className="text-xs"
                        >
                          {link.status === "active" ? "Pause" : "Activate"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
