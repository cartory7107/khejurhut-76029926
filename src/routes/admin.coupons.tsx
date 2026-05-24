import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: AdminCoupons });

function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "", type: "percent" as "percent" | "fixed", value: 10, min_subtotal: 0, expires_at: "",
  });

  const { data } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data || [],
  });

  const create = async () => {
    if (!form.code.trim()) return toast.error("Code required");
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_subtotal: Number(form.min_subtotal),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const { error } = await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Coupon created");
    setForm({ code: "", type: "percent", value: 10, min_subtotal: 0, expires_at: "" });
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const remove = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    toast.success("Removed");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Coupons</h1>

      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-sm text-muted-foreground">Create a new coupon</h2>
        <div className="grid gap-2 sm:grid-cols-5">
          <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
            placeholder="CODE" className="rounded-lg bg-input border border-border px-3 py-2 text-sm uppercase" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
            className="rounded-lg bg-input border border-border px-3 py-2 text-sm">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed (BDT)</option>
          </select>
          <input type="number" min={1} value={form.value} onChange={e => setForm({ ...form, value: +e.target.value })}
            placeholder="Value" className="rounded-lg bg-input border border-border px-3 py-2 text-sm" />
          <input type="number" min={0} value={form.min_subtotal} onChange={e => setForm({ ...form, min_subtotal: +e.target.value })}
            placeholder="Min subtotal" className="rounded-lg bg-input border border-border px-3 py-2 text-sm" />
          <input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
            className="rounded-lg bg-input border border-border px-3 py-2 text-sm" />
        </div>
        <button onClick={create} className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-primary-foreground shadow-gold">
          <Plus className="h-3.5 w-3.5" /> Add coupon
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min</th><th className="p-3">Expires</th><th className="p-3">Active</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data?.map((c: any) => (
              <tr key={c.id} className="border-b border-border/30">
                <td className="p-3 font-mono text-gold">{c.code}</td>
                <td className="p-3">{c.type === "percent" ? `${c.value}%` : `৳${c.value}`}</td>
                <td className="p-3 text-muted-foreground">৳{c.min_subtotal}</td>
                <td className="p-3 text-xs text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-3">
                  <button onClick={() => toggle(c.id, c.is_active)}
                    className={`text-xs rounded-full px-3 py-1 ${c.is_active ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => remove(c.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
            {(data || []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No coupons yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}