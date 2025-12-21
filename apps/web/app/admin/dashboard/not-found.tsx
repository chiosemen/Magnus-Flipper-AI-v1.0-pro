import Link from "next/link";

/**
 * Not Found Page for Admin Dashboard
 *
 * SECURITY: This page is shown to non-admin users who try to access /admin/dashboard
 * Returning 404 instead of 403 helps hide the existence of admin routes
 */
export default function AdminDashboardNotFound() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4 opacity-30">🔒</div>
        <h1 className="text-4xl font-bold text-[#ededed] mb-4">404</h1>
        <p className="text-lg text-[#6E7681] mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#4FF0E6] text-[#0D1117] font-semibold rounded-lg hover:bg-[#4FF0E6]/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
