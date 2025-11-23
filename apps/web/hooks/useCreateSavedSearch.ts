import { useCallback, useState } from 'react'
import { api, SavedSearchPayload } from '../lib/api'

export function useCreateSavedSearch(onSuccess?: () => void) {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (payload: SavedSearchPayload) => {
      setLoading(true)
      setError(null)
      try {
        await api.createSavedSearch(payload)
        onSuccess?.()
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [onSuccess]
  )

  return { mutate, isLoading, error }
}
