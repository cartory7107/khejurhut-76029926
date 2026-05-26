import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Eye, Sparkles, ImagePlus, Trash } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateProductImage } from "@/lib/ai-image.functions";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Form = {
  id?: string; name: string; name_bn: string; slug: string; description: string;
  price: number; compare_at_price: number | null; stock: number; images: string[];
  category_id: string | null; is_featured: boolean; is_active: boolean;
};

const empty: Form = {
  name: "", name_bn: "", slug: "", description: "", price: 0, compare_at_price: null,
  stock: 0, images: ["/images/products/medjool.jpg"], category_id: null, is_featured: false, is_active: true,
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
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const genImage = useServerFn(generateProductImage);

  const save = async () => {
    if (!form) return;
    const images = form.images.filter((u) => u && u.trim());
    if (images.length === 0) return toast.error("Add at least one image");
    const payload = {
      name: form.name, name_bn: form.name_bn || null, slug: form.slug,
      description: form.description || null, price: form.price,
      compare_at_price: form.compare_at_price || null, stock: form.stock,
      images, category_id: form.category_id,
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

  const aiGenerate = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Enter a product name first");
    setGenerating(true);
    try {
      const { url } = await genImage({ data: { prompt: `${form.name}${form.description ? `. ${form.description.slice(0, 160)}` : ""}` } });
      setForm({ ...form, images: [url, ...form.images.filter(Boolean)] });
      toast.success("AI image generated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const updateImage = (i: number, val: string) => {
    if (!form) return;
    const next = [...form.images];
    next[i] = val;
    setForm({ ...form, images: next });
  };
  const addImage = () => form && setForm({ ...form, images: [...form.images, ""] });
  const removeImage = (i: number) => form && setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });

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
                    stock: p.stock, images: (p.images?.length ? p.images : [""]), category_id: p.category_id,
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
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewing(true)} className="rounded-full glass border border-gold/40 px-3 py-1.5 text-xs text-gold inline-flex items-center gap-1.5 hover:bg-gold/10">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button onClick={() => setForm(null)}><X className="h-5 w-5" /></button>
              </div>
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
            </div>

            {/* Images editor */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Images (first is the cover)</label>
                <div className="flex gap-2">
                  <button type="button" onClick={aiGenerate} disabled={generating}
                    className="rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-50">
                    <Sparkles className="h-3.5 w-3.5" /> {generating ? "Generating..." : "Generate with AI"}
                  </button>
                  <button type="button" onClick={addImage} className="rounded-full glass border border-border px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:text-gold">
                    <ImagePlus className="h-3.5 w-3.5" /> Add URL
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {form.images.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-cocoa border border-border/60 shrink-0">
                      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <input value={url} onChange={(e) => updateImage(i, e.target.value)} placeholder="https://..." className="flex-1 rounded-xl bg-input border border-border px-3 py-2 text-sm" />
                    {form.images.length > 1 && (
                      <button type="button" onClick={() => removeImage(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl bg-input border border-border px-3 py-2" />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            </div>
            <button onClick={save} className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold">Save</button>
          </div>

          {previewing && (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur p-4" onClick={() => setPreviewing(false)}>
              <div onClick={(e) => e.stopPropagation()} className="glass-strong rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold">Preview</p>
                    <h3 className="font-display text-2xl">Before publishing</h3>
                  </div>
                  <button onClick={() => setPreviewing(false)}><X className="h-5 w-5" /></button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-cocoa border border-gold/30 shadow-gold">
                    {form.images[0] ? (
                      <img src={form.images[0]} alt={form.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid place-items-center h-full text-muted-foreground text-sm">No image</div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h1 className="font-display text-4xl">{form.name || "Product name"}</h1>
                    {form.name_bn && <p className="font-arabic text-lg text-gold/80">{form.name_bn}</p>}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-gradient-gold font-semibold">{bdt(form.price)}</span>
                      {form.compare_at_price && form.compare_at_price > form.price && (
                        <span className="text-sm text-muted-foreground line-through">{bdt(form.compare_at_price)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{form.description || "Description goes here..."}</p>
                    <div className="flex gap-1.5 pt-2">
                      {form.images.slice(0, 5).filter(Boolean).map((u, i) => (
                        <div key={i} className="h-12 w-12 rounded-lg overflow-hidden border border-border/60">
                          <img src={u} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground pt-2">
                      {form.is_active ? "✓ Will be visible" : "⚠ Hidden — toggle Active to publish"} · {form.is_featured ? "★ Featured" : "Not featured"} · Stock: {form.stock}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
