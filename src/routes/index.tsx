import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Quote, Leaf, Award, Mail } from "lucide-react";
import hero from "@/assets/hero-date.jpg";
import { fetchProducts, fetchCategories } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: featured } = useQuery({ queryKey: ["featured"], queryFn: () => fetchProducts({ featured: true }) });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => fetchCategories() });
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

      {/* CATEGORIES */}
      {cats && cats.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pt-20">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Curated</p>
            <h2 className="font-display text-4xl mt-1">Shop by category</h2>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {cats.slice(0, 4).map(c => (
              <Link key={c.id} to="/products" search={{ cat: c.slug }} className="card-3d group relative overflow-hidden rounded-2xl glass aspect-[4/5]">
                <img src={c.image_url || "/images/products/medjool.jpg"} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 z-10">
                  <h3 className="font-display text-2xl">{c.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
          {(featured || []).map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* STORY */}
      <section className="relative overflow-hidden bg-gradient-surface py-24">
        <div className="mx-auto max-w-5xl px-6 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Our heritage</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">From the oases of <span className="text-gradient-gold">Madinah</span> to your majlis.</h2>
            <p className="text-muted-foreground">For three generations, the Khejur Hat family has hand-selected each fruit at the peak of harvest — sun-dried under the Arabian sky, sealed within hours, and flown directly to Bangladesh. No middlemen. No compromises.</p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[{i:Leaf,t:"100% Halal"},{i:Award,t:"Royal Grade"},{i:ShieldCheck,t:"Lab Tested"}].map(({i:I,t}) => (
                <div key={t} className="glass rounded-xl p-3 text-center">
                  <I className="h-5 w-5 mx-auto text-gold mb-1" />
                  <div className="text-xs">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-elegant glow-amber">
              <img src={hero} alt="Heritage" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Loved across Bangladesh</p>
          <h2 className="font-display text-4xl mt-1">Words from our patrons</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { n: "Tahmina R.", c: "Dhaka", q: "The Ajwa was unreal — softer and sweeter than anything I've had from a Dubai souk. The velvet box made it perfect for Eid gifting." },
            { n: "Imran H.", c: "Chattogram", q: "Delivery was overnight and the packaging felt like a luxury watch. My family won't buy dates anywhere else now." },
            { n: "Sumi A.", c: "Sylhet", q: "Khejur Hat's Medjool is on another level. The gold-foil presentation is genuinely museum-worthy." },
          ].map(t => (
            <figure key={t.n} className="glass rounded-2xl p-6 space-y-3">
              <Quote className="h-5 w-5 text-gold" />
              <blockquote className="text-sm leading-relaxed">"{t.q}"</blockquote>
              <figcaption className="text-xs text-muted-foreground">— {t.n}, {t.c}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero glass-strong p-10 md:p-14 text-center hero-particles">
          <Mail className="h-6 w-6 mx-auto text-gold mb-3" />
          <h2 className="font-display text-3xl md:text-4xl">Join the Majlis</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">Be first to hear of new harvests, Ramadan-only releases, and private gifting collections.</p>
          <form onSubmit={(e) => { e.preventDefault(); }} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input type="email" required placeholder="your@email.com"
              className="flex-1 rounded-full bg-input/80 border border-border px-5 py-3 text-sm outline-none focus:border-gold" />
            <button className="rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
}
