import { redirect } from 'next/navigation'

/**
 * Root page - redirect to dashboard for now
 * In future, this could be a marketing landing page
 */
export default function HomePage() {
  redirect('/dashboard')
}
