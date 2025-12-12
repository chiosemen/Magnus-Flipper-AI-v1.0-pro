import { useInfiniteQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useListings(params?: Record<string, string | number | undefined>) {
  return useInfiniteQuery({
    queryKey: ['listings', params],
    queryFn: ({ pageParam, signal }) => api.getListingsFeed({ page: pageParam, pageSize: 20, ...(params || {}) }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.total || !lastPage?.page || !lastPage?.pageSize) return undefined
      const next = lastPage.page + 1
      const max = Math.ceil(lastPage.total / lastPage.pageSize)
      return next <= max ? next : undefined
    },
  })
}
