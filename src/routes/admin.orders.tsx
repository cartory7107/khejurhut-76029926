import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { Check, X, Phone, Printer, TrendingUp, Package, Clock } from "lucide-react";

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

  const orders = data || [];
  const revenue = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);
  const pending = orders.filter((o: any) => o.status === "pending").length;
  const delivered = orders.filter((o: any) => o.status === "delivered").length;

  const printInvoice = async (id: string) => {
    const o = orders.find((x: any) => x.id === id);
    if (!o) return;
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;
    const rows = (items || []).map((it: any) =>
      `<tr><td>${it.product_name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">৳${it.price}</td><td style="text-align:right">৳${(it.price * it.quantity).toFixed(0)}</td></tr>`
    ).join("");
    win.document.write(`<!doctype html><html><head><title>Invoice ${o.order_number || o.id}</title>
      <style>body{font-family:Georgia,serif;color:#1a1a1a;padding:32px;max-width:680px;margin:auto}
      h1{color:#a47429;margin:0 0 4px}.muted{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:18px}
      th,td{padding:8px;border-bottom:1px solid #ddd;font-size:13px}
      th{background:#faf3e3;text-align:left;color:#7a5418}
      .total{font-size:18px;color:#a47429;font-weight:bold}
      .box{border:1px solid #eee;padding:14px;border-radius:8px;margin-top:12px}</style></head><body>
      <h1>Khejur Hat</h1><div class="muted">Premium dates · Invoice</div>
      <div class="box"><div><b>Order:</b> ${o.order_number || o.id}</div>
      <div><b>Date:</b> ${new Date(o.created_at).toLocaleString()}</div>
      <div><b>Customer:</b> ${o.full_name} · ${o.phone}</div>
      <div><b>Address:</b> ${o.address}, ${o.city}</div></div>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:14px;text-align:right">
        <div>Subtotal: ৳${o.subtotal}</div>
        <div>Shipping: ৳${o.shipping}</div>
        ${Number(o.discount) > 0 ? `<div>Discount: −৳${o.discount}</div>` : ""}
        <div class="total">Total: ৳${o.total}</div>
      </div>
      <p class="muted" style="margin-top:24px;text-align:center">Payment: Pay After Delivery · Thank you for shopping with Khejur Hat</p>
      <script>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-arabic text-gold text-sm">إدارة الطلبات</p>
          <h1 className="font-display text-3xl text-gradient-gold">Orders</h1>
        </div>
      </div>

      {/* 3D luxury stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Revenue", value: bdt(revenue), icon: TrendingUp },
          { label: "Pending", value: pending, icon: Clock },
          { label: "Delivered", value: delivered, icon: Package },
        ].map((s) => (
          <div key={s.label} className="relative glass rounded-2xl p-5 overflow-hidden group hover:-translate-y-0.5 transition-transform shadow-gold/30">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-gold opacity-10 blur-2xl group-hover:opacity-20 transition" />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <s.icon className="h-4 w-4 text-gold" />
            </div>
            <div className="text-3xl font-display text-gradient-gold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
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
                <td className="p-3">
                  <div className="flex items-center gap-1 justify-end">
                    {o.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(o.id, "confirmed")} title="Accept"
                          className="grid place-items-center h-8 w-8 rounded-full bg-gold/10 border border-gold/40 text-gold hover:bg-gold/20">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setStatus(o.id, "cancelled")} title="Reject"
                          className="grid place-items-center h-8 w-8 rounded-full bg-destructive/10 border border-destructive/40 text-destructive hover:bg-destructive/20">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <a href={`tel:${o.phone}`} title="Call customer"
                      className="grid place-items-center h-8 w-8 rounded-full glass border border-border hover:border-gold/60">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => printInvoice(o.id)} title="Print invoice"
                      className="grid place-items-center h-8 w-8 rounded-full glass border border-border hover:border-gold/60">
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}>No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
