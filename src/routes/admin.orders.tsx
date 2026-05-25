import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data || [],
  });
  const setStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Orders</h1>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {data?.map((o: any) => (
              <tr key={o.id} className="border-b border-border/30">
                <td className="p-3 text-xs">
                  <div className="text-gold font-semibold">{o.order_number || `#${o.id.slice(0, 8)}`}</div>
                  <div className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                </td>
                <td className="p-3">{o.full_name}<div className="text-xs text-muted-foreground">{o.phone}</div></td>
                <td className="p-3 text-gold">{bdt(Number(o.total))}</td>
                <td className="p-3">
                  <select value={o.status} onChange={e => setStatus(o.id, e.target.value)} className="rounded-lg bg-input border border-border px-2 py-1 text-xs">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {(data || []).length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}>No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
