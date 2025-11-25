import { AppShell } from "@/components/layout/app-shell";
import { ReactQueryProvider } from "@/lib/react-query-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AppShell>{children}</AppShell>
    </ReactQueryProvider>
  );
}
