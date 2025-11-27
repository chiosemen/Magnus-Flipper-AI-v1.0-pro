"use client";

import { useEffect, useState, useCallback } from "react";
import { api, SavedSearch, SavedSearchInput } from "../lib/api";

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.savedSearches.list();
      setSearches(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load saved searches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSavedSearch = async (id: string) => api.savedSearches.get(id);

  const createSearch = async (input: SavedSearchInput) => {
    const created = await api.savedSearches.create(input);
    setSearches((prev) => [...prev, created]);
    return created;
  };

  const updateSavedSearch = async (id: string, updates: Partial<SavedSearchInput>) => {
    const updated = await api.savedSearches.update(id, updates);
    setSearches((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteSavedSearch = async (id: string) => {
    await api.savedSearches.delete(id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    searches,
    loading,
    error,
    refresh,
    getSavedSearch,
    createSavedSearch: createSearch,
    updateSavedSearch,
    deleteSavedSearch,
  };
}
