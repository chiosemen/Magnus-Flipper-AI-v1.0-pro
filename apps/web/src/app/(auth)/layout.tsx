/**
 * Auth layout - for signin, signup, callback flows
 * Minimal centered layout
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-slate">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
