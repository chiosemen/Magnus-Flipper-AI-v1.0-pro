import Image from "next/image";
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
              className="rounded-lg bg-cyan-300 px-6 py-3 text-black font-semibold hover:bg-cyan-200 transition"
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
          <p className="text-sm text-white/50 mb-6">
            Currently monitored marketplaces
          </p>

          <div className="flex flex-wrap items-center gap-8">
            <Image src="/logos/facebook.png" alt="Facebook Marketplace" width={140} height={40} />
            <Image src="/logos/vinted.png" alt="Vinted" width={120} height={40} className="opacity-40" />
            <Image src="/logos/gumtree.png" alt="Gumtree" width={120} height={40} className="opacity-40" />
            <Image src="/logos/cex.png" alt="CeX" width={80} height={40} className="opacity-40" />
          </div>
        </div>
      </section>

      {/* LISTINGS PREVIEW */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-10">
            <h2 className="text-2xl font-bold">Recent marketplace listings</h2>
            <p className="text-white/60 mt-2">
              Example listings detected during monitored scans.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                img: "/listings/iphone.jpg",
                title: "iPhone 13 Pro",
                price: "£420",
                meta: "London · 12m ago",
              },
              {
                img: "/listings/macbook.jpg",
                title: "MacBook Air M1",
                price: "£610",
                meta: "Manchester · 27m ago",
              },
              {
                img: "/listings/playstation.jpg",
                title: "PlayStation 5",
                price: "£380",
                meta: "Birmingham · 41m ago",
              },
              {
                img: "/listings/samsung.jpg",
                title: "Samsung S23 Ultra",
                price: "£500",
                meta: "Leeds · 1h ago",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden"
              >
                <div className="aspect-square bg-black/30">
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-cyan-300 font-semibold">{item.price}</p>
                  <p className="text-xs text-white/50 mt-1">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 mt-6">
            Example data shown for demonstration.
          </p>
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
          <h2 className="text-3xl font-bold">
            Ready to monitor Facebook Marketplace automatically?
          </h2>
          <div className="mt-8">
            <Link
              href="/pricing"
              className="inline-block rounded-lg bg-cyan-300 px-8 py-4 text-black font-semibold hover:bg-cyan-200 transition"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
