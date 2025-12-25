import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Monitor Facebook Marketplace for real opportunities — automatically.
          </h1>
          <p className="mt-6 text-white/70 text-lg">
            We scan Facebook Marketplace at fixed intervals and surface relevant
            listings so you don't have to refresh, scroll, or miss timing.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-6 py-3 font-semibold text-black transition-all duration-200 hover:bg-cyan-200 hover:shadow-[0_0_0_4px_rgba(79,240,230,0.15)] active:scale-[0.98]"
            >
              View pricing
            </Link>
            <Link
              href="#how-it-works"
              className="text-white/60 hover:text-white transition"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* MARKETPLACES */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="mb-6 text-xs uppercase tracking-widest text-white/50">
            Monitoring across major resale marketplaces
          </p>

          <div className="flex flex-wrap items-center gap-8 opacity-90">
            {[
              { name: "Facebook Marketplace", src: "/logos/facebook.svg" },
              { name: "Vinted", src: "/logos/vinted.svg" },
              { name: "Gumtree", src: "/logos/gumtree.svg" },
              { name: "CeX", src: "/logos/cex.svg" },
            ].map((logo) => (
              <div
                key={logo.name}
                className="transition-all duration-300 hover:opacity-100 hover:scale-[1.05]"
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 grayscale hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS PREVIEW */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Live opportunities detected
          </h2>
          <p className="text-sm text-white/60 mb-6">
            Example listings surfaced during active scan windows
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                title: "iPhone 14 Pro · 128GB",
                price: "£620",
                img: "/listings/iphone.jpg",
                tag: "NEW",
              },
              {
                title: "MacBook Pro M1",
                price: "£780",
                img: "/listings/macbook.jpg",
                tag: "HOT",
              },
              {
                title: "PlayStation 5",
                price: "£410",
                img: "/listings/ps5.jpg",
              },
              {
                title: "Nike Dunk Low",
                price: "£95",
                img: "/listings/nike.jpg",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="aspect-square object-cover"
                />

                {item.tag && (
                  <span className="absolute top-2 right-2 text-xs bg-cyan-300 text-black px-2 py-1 rounded">
                    {item.tag}
                  </span>
                )}

                <div className="p-3 text-sm">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-cyan-300 font-semibold">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="font-semibold mb-2">Monitors continuously</h3>
              <p className="text-white/60">
                Facebook Marketplace is scanned at defined intervals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Surfaces relevant listings</h3>
              <p className="text-white/60">
                Results match your configured searches.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Saves time</h3>
              <p className="text-white/60">
                No manual refreshing or missed windows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h3 className="text-3xl font-black tracking-tight mb-4">
            Start monitoring live markets
          </h3>

          <p className="text-white/60 max-w-xl mx-auto mb-8">
            Open limited scan windows across resale platforms.
            See opportunities before they disappear.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/pricing"
              className="rounded-lg bg-cyan-300 px-8 py-4 text-black font-semibold transition-all duration-200 hover:bg-cyan-200 hover:shadow-[0_0_0_4px_rgba(79,240,230,0.15)] active:scale-[0.98]"
            >
              View pricing
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 px-8 py-4 text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
            >
              Preview dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
