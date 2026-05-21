import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { bdt } from "@/lib/format";
import { Check, Clock, Package, Truck, Home } from "lucide-react";

export const Route = createFileRoute("/account/orders")({ component: Orders });

const STAGES = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

function Timeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive my-3">Order cancelled</div>;
  }
  const idx = Math.max(0, STAGES.findIndex(s => s.key === status));
  return (
    <ol className="flex items-center gap-1 my-3">
      {STAGES.map((s, i) => {
        const done = i <= idx;
        const Icon = done ? Check : s.icon;
        return (
          <li key={s.key} className="flex-1 flex items-center gap-1">
            <div className={`grid place-items-center h-7 w-7 rounded-full transition ${done ? "bg-gradient-gold text-primary-foreground shadow-gold" : "bg-muted text-muted-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="text-[10px] hidden sm:block whitespace-nowrap text-muted-foreground">{s.label}</div>
            {i < STAGES.length - 1 && <div className={`flex-1 h-px ${i < idx ? "bg-gold/60" : "bg-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Orders() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      return data || [];
    },
  });
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl mb-4">My Orders</h1>
      {(data || []).length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No orders yet</div>}
      {data?.map((o: any) => (
        <div key={o.id} className="glass rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
            </div>
            <span className="rounded-full bg-gradient-gold px-3 py-1 text-xs text-primary-foreground capitalize">{o.status}</span>
          </div>
          <Timeline status={o.status} />
          <div className="space-y-1 text-sm">
            {o.order_items?.map((i: any) => (
              <div key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{bdt(Number(i.price) * i.quantity)}</span></div>
            ))}
          </div>
          <div className="border-t border-border/60 mt-3 pt-3 flex justify-between font-display"><span>Total</span><span className="text-gradient-gold">{bdt(Number(o.total))}</span></div>
        </div>
      ))}
    </div>
  );
}
