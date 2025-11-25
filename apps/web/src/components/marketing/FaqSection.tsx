const FAQ = [
  {
    q: "Which marketplaces does Magnus support?",
    a: "At launch Magnus focuses on Facebook Marketplace, Craigslist and Gumtree. We’re adding more based on what flippers request next.",
  },
  {
    q: "Can I use Magnus for cars and couches, not just phones?",
    a: "Yes. The same search and alert engine works for phones, cars, couches and other high-margin niches — you just tune your keywords and filters.",
  },
  {
    q: "Do I need to keep my computer on 24/7?",
    a: "No. Magnus runs in the cloud. Once your searches are configured, we watch the marketplaces for you and send alerts even if you’re offline.",
  },
  {
    q: "What happens after my 7-day trial?",
    a: "You can pick a plan that matches your volume, upgrade, downgrade or cancel. Your saved searches remain in your account.",
  },
];

export function FaqSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions flippers ask before switching</h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          If you’ve ever missed a deal by minutes, Magnus is built for you.
        </p>
      </div>

      <div className="space-y-4">
        {FAQ.map((item) => (
          <div key={item.q} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-sm font-semibold text-slate-100">{item.q}</p>
            <p className="mt-2 text-xs text-slate-300 sm:text-sm">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
