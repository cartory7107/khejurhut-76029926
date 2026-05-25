import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingBag, Heart, ArrowLeft, Package, Truck, Ticket, Copy } from "lucide-react";
import { fetchProductBySlug, fetchProducts } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { pushRecent } from "@/hooks/use-recent";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductReviews } from "@/components/shop/ProductReviews";

export const Route = createFileRoute("/products/$slug")({ component: PDP });

function PDP() {
  const { slug } = Route.useParams();
  const { data: p, isLoading } = useQuery({ queryKey: ["product", slug], queryFn: () => fetchProductBySlug(slug) });
  const { data: related } = useQuery({ queryKey: ["related"], queryFn: () => fetchProducts({ featured: true }) });
  const { data: coupons } = useQuery({
    queryKey: ["active-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .order("value", { ascending: false });
      return (data || []).filter((c: any) => !c.expires_at || new Date(c.expires_at) > new Date());
    },
  });
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => { if (p) pushRecent(p.id); }, [p]);

  if (isLoading) return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square rounded-3xl bg-cocoa animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
          <div className="h-12 w-3/4 rounded-xl bg-muted animate-pulse" />
          <div className="h-6 w-1/2 rounded-full bg-muted animate-pulse" />
          <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-12 w-full rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    </section>
  );
  if (!p) return <div className="mx-auto max-w-7xl p-12">Not found. <Link to="/products" className="text-gold">Back</Link></div>;
  const img = p.images?.[0] || "/images/products/medjool.jpg";

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold mb-6"><ArrowLeft className="h-3 w-3" /> Back to shop</Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-surface border border-border/60 glow-amber">
          <img src={img} alt={p.name} className="w-full aspect-square object-cover hero-crack" />
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-1 text-sm text-gold">
            <Star className="h-4 w-4 fill-current" /> {p.rating.toFixed(1)} <span className="text-muted-foreground">({p.review_count} reviews)</span>
          </div>
          <h1 className="font-display text-5xl">{p.name}</h1>
          {p.name_bn && <p className="font-arabic text-xl text-gold/80">{p.name_bn}</p>}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl text-gradient-gold font-semibold">{bdt(p.price)}</span>
            {p.compare_at_price && <span className="text-muted-foreground line-through">{bdt(p.compare_at_price)}</span>}
          </div>
          <p className="text-muted-foreground leading-relaxed">{p.description}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {p.origin && <div className="glass rounded-xl p-3"><div className="text-muted-foreground">Origin</div><div className="text-gold mt-1">{p.origin}</div></div>}
            {p.weight_grams && <div className="glass rounded-xl p-3"><div className="text-muted-foreground">Weight</div><div className="text-gold mt-1">{p.weight_grams}g</div></div>}
            <div className="glass rounded-xl p-3 flex items-center gap-2"><Package className="h-4 w-4 text-gold" /><span>{p.stock > 0 ? `${p.stock} in stock` : "Sold out"}</span></div>
            <div className="glass rounded-xl p-3 flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /><span>Express delivery</span></div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center rounded-full glass border border-border/60">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2">−</button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 py-2">+</button>
            </div>
            <button
              disabled={p.stock === 0}
              onClick={() => { add({ id: p.id }, qty); toast.success("Added to cart"); }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
            <button className="rounded-full glass border border-border/60 p-3 hover:text-gold"><Heart className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {coupons && coupons.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl">Available Discounts</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c: any) => (
              <button
                key={c.id}
                onClick={() => { navigator.clipboard.writeText(c.code); toast.success(`Copied ${c.code}`); }}
                className="glass rounded-2xl p-4 text-left border border-dashed border-gold/40 hover:border-gold hover:shadow-gold transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Use code</span>
                  <Copy className="h-3 w-3 text-muted-foreground group-hover:text-gold" />
                </div>
                <div className="font-display text-xl text-gradient-gold">{c.code}</div>
                <div className="text-sm text-gold mt-1">
                  {c.type === "percent" ? `${Number(c.value)}% off` : `${bdt(Number(c.value))} off`}
                </div>
                {Number(c.min_subtotal) > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">Min order {bdt(Number(c.min_subtotal))}</div>
                )}
                {c.expires_at && (
                  <div className="text-xs text-muted-foreground mt-1">Expires {new Date(c.expires_at).toLocaleDateString()}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-20">
        <h2 className="font-display text-3xl mb-6">You may also love</h2>
        <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
          {related?.filter(r => r.id !== p.id).slice(0, 4).map(r => <ProductCard key={r.id} p={r} />)}
        </div>
      </div>

      <ProductReviews productId={p.id} />
    </section>
  );
}
