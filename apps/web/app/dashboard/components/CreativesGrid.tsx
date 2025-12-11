"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Stack } from "../../../components/ui/stack";

export interface Creative {
  id: string;
  name: string;
  type: "banner" | "text" | "video";
  status: "active" | "paused" | "draft";
  clicks: number;
  conversions: number;
  ctr: number;
  previewUrl?: string;
}

interface CreativesGridProps {
  creatives: Creative[];
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

export function CreativesGrid({ creatives, onEdit, onToggleStatus }: CreativesGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {creatives.map((creative) => (
        <Card key={creative.id} className="flex flex-col">
          <CardHeader>
            <Stack direction="row" justify="between" align="start">
              <div className="flex-1">
                <CardTitle className="text-lg">{creative.name}</CardTitle>
                <CardDescription className="mt-1">
                  {creative.type.charAt(0).toUpperCase() + creative.type.slice(1)} Creative
                </CardDescription>
              </div>
              <Badge
                variant={
                  creative.status === "active"
                    ? "default"
                    : creative.status === "paused"
                    ? "secondary"
                    : "outline"
                }
              >
                {creative.status}
              </Badge>
            </Stack>
          </CardHeader>
          <CardContent className="flex-1">
            <Stack direction="column" spacing={3}>
              {creative.previewUrl && (
                <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  <img
                    src={creative.previewUrl}
                    alt={creative.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Stack direction="column" spacing={2}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Clicks</span>
                  <span className="font-medium">{creative.clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conversions</span>
                  <span className="font-medium">{creative.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CTR</span>
                  <span className="font-medium">{creative.ctr.toFixed(2)}%</span>
                </div>
              </Stack>
            </Stack>
          </CardContent>
          <CardFooter>
            <Stack direction="row" spacing={2} className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(creative.id)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => onToggleStatus?.(creative.id)}
              >
                {creative.status === "active" ? "Pause" : "Activate"}
              </Button>
            </Stack>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
