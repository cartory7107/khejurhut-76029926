import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Form = {
  id?: string; name: string; name_bn: string; slug: string; description: string;
  price: number; compare_at_price: number | null; stock: number; image_url: string;
  category_id: string | null; is_featured: boolean; is_active: boolean;
};

const empty: Form = {
  name: "", name_bn: "", slug: "", description: "", price: 0, compare_at_price: null,
  stock: 0, image_url: "/images/products/medjool.jpg", category_id: null, is_featured: false, is_active: true,
};

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*").order("created_at", { ascending: false })).data || [],
  });
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data || [],
  });
  const [form, setForm] = useState<Form | null>(null);

  const save = async () => {
    if (!form) return;
    const payload = {
      name: form.name, name_bn: form.name_bn || null, slug: form.slug,
      description: form.description || null, price: form.price,
      compare_at_price: form.compare_at_price || null, stock: form.stock,
      images: [form.image_url], category_id: form.category_id,
      is_featured: form.is_featured, is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl">Products</h1>
        <button onClick={() => setForm(empty)} className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr><th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {products?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/30">
                <td className="p-3"><div className="flex items-center gap-2"><img src={p.images?.[0]} className="h-10 w-10 rounded object-cover" /><span>{p.name}</span></div></td>
                <td className="p-3 text-gold">{bdt(Number(p.price))}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "Active" : "Hidden"}</span></td>
                <td className="p-3 text-right">
                  <button onClick={() => setForm({
                    id: p.id, name: p.name, name_bn: p.name_bn || "", slug: p.slug,
                    description: p.description || "", price: Number(p.price),
                    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
                    stock: p.stock, image_url: p.images?.[0] || "", category_id: p.category_id,
                    is_featured: p.is_featured, is_active: p.is_active,
                  })} className="p-2 hover:text-gold"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(p.id)} className="p-2 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur p-4" onClick={() => setForm(null)}>
          <div onClick={e => e.stopPropagation()} className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl">{form.id ? "Edit" : "Add"} Product</h2>
              <button onClick={() => setForm(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} className="rounded-xl bg-input border border-border px-3 py-2" />
              <input placeholder="Name (Bangla)" value={form.name_bn} onChange={e => setForm({ ...form, name_bn: e.target.value })} className="rounded-xl bg-input border border-border px-3 py-2" />
              <input placeholder="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="rounded-xl bg-input border border-border px-3 py-2" />
              <select value={form.category_id || ""} onChange={e => setForm({ ...form, category_id: e.target.value || null })} className="rounded-xl bg-input border border-border px-3 py-2">
                <option value="">No category</option>
                {cats?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" placeholder="Price (৳)" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="rounded-xl bg-input border border-border px-3 py-2" />
              <input type="number" placeholder="Compare price" value={form.compare_at_price ?? ""} onChange={e => setForm({ ...form, compare_at_price: e.target.value ? Number(e.target.value) : null })} className="rounded-xl bg-input border border-border px-3 py-2" />
              <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="rounded-xl bg-input border border-border px-3 py-2" />
              <input placeholder="Image URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="rounded-xl bg-input border border-border px-3 py-2" />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl bg-input border border-border px-3 py-2" />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            </div>
            <button onClick={save} className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
