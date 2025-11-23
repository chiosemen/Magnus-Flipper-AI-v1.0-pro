import useSWR from 'swr'
import { api } from '../lib/api'
import type { Listing } from '@magnus-flipper-ai/core'

export function useListing(id?: string) {
  const { data, error, isLoading } = useSWR<Listing>(id ? ['listing', id] : null, () => api.getListing(id!))
  return { data, error, isLoading }
}
