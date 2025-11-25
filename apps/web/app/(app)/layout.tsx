import { AppShell } from "@/components/AppShell";
import { ReactQueryProvider } from "@/lib/react-query-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AppShell>{children}</AppShell>
    </ReactQueryProvider>
  );
}
