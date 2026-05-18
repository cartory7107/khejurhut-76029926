import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { bdt } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({ component: Orders });

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
            <span className="rounded-full bg-gradient-gold px-3 py-1 text-xs text-primary-foreground">{o.status}</span>
          </div>
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
