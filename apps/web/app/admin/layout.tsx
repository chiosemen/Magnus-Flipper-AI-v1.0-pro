export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// NOTE: If these exports are already present in this file
// from manus-fix v1, keep only ONE copy of each to avoid
// duplicate identifier errors.

// existing imports remain below

import { requireAdmin } from "@/lib/admin";
import { AdminSidebar } from "./components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
