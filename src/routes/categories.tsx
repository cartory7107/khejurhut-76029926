import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/products";

export const Route = createFileRoute("/categories")({ component: Cats });

function Cats() {
  const { data } = useQuery({ queryKey: ["cats-page"], queryFn: fetchCategories });
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl mb-2">Categories</h1>
      <p className="text-muted-foreground mb-8">Browse our luxury collections</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data?.map(c => (
          <Link key={c.id} to="/products" search={{ cat: c.slug }}
            className="card-3d group relative overflow-hidden rounded-2xl glass aspect-[4/5] flex items-end p-6 border border-border/60">
            <img src={c.image_url || "/images/products/medjool.jpg"} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
            <div className="relative z-10">
              <h3 className="font-display text-2xl text-gradient-gold">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{c.description || "Explore →"}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
