// Helpers to read Supabase JWT from storage/local cookies

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('supabase.auth.token') ||
    localStorage.getItem('sb-access-token') ||
    localStorage.getItem('authToken')
  )
}
