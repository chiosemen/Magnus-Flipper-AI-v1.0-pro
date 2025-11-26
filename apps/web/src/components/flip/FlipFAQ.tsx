interface FAQItem {
  q: string;
  a: string;
}

interface FlipFAQProps {
  items: FAQItem[];
}

export function FlipFAQ({ items }: FlipFAQProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-semibold text-white">FAQ</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-4"
          >
            <p className="text-sm font-semibold text-slate-100">{item.q}</p>
            <p className="mt-2 text-sm text-slate-300">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
