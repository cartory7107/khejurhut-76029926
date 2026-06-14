import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { bdt } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, MapPin, CreditCard, ClipboardList, Tag, X, ShieldCheck, Truck } from "lucide-react";
import { GoldParticles } from "@/components/site/GoldParticles";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "Dhaka", notes: "" });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<"pad" | "bkash" | "card">("pad");
  const [busy, setBusy] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const shipping = subtotal > 2000 || subtotal === 0 ? 0 : 100;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    setApplying(false);
    if (error || !data) return toast.error("Invalid coupon");
    if (data.expires_at && new Date(data.expires_at) < new Date()) return toast.error("Coupon expired");
    if (subtotal < Number(data.min_subtotal)) return toast.error(`Minimum order ${data.min_subtotal} required`);
    const d = data.type === "percent"
      ? Math.round((subtotal * Number(data.value)) / 100)
      : Number(data.value);
    setCoupon({ code: data.code, discount: Math.min(d, subtotal) });
    toast.success(`Coupon ${data.code} applied`);
  };

  const placeOrder = async () => {
    if (!user) { toast.error("Please sign in to place an order"); nav({ to: "/auth", search: { redirect: "/checkout" } }); return; }
    if (items.length === 0) return;
    setBusy(true);
    const methodLabel = method === "pad" ? "Pay After Delivery" : method === "bkash" ? "bKash" : "Card / SSLCommerz";
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id, ...form,
      notes: `${form.notes}${form.notes ? " | " : ""}Payment: ${methodLabel}`,
      subtotal, shipping, total,
      coupon_code: coupon?.code || null,
      discount,
    }).select().single();
    if (error || !order) { toast.error(error?.message || "Failed"); setBusy(false); return; }
    const lines = items.map(i => ({ order_id: order.id, product_id: i.product_id, product_name: i.product.name, price: i.product.price, quantity: i.quantity }));
    await supabase.from("order_items").insert(lines);
    await clear();
    toast.success("Order placed!");
    nav({ to: "/order-success/$id", params: { id: order.id } });
  };

  const canNext1 = form.full_name && form.phone && form.address && form.city;
  const steps = [
    { n: 1, label: "Shipping", icon: MapPin },
    { n: 2, label: "Payment", icon: CreditCard },
    { n: 3, label: "Review", icon: ClipboardList },
  ] as const;

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <GoldParticles density={30} />
      </div>
      <div className="mb-6">
        <p className="font-arabic text-gold text-lg">বিলাসবহুল চেকআউট</p>
        <h1 className="font-display text-4xl text-gradient-gold">Premium Checkout</h1>
      </div>

      {/* Stepper */}
      <ol className="mb-8 grid grid-cols-3 gap-2 text-xs sm:flex sm:items-center sm:gap-3 sm:text-sm">
        {steps.map((s, i) => {
          const done = step > s.n;
          const active = step === s.n;
          const Icon = s.icon;
          return (
            <li key={s.n} className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
              <div className={`grid place-items-center h-9 w-9 rounded-full border transition ${done ? "bg-gradient-gold text-primary-foreground border-transparent" : active ? "border-gold text-gold shadow-gold" : "border-border text-muted-foreground"}`}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`truncate ${active ? "text-gold" : done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`hidden sm:block flex-1 h-px ${done ? "bg-gold/60" : "bg-border"}`} />}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {step === 1 && (
            <div className="glass rounded-[1.75rem] p-5 space-y-3 sm:p-6">
              <h2 className="font-display text-xl mb-2">Shipping address</h2>
              {(["full_name", "phone", "address", "city"] as const).map(k => (
                <input key={k} required placeholder={k.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                  className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold transition" />
              ))}
              <textarea placeholder="Delivery notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold transition" rows={3} />
              <button disabled={!canNext1} onClick={() => setStep(2)}
                className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
                Continue to payment
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="glass rounded-[1.75rem] p-5 space-y-3 sm:p-6">
              <h2 className="font-display text-xl mb-2">Payment method</h2>
              {([
                { id: "pad", label: "Pay After Delivery", desc: "Receive first, pay at your doorstep — hand to hand" },
                { id: "bkash", label: "bKash", desc: "Mobile financial service (integration coming)" },
                { id: "card", label: "Card / SSLCommerz", desc: "Visa, Mastercard, Amex (integration coming)" },
              ] as const).map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${method === opt.id ? "border-gold bg-gold/5 shadow-gold" : "border-border hover:border-gold/40"}`}>
                  <input type="radio" name="pay" checked={method === opt.id} onChange={() => setMethod(opt.id)} className="mt-1 accent-[oklch(0.82_0.16_80)]" />
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </label>
              ))}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button onClick={() => setStep(1)} className="rounded-full glass border border-border px-5 py-3 text-sm">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold">Review order</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="glass rounded-[1.75rem] p-5 space-y-4 sm:p-6">
              <h2 className="font-display text-xl">Review & confirm</h2>
              <div className="text-sm space-y-1">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Ship to</div>
                <div>{form.full_name} · {form.phone}</div>
                <div className="text-muted-foreground">{form.address}, {form.city}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Payment</div>
                <div>{method === "pad" ? "Pay After Delivery (Doorstep)" : method === "bkash" ? "bKash" : "Card / SSLCommerz"}</div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={() => setStep(2)} className="rounded-full glass border border-border px-5 py-3 text-sm">Back</button>
                <button onClick={placeOrder} disabled={busy || items.length === 0}
                  className="flex-1 rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold pulse-glow disabled:opacity-50">
                  {busy ? "Placing..." : `Place order · ${bdt(total)}`}
                </button>
              </div>
              {!user && <p className="text-xs text-destructive">You will be asked to sign in to complete the order.</p>}
            </div>
          )}
        </div>
        <div className="glass rounded-[1.75rem] p-5 space-y-3 h-fit lg:sticky lg:top-24 sm:p-6">
          <h3 className="font-display text-xl">Order summary</h3><div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground"><span className="rounded-full bg-gold/10 px-3 py-1 text-gold"><ShieldCheck className="mr-1 inline h-3 w-3" /> Secure</span><span className="rounded-full bg-gold/10 px-3 py-1 text-gold"><Truck className="mr-1 inline h-3 w-3" /> Fast ship</span></div>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Your cart is empty. <Link to="/products" className="text-gold">Browse</Link></p>
          )}
          {items.map(i => (
            <div key={i.id} className="flex justify-between text-sm"><span className="text-muted-foreground truncate mr-2">{i.product.name} × {i.quantity}</span><span>{bdt(i.product.price * i.quantity)}</span></div>
          ))}
          {items.length > 0 && (
            <>
              <div className="border-t border-border/60 pt-2 text-sm flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{bdt(subtotal)}</span></div>
              <div className="text-sm flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "FREE" : bdt(shipping)}</span></div>
              {discount > 0 && (
                <div className="text-sm flex justify-between text-gold"><span>Discount ({coupon?.code})</span><span>−{bdt(discount)}</span></div>
              )}
              <div className="pt-2">
                {coupon ? (
                  <button onClick={() => { setCoupon(null); setCouponInput(""); }} className="w-full text-xs glass border border-border rounded-xl px-3 py-2 flex items-center justify-between hover:text-destructive">
                    <span className="flex items-center gap-1.5"><Tag className="h-3 w-3 text-gold" /> {coupon.code} applied</span>
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo code"
                      className="flex-1 rounded-xl bg-input border border-border px-3 py-2 text-xs outline-none focus:border-gold"
                    />
                    <button onClick={applyCoupon} disabled={applying || !couponInput}
                      className="rounded-xl bg-gold/10 border border-gold/40 px-3 text-xs text-gold disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="border-t border-border/60 pt-3 flex justify-between font-display text-lg"><span>Total</span><span className="text-gradient-gold">{bdt(total)}</span></div>
        </div>
      </div>
    </section>
  );
}
