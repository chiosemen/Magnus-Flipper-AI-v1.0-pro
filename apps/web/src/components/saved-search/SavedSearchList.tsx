"use client";

import { SavedSearchItem } from "./SavedSearchItem";

interface SavedSearch {
  id: string;
  name: string;
  category?: string;
  manufacturer?: string;
  minPrice?: number;
  marketplace?: string;
}

interface SavedSearchListProps {
  searches: SavedSearch[];
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export function SavedSearchList({ searches, onRename, onDelete }: SavedSearchListProps) {
  if (searches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No saved searches yet.</p>
        <p className="text-sm mt-2">Create a search to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <SavedSearchItem
          key={search.id}
          search={search}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
