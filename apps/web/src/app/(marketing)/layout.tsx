import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

/**
 * Marketing Layout
 * 
 * Shared layout for all marketing pages. Includes header and footer
 * with internal linking and conversion tracking.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

