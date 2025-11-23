export function usePlan() {
  // TODO: Replace with real plan endpoint when available
  return {
    data: { tier: 'pro', searchesAllowed: 15, searchesUsed: 8 },
    isLoading: false,
    error: null,
  }
}
