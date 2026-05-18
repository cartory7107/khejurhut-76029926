import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { bdt } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "Dhaka", notes: "" });
  const [busy, setBusy] = useState(false);
  const shipping = subtotal > 2000 || subtotal === 0 ? 0 : 100;
  const total = subtotal + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to place an order"); nav({ to: "/auth", search: { redirect: "/checkout" } }); return; }
    if (items.length === 0) return;
    setBusy(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id, ...form, subtotal, shipping, total,
    }).select().single();
    if (error || !order) { toast.error(error?.message || "Failed"); setBusy(false); return; }
    const lines = items.map(i => ({ order_id: order.id, product_id: i.product_id, product_name: i.product.name, price: i.product.price, quantity: i.quantity }));
    await supabase.from("order_items").insert(lines);
    await clear();
    toast.success("Order placed!");
    nav({ to: "/account/orders" });
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-4xl mb-6">Checkout</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {(["full_name", "phone", "address", "city"] as const).map(k => (
            <input key={k} required placeholder={k.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
              value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
              className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold" />
          ))}
          <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold" rows={3} />
        </div>
        <div className="glass rounded-2xl p-6 space-y-3 h-fit">
          <h3 className="font-display text-xl">Summary</h3>
          {items.map(i => (
            <div key={i.id} className="flex justify-between text-sm"><span className="text-muted-foreground truncate mr-2">{i.product.name} × {i.quantity}</span><span>{bdt(i.product.price * i.quantity)}</span></div>
          ))}
          <div className="border-t border-border/60 pt-3 flex justify-between font-display text-lg"><span>Total</span><span className="text-gradient-gold">{bdt(total)}</span></div>
          <p className="text-xs text-muted-foreground">Cash on delivery available. Payment integration coming soon.</p>
          <button disabled={busy || items.length === 0} className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
            {busy ? "Placing..." : "Place Order"}
          </button>
        </div>
      </form>
    </section>
  );
}
