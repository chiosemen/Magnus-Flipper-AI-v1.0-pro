'use client';
import { resolveTheme } from './theme';

export default function Home() {
  const theme = resolveTheme();
  return (
    <main className="min-h-screen" style={{ background: theme.bg, color: theme.text }}>
      <section className="max-w-5xl mx-auto" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="glow" style={{ width: 32, height: 32, background: theme.primary, borderRadius: 6 }} />
          <h1 style={{ fontSize: 36, fontWeight: 900 }}>{theme.name}</h1>
        </div>
        <p style={{ color: theme.subtext, marginTop: 12 }}>
          Real-time marketplace alerts, AI valuations, and community wins.
        </p>
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ color: theme.subtext, fontSize: 12 }}>Monthly Yield</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>20%</div>
        </div>
      </section>
    </main>
  );
}
