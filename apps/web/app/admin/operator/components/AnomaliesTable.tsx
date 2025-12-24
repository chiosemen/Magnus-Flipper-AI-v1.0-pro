'use client';

/**
 * Anomalies Table Component
 * Displays recent scraping anomalies
 */

import { useState, useEffect } from 'react';
import { Card } from '@/marketing-swoopa/components/ui/card';
import { Badge } from '@/marketing-swoopa/components/ui/badge';
import { Button } from '@/marketing-swoopa/components/ui/button';
import { Input } from '@/marketing-swoopa/components/ui/input';
import { Label } from '@/marketing-swoopa/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/marketing-swoopa/components/ui/table';

interface Anomaly {
  id: string;
  created_at: string;
  type: string;
  severity: string;
  marketplace: string;
  source: string;
  query?: string;
  duration_ms?: number;
}

export function AnomaliesTable() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketplaceFilter, setMarketplaceFilter] = useState('');

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (marketplaceFilter) {
        params.append('marketplace', marketplaceFilter);
      }
      params.append('limit', '50');

      const res = await fetch(`/api/operator/anomalies?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch anomalies');
      }

      const data = await res.json();
      setAnomalies(data.anomalies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleFilter = () => {
    fetchAnomalies();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Anomalies</h2>
          <Button onClick={fetchAnomalies} variant="outline" size="sm" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="marketplace-filter" className="sr-only">
              Filter by marketplace
            </Label>
            <Input
              id="marketplace-filter"
              placeholder="Filter by marketplace (e.g., craigslist)"
              value={marketplaceFilter}
              onChange={(e) => setMarketplaceFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
          </div>
          <Button onClick={handleFilter} variant="secondary">
            Filter
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            Error: {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && anomalies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No anomalies found
          </div>
        )}

        {!loading && !error && anomalies.length > 0 && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anomaly) => (
                  <TableRow key={anomaly.id}>
                    <TableCell className="text-sm">
                      {new Date(anomaly.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{anomaly.marketplace}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={anomaly.source === 'apify' ? 'default' : 'secondary'}>
                        {anomaly.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{anomaly.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          anomaly.severity === 'critical'
                            ? 'destructive'
                            : anomaly.severity === 'high'
                            ? 'destructive'
                            : anomaly.severity === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {anomaly.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {anomaly.query || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading anomalies...
          </div>
        )}
      </div>
    </Card>
  );
}

