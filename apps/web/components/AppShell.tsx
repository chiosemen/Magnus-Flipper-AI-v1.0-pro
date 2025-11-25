import { SidebarNav } from "./SidebarNav";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-10">{children}</main>
      </div>
    </div>
  );
}
