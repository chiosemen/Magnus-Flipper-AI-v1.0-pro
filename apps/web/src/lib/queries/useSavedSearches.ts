'use client';

import useSWR from 'swr';
import type { SavedSearch } from '@magnus-flipper-ai/core';
import { getSavedSearches, createSavedSearch, updateSavedSearch, deleteSavedSearch, type SavedSearchPayload } from '@/lib/app-api';

const fetcher = (fn: () => Promise<any>) => fn();

export function useSavedSearches() {
  const { data, error, isLoading, mutate } = useSWR<SavedSearch[]>('saved-searches', () => fetcher(getSavedSearches), {
    revalidateOnFocus: false,
  });

  if (error) {
    return { searches: [], isLoading: false, error, isError: true, create, update, remove };
  }

  async function create(payload: SavedSearchPayload) {
    const res = await createSavedSearch(payload);
    mutate();
    return res;
  }

  async function update(id: string, payload: SavedSearchPayload) {
    const res = await updateSavedSearch(id, payload);
    mutate();
    return res;
  }

  async function remove(id: string) {
    await deleteSavedSearch(id);
    mutate();
  }

  return {
    searches: data || [],
    isLoading,
    error: null,
    isError: false,
    create,
    update,
    remove,
    refresh: mutate,
  };
}
