import { useCallback, useState } from 'react'
import { api, SavedSearchPayload } from '../lib/api'

export function useUpdateSavedSearch(onSuccess?: () => void) {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (id: string, payload: SavedSearchPayload) => {
      setLoading(true)
      setError(null)
      try {
        await api.updateSavedSearch(id, payload)
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
