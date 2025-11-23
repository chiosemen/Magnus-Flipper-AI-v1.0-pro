import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Magnus Flipper AI - Admin Dashboard',
  description: 'Premium admin dashboard for Magnus Flipper AI marketplace automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
