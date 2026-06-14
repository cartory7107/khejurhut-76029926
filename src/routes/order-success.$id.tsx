import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { GoldParticles } from "@/components/site/GoldParticles";
import { Check, Package, Phone, MapPin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/order-success/$id")({ component: OrderSuccess });

function OrderSuccess() {
  const { id } = Route.useParams();
  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await supabase.from("orders").select("*").eq("id", id).maybeSingle()).data,
  });

  return (
    <section className="relative min-h-[80vh] overflow-hidden">
      <GoldParticles density={60} />
      <div className="relative mx-auto max-w-2xl px-6 py-16 text-center">
        {/* Glowing check */}
        <div className="relative mx-auto mb-8 grid place-items-center">
          <div className="absolute h-40 w-40 rounded-full bg-gold/20 blur-3xl animate-pulse" />
          <div className="absolute h-28 w-28 rounded-full bg-gradient-gold opacity-30 blur-2xl animate-ping" />
          <div className="relative grid place-items-center h-24 w-24 rounded-full bg-gradient-gold shadow-gold animate-scale-in">
            <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>

        <p className="font-arabic text-2xl text-gold mb-2 animate-fade-in">আপনাকে ধন্যবাদ</p>
        <h1 className="font-display text-4xl md:text-5xl text-gradient-gold mb-3 animate-fade-in">
          Your premium order is being prepared
        </h1>
        <p className="text-muted-foreground mb-8 animate-fade-in">
          Thank you — your order has been received and our team is preparing it with care.
        </p>

        {order && (
          <div className="glass rounded-3xl p-6 md:p-8 text-left space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Order</div>
                <div className="font-display text-2xl text-gradient-gold">
                  {order.order_number || `#${String(order.id).slice(0, 8)}`}
                </div>
              </div>
              <div className="rounded-full bg-gold/10 border border-gold/40 px-3 py-1 text-xs text-gold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> {order.status}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" /><div><div className="text-muted-foreground text-xs">Delivery to</div>{order.full_name}, {order.city}<div className="text-xs text-muted-foreground">{order.address}</div></div></div>
              <div className="flex gap-2"><Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" /><div><div className="text-muted-foreground text-xs">Contact</div>{order.phone}</div></div>
            </div>
            <div className="border-t border-border/60 pt-3 flex justify-between font-display text-xl">
              <span>Total</span><span className="text-gradient-gold">{bdt(Number(order.total))}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-3 w-3 text-gold" />
              You'll pay on delivery — receive first, pay later.
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center mt-8 animate-fade-in">
          <Link to="/account/orders" className="rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold">
            Track my order
          </Link>
          <Link to="/products" className="rounded-full glass border border-border px-6 py-3 text-sm">
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}