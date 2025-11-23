import { useCallback, useState } from 'react'
import { api } from '../lib/api'

export function useDeleteSavedSearch(onSuccess?: () => void) {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await api.deleteSavedSearch(id)
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
