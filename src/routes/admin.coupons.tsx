import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: AdminCoupons });

const couponQueryKeys = [["admin-coupons"], ["active-coupons"], ["admin-stats"]];

function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "", type: "percent" as "percent" | "fixed", value: 10, min_subtotal: 0, expires_at: "",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidateCouponCaches = useCallback(() => {
    for (const queryKey of couponQueryKeys) {
      qc.invalidateQueries({ queryKey, refetchType: "all" });
    }
  }, [qc]);

  const { data, isFetching } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-coupons-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, invalidateCouponCaches)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateCouponCaches]);

  const create = async () => {
    if (creating) return;
    if (!form.code.trim()) return toast.error("Code required");
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_subtotal: Number(form.min_subtotal),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: true,
    };
    setCreating(true);
    try {
      const { data: created, error } = await supabase.from("coupons").insert(payload).select("*").single();
      if (error) throw error;
      qc.setQueryData<any[]>(["admin-coupons"], (current = []) => (created ? [created, ...current] : current));
      invalidateCouponCaches();
      toast.success("Coupon created and active instantly");
      setForm({ code: "", type: "percent", value: 10, min_subtotal: 0, expires_at: "" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    if (busyId) return;
    setBusyId(id);
    const previous = qc.getQueryData<any[]>(["admin-coupons"]);
    qc.setQueryData<any[]>(["admin-coupons"], (current = []) => current.map((coupon) => coupon.id === id ? { ...coupon, is_active: !active } : coupon));
    try {
      const { error } = await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
      if (error) throw error;
      invalidateCouponCaches();
      toast.success(!active ? "Coupon activated instantly" : "Coupon disabled instantly");
    } catch (e: any) {
      qc.setQueryData(["admin-coupons"], previous);
      toast.error(e?.message || "Failed to update coupon");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (busyId || !confirm("Delete coupon?")) return;
    setBusyId(id);
    const previous = qc.getQueryData<any[]>(["admin-coupons"]);
    qc.setQueryData<any[]>(["admin-coupons"], (current = []) => current.filter((coupon) => coupon.id !== id));
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      invalidateCouponCaches();
      toast.success("Removed instantly");
    } catch (e: any) {
      qc.setQueryData(["admin-coupons"], previous);
      toast.error(e?.message || "Failed to remove coupon");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Coupons</h1>
        <p className="text-xs text-muted-foreground">Coupon changes are pushed live, so checkout can use them immediately.</p>
      </div>

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
        <button onClick={create} disabled={creating} className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {creating ? "Adding..." : "Add coupon"}
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min</th><th className="p-3">Expires</th><th className="p-3">Active</th><th className="p-3 text-right">{isFetching ? "Syncing…" : ""}</th></tr>
          </thead>
          <tbody>
            {data?.map((c: any) => (
              <tr key={c.id} className="border-b border-border/30">
                <td className="p-3 font-mono text-gold">{c.code}</td>
                <td className="p-3">{c.type === "percent" ? `${c.value}%` : `৳${c.value}`}</td>
                <td className="p-3 text-muted-foreground">৳{c.min_subtotal}</td>
                <td className="p-3 text-xs text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-3">
                  <button onClick={() => toggle(c.id, c.is_active)} disabled={busyId === c.id}
                    className={`text-xs rounded-full px-3 py-1 disabled:opacity-50 ${c.is_active ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
                    {busyId === c.id ? "Saving..." : c.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(c.id)} disabled={busyId === c.id} className="text-destructive hover:opacity-70 disabled:opacity-50">
                    {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
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
