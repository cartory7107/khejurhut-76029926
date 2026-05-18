import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { bdt } from "@/lib/format";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, subtotal, update, remove } = useCart();
  const shipping = subtotal > 2000 || subtotal === 0 ? 0 : 100;
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl mb-6">Your Cart</h1>
      {items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <ShoppingBag className="h-10 w-10 mx-auto text-gold" />
          <p className="text-muted-foreground">Your cart is empty</p>
          <Link to="/products" className="inline-block rounded-full bg-gradient-gold px-6 py-2 text-sm font-semibold text-primary-foreground">Browse products</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.id} className="glass rounded-2xl p-4 flex gap-4">
                <img src={i.product.images?.[0]} alt={i.product.name} className="h-24 w-24 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to="/products/$slug" params={{ slug: i.product.slug }} className="font-display text-lg hover:text-gold">{i.product.name}</Link>
                  <div className="text-gold mt-1">{bdt(i.product.price)}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center rounded-full border border-border/60">
                      <button onClick={() => update(i.id, i.quantity - 1)} className="px-3 py-1">−</button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <button onClick={() => update(i.id, i.quantity + 1)} className="px-3 py-1">+</button>
                    </div>
                    <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="text-right text-gold font-semibold">{bdt(i.product.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="glass rounded-2xl p-6 h-fit space-y-3 sticky top-24">
            <h3 className="font-display text-xl">Order Summary</h3>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{bdt(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : bdt(shipping)}</span></div>
            <div className="border-t border-border/60 pt-3 flex justify-between font-display text-lg"><span>Total</span><span className="text-gradient-gold">{bdt(subtotal + shipping)}</span></div>
            <Link to="/checkout" className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold">
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
