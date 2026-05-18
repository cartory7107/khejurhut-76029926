import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Truck } from "lucide-react";
import hero from "@/assets/hero-date.jpg";
import { fetchProducts } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: featured } = useQuery({ queryKey: ["featured"], queryFn: () => fetchProducts({ featured: true }) });
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden hero-particles bg-gradient-hero min-h-[88vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-70 hero-crack" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-24 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6 reveal">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-gold">
              <Sparkles className="h-3 w-3" /> Ramadan 1447 Collection
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
              The crown of dates,<br/>
              <span className="text-gradient-gold">delivered to your door.</span>
            </h1>
            <p className="font-arabic text-2xl text-gold/90">خجور حات — فاخرة</p>
            <p className="text-muted-foreground max-w-md">
              Hand-picked Ajwa, Medjool, Safawi and rare luxury gift boxes from the heart of Arabia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold pulse-glow">
                Shop Collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/categories" className="inline-flex items-center gap-2 rounded-full glass border border-gold/30 px-6 py-3 text-sm">
                Explore Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="mx-auto max-w-7xl px-6 -mt-10 relative z-10 grid gap-3 md:grid-cols-3">
        {[
          { i: Truck, t: "Free over ৳2000", d: "Express delivery nationwide" },
          { i: ShieldCheck, t: "100% Authentic", d: "Direct from Madinah & California" },
          { i: Sparkles, t: "Luxury Gifting", d: "Velvet boxes, gold ribbons" },
        ].map(({ i: I, t, d }) => (
          <div key={t} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="h-11 w-11 grid place-items-center rounded-full bg-gradient-gold text-primary-foreground"><I className="h-5 w-5" /></div>
            <div><div className="font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Featured</p>
            <h2 className="font-display text-4xl mt-1">Signature Collection</h2>
          </div>
          <Link to="/products" className="text-sm text-gold hover:underline">View all →</Link>
        </div>
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(featured || []).slice(0, 8).map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}
