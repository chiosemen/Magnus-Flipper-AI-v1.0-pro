import { useInfiniteQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useListings(params?: Record<string, string | number | undefined>) {
  return useInfiniteQuery({
    queryKey: ['listings', params],
    // Default parameter ensures v4 compatibility; initialPageParam is v5-only
    queryFn: ({ pageParam = 1, signal }) => api.getListingsFeed({ page: pageParam, pageSize: 20, ...(params || {}) }, signal),
    // initialPageParam is required in v5, but default parameter above ensures v4 compatibility
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.total || !lastPage?.page || !lastPage?.pageSize) return undefined
      const next = lastPage.page + 1
      const max = Math.ceil(lastPage.total / lastPage.pageSize)
      return next <= max ? next : undefined
    },
  })
}
