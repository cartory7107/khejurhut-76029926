import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  ShoppingBag,
  Heart,
  ArrowLeft,
  Package,
  Truck,
  Ticket,
  Copy,
  Share2,
  Zap,
  ShieldCheck,
  RotateCcw,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { fetchProductBySlug, fetchProducts } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { pushRecent } from "@/hooks/use-recent";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductImage } from "@/components/shop/ProductImage";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import { ProductReviews } from "@/components/shop/ProductReviews";

export const Route = createFileRoute("/products/$slug")({ component: PDP });

function PDP() {
  const { slug } = Route.useParams();
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });
  const { data: related } = useQuery({
    queryKey: ["related"],
    queryFn: () => fetchProducts({ featured: true }),
  });
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
  const { has, toggle } = useWishlist();
  const nav = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (p) pushRecent(p.id);
  }, [p]);
  useEffect(() => setActiveImage(0), [slug]);

  const ratingBuckets = useMemo(() => {
    const rating = p?.rating ?? 5;

    return [5, 4, 3, 2, 1].map((score) => ({
      score,
      percent: Math.max(10, score === 5 ? Math.round(rating * 18) : 8),
    }));
  }, [p?.rating]);

  if (isLoading)
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-3xl bg-cocoa animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
            <div className="h-12 w-3/4 rounded-xl bg-muted animate-pulse" />
            <div className="h-6 w-1/2 rounded-full bg-muted animate-pulse" />
            <div className="h-32 w-full rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </section>
    );
  if (!p)
    return (
      <div className="mx-auto max-w-7xl p-12">
        Not found.{" "}
        <Link to="/products" className="text-gold">
          Back
        </Link>
      </div>
    );

  const images = p.images?.length ? p.images : [DEFAULT_PRODUCT_IMAGE];
  const wished = has(p.id);
  const shortDescription =
    p.description ||
    "Premium organic dates selected for freshness, natural sweetness and elegant gifting.";

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share)
        await (navigator as any).share({ title: p.name, text: `${p.name} — Khejur Hat`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };
  const buyNow = async () => {
    if (p.stock === 0) return;
    await add({ id: p.id }, qty);
    nav({ to: "/checkout" });
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.14_75/.16),transparent_65%)]" />
      <Link
        to="/products"
        className="mb-5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3 w-3" /> Back to shop
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[2rem] border border-gold/15 bg-gradient-surface glow-amber">
            <ProductImage
              src={images[activeImage]}
              alt={p.name}
              className="w-full aspect-square object-cover hero-crack"
            />
            <div className="absolute left-4 top-4 rounded-full glass px-3 py-1 text-xs text-gold">
              Organic harvest
            </div>
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {images.slice(0, 5).map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={`overflow-hidden rounded-2xl border ${activeImage === index ? "border-gold shadow-gold" : "border-border/60"}`}
                >
                  <ProductImage
                    src={image}
                    alt={`${p.name} ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-gold">
              <Star className="h-4 w-4 fill-current" /> {p.rating.toFixed(1)} ({p.review_count}{" "}
              reviews)
            </span>
            <span className="rounded-full glass px-3 py-1 text-xs text-muted-foreground">
              {p.stock > 0 ? "In stock" : "Sold out"}
            </span>
          </div>
          <div>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              {p.name}
            </h1>
            {p.name_bn && <p className="mt-1 font-arabic text-xl text-gold/80">{p.name_bn}</p>}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gradient-gold">{bdt(p.price)}</span>
            {p.compare_at_price && (
              <span className="text-muted-foreground line-through">{bdt(p.compare_at_price)}</span>
            )}
          </div>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">{shortDescription}</p>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            {[
              { icon: Leaf, label: p.origin || "Saudi sourced", title: "Origin" },
              {
                icon: Package,
                label: p.weight_grams ? `${p.weight_grams}g` : "Premium pack",
                title: "Weight",
              },
              { icon: Truck, label: "24-72h delivery", title: "Shipping" },
              { icon: RotateCcw, label: "Freshness return", title: "Returns" },
            ].map(({ icon: Icon, title, label }) => (
              <div key={title} className="glass rounded-2xl p-3">
                <Icon className="mb-2 h-4 w-4 text-gold" />
                <div className="text-muted-foreground">{title}</div>
                <div className="mt-1 text-gold">{label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-gold/15 bg-card/65 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Quantity</span>
              <span className="text-xs text-muted-foreground">
                Secure checkout · Pay After Delivery
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center justify-between rounded-full glass border border-border/60 sm:w-32">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3">
                  −
                </button>
                <span className="text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))}
                  className="px-4 py-3"
                >
                  +
                </button>
              </div>
              <button
                disabled={p.stock === 0}
                onClick={() => {
                  add({ id: p.id }, qty);
                  toast.success("Added to cart");
                }}
                className="flex-1 rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50"
              >
                <ShoppingBag className="mr-2 inline h-4 w-4" /> Add to Cart
              </button>
              <button
                disabled={p.stock === 0}
                onClick={buyNow}
                className="flex-1 rounded-full glass border border-gold/50 py-3 text-sm font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                <Zap className="mr-2 inline h-4 w-4" /> Buy Now
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  toggle(p.id);
                  toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
                }}
                className={`flex-1 rounded-full glass border border-border/60 py-2.5 text-sm ${wished ? "text-gold" : ""}`}
              >
                <Heart className={`mr-2 inline h-4 w-4 ${wished ? "fill-current" : ""}`} /> Wishlist
              </button>
              <button
                onClick={share}
                className="flex-1 rounded-full glass border border-border/60 py-2.5 text-sm hover:text-gold"
              >
                <Share2 className="mr-2 inline h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="glass rounded-[2rem] p-5 sm:p-7">
          <h2 className="font-display text-3xl">Details, shipping & returns</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                t: "Premium quality",
                d: "Hand-sorted, halal and packed for freshness.",
                i: ShieldCheck,
              },
              {
                t: "Fast delivery",
                d: "Free delivery over ৳2000 with careful handling.",
                i: Truck,
              },
              {
                t: "Freshness promise",
                d: "Return support for damaged or mismatched items.",
                i: RotateCcw,
              },
            ].map(({ t, d, i: Icon }) => (
              <div key={t} className="rounded-2xl bg-background/35 p-4">
                <Icon className="mb-3 h-5 w-5 text-gold" />
                <h3 className="font-medium">{t}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="glass rounded-[2rem] p-5">
          <h2 className="font-display text-2xl">Review summary</h2>
          <div className="my-4 flex items-end gap-2">
            <span className="text-5xl font-display text-gradient-gold">{p.rating.toFixed(1)}</span>
            <span className="pb-2 text-sm text-muted-foreground">out of 5</span>
          </div>
          {ratingBuckets.map(({ score, percent }) => (
            <div key={score} className="mb-2 flex items-center gap-2 text-xs">
              <span className="w-8">{score}★</span>
              <div className="h-2 flex-1 rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-gold"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
            </div>
          ))}
        </aside>
      </div>

      {coupons && coupons.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl">Available Discounts</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c: any) => (
              <button
                key={c.id}
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  toast.success(`Copied ${c.code}`);
                }}
                className="glass rounded-2xl p-4 text-left border border-dashed border-gold/40 hover:border-gold hover:shadow-gold transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Use code
                  </span>
                  <Copy className="h-3 w-3 text-muted-foreground group-hover:text-gold" />
                </div>
                <div className="font-display text-xl text-gradient-gold">{c.code}</div>
                <div className="text-sm text-gold mt-1">
                  {c.type === "percent" ? `${Number(c.value)}% off` : `${bdt(Number(c.value))} off`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <ProductReviews productId={p.id} />
      <div className="mt-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl">You may also love</h2>
          <Link to="/products" className="inline-flex items-center text-sm text-gold">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {related
            ?.filter((r) => r.id !== p.id)
            .slice(0, 4)
            .map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
        </div>
      </div>
    </section>
  );
}
