import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { bdt } from "@/lib/format";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, subtotal, update, remove } = useCart();
  const shipping = subtotal > 2000 || subtotal === 0 ? 0 : 100;
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.14_75/.16),transparent_65%)]" />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs uppercase tracking-[0.3em] text-gold">Full-page cart</p><h1 className="font-display text-4xl sm:text-5xl">Your Cart</h1></div>
        <Link to="/products" className="text-sm text-gold hover:underline">Continue shopping</Link>
      </div>
      {items.length === 0 ? (
        <div className="glass rounded-[2rem] p-10 text-center space-y-4 sm:p-12"><ShoppingBag className="h-10 w-10 mx-auto text-gold" /><p className="text-muted-foreground">Your cart is empty</p><Link to="/products" className="inline-block rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold">Browse products</Link></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.id} className="glass rounded-3xl p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <img src={i.product.images?.[0] || "/images/products/medjool.jpg"} alt={i.product.name} className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28" />
                  <div className="min-w-0 flex-1">
                    <Link to="/products/$slug" params={{ slug: i.product.slug }} className="font-display text-lg leading-tight hover:text-gold sm:text-xl">{i.product.name}</Link>
                    <div className="mt-1 text-sm text-gold">{bdt(i.product.price)}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex items-center rounded-full border border-border/60 bg-background/30"><button onClick={() => update(i.id, i.quantity - 1)} className="min-h-10 px-4">−</button><span className="w-8 text-center text-sm">{i.quantity}</span><button onClick={() => update(i.id, i.quantity + 1)} className="min-h-10 px-4">+</button></div>
                      <button onClick={() => remove(i.id)} className="grid h-10 w-10 place-items-center rounded-full glass text-muted-foreground hover:text-destructive" aria-label="Remove item"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="hidden text-right font-semibold text-gold sm:block">{bdt(i.product.price * i.quantity)}</div>
                </div>
                <div className="mt-3 flex justify-between border-t border-border/50 pt-3 text-sm sm:hidden"><span className="text-muted-foreground">Line total</span><span className="text-gold">{bdt(i.product.price * i.quantity)}</span></div>
              </div>
            ))}
          </div>
          <aside className="glass rounded-[2rem] p-5 h-fit space-y-4 lg:sticky lg:top-24">
            <h3 className="font-display text-2xl">Order Summary</h3>
            <div className="space-y-2 rounded-2xl bg-background/30 p-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{bdt(subtotal)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : bdt(shipping)}</span></div><div className="border-t border-border/60 pt-3 flex justify-between font-display text-xl"><span>Total</span><span className="text-gradient-gold">{bdt(subtotal + shipping)}</span></div></div>
            <Link to="/checkout" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-3.5 text-sm font-semibold text-primary-foreground shadow-gold">Secure checkout <ArrowRight className="h-4 w-4" /></Link>
            <div className="grid gap-2 text-xs text-muted-foreground">{[{i:ShieldCheck,t:"SSL-secured checkout"},{i:Truck,t:"Free delivery over ৳2000"},{i:RotateCcw,t:"Freshness-backed returns"}].map(({i:Icon,t}) => <div key={t} className="flex items-center gap-2"><Icon className="h-4 w-4 text-gold" /> {t}</div>)}</div>
          </aside>
        </div>
      )}
    </section>
  );
}
