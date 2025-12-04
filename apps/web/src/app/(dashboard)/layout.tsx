import { AppShell } from "@/components/layout/AppShell";
import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/dashboard");
  }

  return <AppShell>{children}</AppShell>;
}
