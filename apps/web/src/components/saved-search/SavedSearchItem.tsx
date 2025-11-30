"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { getMarketplaceColor } from "@/lib/ui/marketplace-ui";

interface SavedSearch {
  id: string;
  name: string;
  category?: string;
  manufacturer?: string;
  minPrice?: number;
  marketplace?: string;
}

interface SavedSearchItemProps {
  search: SavedSearch;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export function SavedSearchItem({ search, onRename, onDelete }: SavedSearchItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(search.name);

  const handleSave = () => {
    if (editedName.trim() && onRename) {
      onRename(search.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(search.name);
    setIsEditing(false);
  };

  const marketplaceClass = getMarketplaceColor(search.marketplace || "");

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h3 className="font-semibold text-lg">{search.name}</h3>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {search.category || "All categories"} • {search.manufacturer || "Any brand"} •{" "}
              {search.minPrice ? `$${search.minPrice}+` : "Any price"}
            </p>
            {search.marketplace && (
              <Badge variant="outline" className={`mt-2 capitalize ${marketplaceClass}`}>
                {search.marketplace.toLowerCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(search.id)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
