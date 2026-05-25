import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { fetchProducts, fetchCategories } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <div className="aspect-square animate-pulse bg-cocoa" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/products")({
  validateSearch: z.object({ q: z.string().optional(), cat: z.string().optional() }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, cat } = Route.useSearch();
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", q, cat],
    queryFn: () => fetchProducts({ search: q, categorySlug: cat }),
  });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: fetchCategories });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl mb-2">All Products</h1>
      <p className="text-muted-foreground mb-6">{q ? `Results for "${q}"` : "Curated premium dates"}</p>
      <div className="flex flex-wrap gap-2 mb-8">
        <Link to="/products" className={`rounded-full px-4 py-1.5 text-xs border ${!cat ? "bg-gradient-gold text-primary-foreground border-transparent" : "border-border/60 text-muted-foreground hover:text-gold"}`}>All</Link>
        {cats?.map(c => (
          <Link key={c.id} to="/products" search={{ cat: c.slug }} className={`rounded-full px-4 py-1.5 text-xs border ${cat === c.slug ? "bg-gradient-gold text-primary-foreground border-transparent" : "border-border/60 text-muted-foreground hover:text-gold"}`}>
            {c.name}
          </Link>
        ))}
      </div>
      {isLoading ? <ProductGridSkeleton /> : (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products?.map(p => <ProductCard key={p.id} p={p} />)}
          {products?.length === 0 && <p className="text-muted-foreground col-span-full">No products found.</p>}
        </div>
      )}
    </section>
  );
}
