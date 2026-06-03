import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, SlidersHorizontal, ShieldCheck, Truck } from "lucide-react";
import { fetchProducts, fetchCategories } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";

function ProductGridSkeleton() { return <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-3xl border border-border/60 bg-card/60"><div className="aspect-square animate-pulse bg-cocoa" /><div className="space-y-3 p-4"><div className="h-3 w-20 animate-pulse rounded-full bg-muted" /><div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" /><div className="h-4 w-24 animate-pulse rounded-full bg-muted" /></div></div>)}</div>; }

export const Route = createFileRoute("/products/")({ validateSearch: z.object({ q: z.string().optional(), cat: z.string().optional() }), component: ProductsPage });

function ProductsPage() {
  const { q, cat } = Route.useSearch();
  const { data: products, isLoading } = useQuery({ queryKey: ["products", q, cat], queryFn: () => fetchProducts({ search: q, categorySlug: cat }) });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: fetchCategories });
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.14_75/.16),transparent_65%)]" />
      <div className="mb-6 rounded-[2rem] border border-gold/15 bg-gradient-surface p-5 hero-particles sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-gold">Premium organic shop</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><h1 className="font-display text-4xl leading-tight sm:text-6xl">Dates, honey & curated gifts</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{q ? `Results for “${q}”` : "Hand-selected halal dates and natural pantry luxuries for family tables and premium gifting."}</p></div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:min-w-80"><div className="glass rounded-2xl p-3"><ShieldCheck className="mb-1 h-4 w-4 text-gold" /> Lab-tested quality</div><div className="glass rounded-2xl p-3"><Truck className="mb-1 h-4 w-4 text-gold" /> Fast BD delivery</div></div>
        </div>
      </div>
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:inline-flex"><SlidersHorizontal className="h-4 w-4" /> Filters</span>
        <Link to="/products" className={`shrink-0 rounded-full px-4 py-2 text-xs border ${!cat ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold" : "border-border/60 text-muted-foreground hover:text-gold"}`}>All</Link>
        {cats?.map(c => <Link key={c.id} to="/products" search={{ cat: c.slug }} className={`shrink-0 rounded-full px-4 py-2 text-xs border ${cat === c.slug ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold" : "border-border/60 text-muted-foreground hover:text-gold"}`}>{c.name}</Link>)}
      </div>
      {isLoading ? <ProductGridSkeleton /> : <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{products?.map(p => <ProductCard key={p.id} p={p} />)}{products?.length === 0 && <div className="glass col-span-full rounded-3xl p-10 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-gold" /><p className="text-muted-foreground">No products found. Try another search or category.</p></div>}</div>}
    </section>
  );
}
