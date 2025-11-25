/**
 * Marketing layout - for public pages like landing, pricing, flip verticals
 * No sidebar, minimal navigation
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-dark-slate">
      {/* TODO: Add marketing header/nav in future */}
      <main>{children}</main>
    </div>
  )
}
