"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, MessageCircleHeart } from "lucide-react";
import Header from "../../marketing-swoopa/components/Header";
import Footer from "../../marketing-swoopa/components/Footer";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";
import { copyForRegion } from "@/lib/copy-config";

type TicketResponse = {
  ticket?: { id: string; created_at: string; status: string };
  error?: string;
};

export default function SupportPage() {
  const { user } = useAuth();
  const { region } = useRegion();
  const copy = copyForRegion(region);

  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [subject, setSubject] = useState<string>("Search optimization request");
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TicketResponse | null>(null);

  const bookCallUrl =
    process.env.NEXT_PUBLIC_BOOK_CALL_URL ||
    "mailto:support@magnusflipper.ai?subject=Book%20a%20call%20-%20Magnus%20Flipper";

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30">
                  <MessageCircleHeart className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    Support & Success
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    {copy.supportPromise}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={bookCallUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
                >
                  <CalendarDays className="h-4 w-4" />
                  Book a call
                </a>
                <a
                  href="mailto:support@magnusflipper.ai?subject=Help%20-%20Magnus%20Flipper"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold bg-[#121212] text-white border border-white/10 hover:border-[#00E5FF]/50"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  quote:
                    "The pooled feed is fast — the alerts helped me catch deals before they got buried.",
                  name: "Alex R.",
                  role: "Phone flipper",
                },
                {
                  quote:
                    "Templates made onboarding painless. One click and I was monitoring the right keywords.",
                  name: "Samantha K.",
                  role: "Marketplace reseller",
                },
                {
                  quote:
                    "The ‘hide spam’ and anti-keywords saved hours. The feed feels clean and actionable.",
                  name: "Jordan M.",
                  role: "Car trader",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="bg-[#121212] border border-white/10 rounded-xl p-5"
                >
                  <div className="text-white/80 text-sm leading-relaxed">
                    “{t.quote}”
                  </div>
                  <div className="mt-4 text-white font-extrabold">{t.name}</div>
                  <div className="text-xs text-white/60">{t.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Search optimization request
                </h2>
                <p className="text-white/70 text-sm font-medium mt-1">
                  Tell us what you’re flipping and we’ll suggest improvements to your searches and filters.
                </p>
              </div>

              <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                {result?.ticket ? (
                  <div className="text-sm text-white/80">
                    Ticket submitted. We’ll get back to you shortly.
                    <div className="text-xs text-white/50 mt-2">
                      Ticket ID: {result.ticket.id}
                    </div>
                  </div>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitting(true);
                      setResult(null);
                      fetch("/api/support/tickets", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          category: "search_optimization",
                          email: user?.email ? undefined : email,
                          subject,
                          message,
                          metadata: { source: "support_page" },
                        }),
                      })
                        .then(async (res) => {
                          const payload = (await res.json().catch(() => ({}))) as TicketResponse;
                          if (!res.ok) throw new Error(payload?.error || "Failed to submit ticket");
                          setResult(payload);
                          setMessage("");
                        })
                        .catch((err) => setResult({ error: err?.message || "Failed to submit ticket" }))
                        .finally(() => setSubmitting(false));
                    }}
                  >
                    {!user?.email && (
                      <label className="block text-xs font-semibold text-white/70">
                        Email
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="mt-2 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
                        />
                      </label>
                    )}

                    <label className="block text-xs font-semibold text-white/70">
                      Subject
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-2 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
                      />
                    </label>

                    <label className="block text-xs font-semibold text-white/70">
                      Message
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What are you trying to flip? What’s your region? Any pain points?"
                        rows={6}
                        className="mt-2 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
                      />
                    </label>

                    {result?.error && (
                      <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
                        {result.error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || message.trim().length < 10}
                      className="w-full inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit request"}
                    </button>
                    <div className="text-[11px] text-white/45">
                      This form never triggers scraping — it only creates a support ticket.
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
