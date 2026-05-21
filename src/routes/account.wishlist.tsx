import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/account/wishlist")({ component: Wishlist });

function Wishlist() {
  const { ids } = useWishlist();
  const idArr = [...ids];
  const { data } = useQuery({
    queryKey: ["wishlist-products", idArr.join(",")],
    enabled: idArr.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").in("id", idArr);
      return ((data || []) as any[]).map((d) => ({
        ...d, images: (d.images as string[]) || [],
        price: Number(d.price),
        compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null,
        rating: Number(d.rating),
      })) as Product[];
    },
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">My Wishlist</h1>
      {idArr.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center space-y-3">
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Link to="/products" className="inline-block rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-primary-foreground shadow-gold">Browse dates</Link>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3">
          {(data || []).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
