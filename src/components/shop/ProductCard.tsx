import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { bdt } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const img = p.images?.[0] || "/images/products/medjool.jpg";
  const discount = p.compare_at_price && p.compare_at_price > p.price
    ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;

  return (
    <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
      <Link to="/products/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-cocoa">
          <img src={img} alt={p.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          {discount > 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-gradient-gold px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-gold">
              -{discount}%
            </span>
          )}
          {p.stock <= 5 && p.stock > 0 && (
            <span className="absolute top-3 right-3 rounded-full glass px-2.5 py-1 text-[10px] text-gold">
              Only {p.stock} left
            </span>
          )}
          {p.stock === 0 && (
            <span className="absolute top-3 right-3 rounded-full bg-destructive/80 px-2.5 py-1 text-[10px] text-white">Sold out</span>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1 text-xs text-gold">
            <Star className="h-3 w-3 fill-current" />
            <span>{p.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({p.review_count})</span>
          </div>
          <h3 className="font-display text-lg leading-tight">{p.name}</h3>
          {p.name_bn && <p className="text-xs text-muted-foreground">{p.name_bn}</p>}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-gold font-semibold">{bdt(Number(p.price))}</span>
            {p.compare_at_price && p.compare_at_price > p.price && (
              <span className="text-xs text-muted-foreground line-through">{bdt(Number(p.compare_at_price))}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
        <button
          onClick={(e) => { e.preventDefault(); if (p.stock === 0) return; add({ id: p.id }); toast.success("Added to cart"); }}
          disabled={p.stock === 0}
          className="flex-1 rounded-full bg-gradient-gold py-2 text-xs font-semibold text-primary-foreground shadow-gold flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <ShoppingBag className="h-3.5 w-3.5" /> Add
        </button>
        <button className="rounded-full glass border border-border/60 p-2 hover:text-gold transition" aria-label="Wishlist">
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
