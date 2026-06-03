import { useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star, ShieldCheck } from "lucide-react";
import { ProductImage } from "@/components/shop/ProductImage";
import { bdt } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export function ProductCard({ p }: { p: Product }) {
  const navigate = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(p.id);
  const img = p.images?.[0];
  const discount =
    p.compare_at_price && p.compare_at_price > p.price
      ? Math.round((1 - p.price / p.compare_at_price) * 100)
      : 0;

  const openProduct = () => {
    navigate({ to: "/products/$slug", params: { slug: p.slug } });
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`View ${p.name}`}
      onClick={openProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct();
        }
      }}
      className="card-3d group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-gold/10 bg-card/70 backdrop-blur-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[1/1.08] overflow-hidden bg-cocoa">
        <ProductImage
          src={img}
          alt={p.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
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
          <span className="absolute top-3 right-3 rounded-full bg-destructive/80 px-2.5 py-1 text-[10px] text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="relative z-10 flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 text-gold">
            <Star className="h-3 w-3 fill-current" />
            <span>{p.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({p.review_count})</span>
          </div>
          <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex">
            <ShieldCheck className="h-3 w-3 text-gold" /> Halal
          </span>
        </div>
        <h3 className="font-display text-base leading-tight sm:text-lg">{p.name}</h3>
        {p.name_bn && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.name_bn}</p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-3">
          <span className="font-semibold text-gold">{bdt(Number(p.price))}</span>
          {p.compare_at_price && p.compare_at_price > p.price && (
            <span className="text-xs text-muted-foreground line-through">
              {bdt(Number(p.compare_at_price))}
            </span>
          )}
        </div>
        <div
          onKeyDown={(e) => e.stopPropagation()}
          className="relative z-20 mt-3 flex gap-2 md:opacity-0 md:translate-y-2 md:transition-all md:duration-300 md:group-hover:opacity-100 md:group-hover:translate-y-0"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (p.stock === 0) return;
              add({ id: p.id });
              toast.success("Added to cart");
            }}
            disabled={p.stock === 0}
            className="flex-1 rounded-full bg-gradient-gold py-2.5 text-xs font-semibold text-primary-foreground shadow-gold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Add
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(p.id);
              toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
            }}
            className={`rounded-full glass border border-border/60 p-2.5 transition ${wished ? "text-gold" : "hover:text-gold"}`}
            aria-label="Wishlist"
          >
            <Heart className={`h-3.5 w-3.5 ${wished ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
