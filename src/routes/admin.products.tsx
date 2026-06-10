import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Eye,
  Sparkles,
  ImagePlus,
  Trash,
  UploadCloud,
  Loader2,
  FolderPlus,
  Check,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateProductImage } from "@/lib/ai-image.functions";
import { ProductImage } from "@/components/shop/ProductImage";
import { normalizeImageUrl } from "@/lib/images";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const missingBucketMessage =
  "Product image storage is not set up yet, so the image was saved inline.";

const isMissingBucketError = (message: string) => /bucket not found/i.test(message);

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });

type Form = {
  id?: string;
  name: string;
  name_bn: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: string[];
  category_id: string | null;
  is_featured: boolean;
  is_active: boolean;
};

const empty: Form = {
  name: "",
  name_bn: "",
  slug: "",
  description: "",
  price: 0,
  compare_at_price: null,
  stock: 0,
  images: [""],
  category_id: null,
  is_featured: false,
  is_active: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const productQueryKeys = [
  ["admin-products"],
  ["admin-stats"],
  ["products"],
  ["featured"],
  ["related"],
  ["product"],
  ["wishlist-products"],
];

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products, isFetching } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
  const [form, setForm] = useState<Form | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const genImage = useServerFn(generateProductImage);

  const invalidateProductCaches = useCallback(() => {
    for (const queryKey of productQueryKeys) {
      qc.invalidateQueries({ queryKey, refetchType: "all" });
    }
  }, [qc]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        invalidateProductCaches();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-cats"] });
        qc.invalidateQueries({ queryKey: ["cats"] });
        qc.invalidateQueries({ queryKey: ["cats-page"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateProductCaches, qc]);

  const coverImage = useMemo(
    () => form?.images.map(normalizeImageUrl).find(Boolean) || "",
    [form?.images],
  );

  const toPayload = (current: Form) => ({
    name: current.name.trim(),
    name_bn: current.name_bn.trim() || null,
    slug: slugify(current.slug || current.name),
    description: current.description.trim() || null,
    price: Number(current.price),
    compare_at_price: current.compare_at_price ? Number(current.compare_at_price) : null,
    stock: Number(current.stock),
    images: current.images.map(normalizeImageUrl).filter(Boolean),
    category_id: current.category_id,
    is_featured: current.is_featured,
    is_active: current.is_active,
  });

  const save = async () => {
    if (!form || saving) return;
    const payload = toPayload(form);
    if (!payload.name) return toast.error("Product name required");
    if (!payload.slug) return toast.error("Slug required");
    if (payload.images.length === 0) return toast.error("Add or upload at least one image");
    setSaving(true);
    try {
      const query = form.id
        ? supabase.from("products").update(payload).eq("id", form.id).select("*").single()
        : supabase.from("products").insert(payload).select("*").single();
      const { data, error } = await query;
      if (error) throw error;

      qc.setQueryData<any[]>(["admin-products"], (current = []) => {
        if (!data) return current;
        if (form.id) return current.map((product) => (product.id === form.id ? data : product));
        return [data, ...current.filter((product) => product.id !== data.id)];
      });
      invalidateProductCaches();
      toast.success(form.id ? "Product updated instantly" : "Product added instantly");
      setPreviewing(false);
      setForm(null);
      setShowNewCat(false);
      setNewCatName("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const aiGenerate = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Enter a product name first");
    setGenerating(true);
    try {
      const { url } = await genImage({
        data: {
          prompt: `${form.name}${form.description ? `. ${form.description.slice(0, 160)}` : ""}`,
        },
      });
      setForm({
        ...form,
        images: [normalizeImageUrl(url), ...form.images.map(normalizeImageUrl).filter(Boolean)],
      });
      toast.success("AI image generated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!form || uploading) return;
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const invalid = files.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE,
    );
    if (invalid) return toast.error("Only image files up to 5MB are allowed");

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      let usedInlineFallback = false;
      for (const file of files) {
        try {
          const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `products/${crypto.randomUUID()}.${extension}`;
          const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type,
          });
          if (error) throw error;
          const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        } catch (e: any) {
          const message = String(e?.message || "");
          if (!isMissingBucketError(message)) throw e;
          uploadedUrls.push(await fileToDataUrl(file));
          usedInlineFallback = true;
        }
      }
      setForm(
        (current) =>
          current && {
            ...current,
            images: [...uploadedUrls, ...current.images.map(normalizeImageUrl).filter(Boolean)],
          },
      );
      toast.success(
        usedInlineFallback
          ? missingBucketMessage
          : `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded`,
      );
    } catch (e: any) {
      const message = String(e?.message || "");
      toast.error(message || "Image upload failed. Check storage bucket policies.");
    } finally {
      setUploading(false);
    }
  };

  const updateImage = (i: number, val: string) => {
    if (!form) return;
    const next = [...form.images];
    next[i] = val;
    setForm({ ...form, images: next });
  };
  const addImage = () => form && setForm({ ...form, images: [...form.images, ""] });
  const removeImage = (i: number) =>
    form && setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });

  const del = async (id: string) => {
    if (deletingId || !confirm("Delete product?")) return;
    setDeletingId(id);
    const previous = qc.getQueryData<any[]>(["admin-products"]);
    qc.setQueryData<any[]>(["admin-products"], (current = []) =>
      current.filter((product) => product.id !== id),
    );
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      invalidateProductCaches();
      toast.success("Deleted instantly");
    } catch (e: any) {
      qc.setQueryData(["admin-products"], previous);
      toast.error(e?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const createCategoryInline = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed || creatingCat) return;
    setCreatingCat(true);
    try {
      const catSlug = slugify(trimmed);
      const { data: category, error } = await supabase
        .from("categories")
        .insert({ name: trimmed, slug: catSlug })
        .select("*")
        .single();
      if (error) throw error;
      // Update the categories cache so the dropdown shows the new category
      qc.setQueryData<any[]>(["admin-cats"], (current = []) =>
        category ? [...current, category] : current,
      );
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      qc.invalidateQueries({ queryKey: ["cats"] });
      qc.invalidateQueries({ queryKey: ["cats-page"] });
      // Auto-select the newly created category
      if (form && category) {
        setForm({ ...form, category_id: category.id });
      }
      setNewCatName("");
      setShowNewCat(false);
      toast.success(`Category "${trimmed}" created & selected`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create category");
    } finally {
      setCreatingCat(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-xs text-muted-foreground">
            Changes sync live across admin and storefront pages.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ ...empty, images: [""] });
            setShowNewCat(false);
            setNewCatName("");
          }}
          className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">{isFetching ? "Syncing…" : ""}</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/30">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <ProductImage
                      src={p.images?.[0]}
                      alt={p.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span>{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gold">{bdt(Number(p.price))}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}
                  >
                    {p.is_active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      setForm({
                        id: p.id,
                        name: p.name,
                        name_bn: p.name_bn || "",
                        slug: p.slug,
                        description: p.description || "",
                        price: Number(p.price),
                        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
                        stock: p.stock,
                        images: p.images?.length ? p.images.map(normalizeImageUrl) : [""],
                        category_id: p.category_id,
                        is_featured: p.is_featured,
                        is_active: p.is_active,
                      });
                      setShowNewCat(false);
                      setNewCatName("");
                    }}
                    className="p-2 hover:text-gold"
                    disabled={deletingId === p.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => del(p.id)}
                    className="p-2 hover:text-destructive disabled:opacity-50"
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {(products || []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No products yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur p-4"
          onClick={() => {
            if (!saving) {
              setForm(null);
              setShowNewCat(false);
              setNewCatName("");
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto space-y-3"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl">{form.id ? "Edit" : "Add"} Product</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewing(true)}
                  className="rounded-full glass border border-gold/40 px-3 py-1.5 text-xs text-gold inline-flex items-center gap-1.5 hover:bg-gold/10"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => {
                    if (!saving) {
                      setForm(null);
                      setShowNewCat(false);
                      setNewCatName("");
                    }
                  }}
                  disabled={saving}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: form.slug || slugify(e.target.value),
                  })
                }
                className="rounded-xl bg-input border border-border px-3 py-2"
              />
              <input
                placeholder="Name (Bangla)"
                value={form.name_bn}
                onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                className="rounded-xl bg-input border border-border px-3 py-2"
              />
              <input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                className="rounded-xl bg-input border border-border px-3 py-2"
              />
              <select
                value={form.category_id || ""}
                onChange={(e) => {
                  setForm({ ...form, category_id: e.target.value || null });
                  if (e.target.value) setShowNewCat(false);
                }}
                className="rounded-xl bg-input border border-border px-3 py-2"
              >
                <option value="">No category</option>
                {cats?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* Inline Category Creation */}
              <div className="space-y-2">
                {!showNewCat ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCat(true)}
                    className="w-full rounded-xl border border-dashed border-gold/40 px-3 py-2 text-xs text-gold hover:bg-gold/10 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> Add new category
                  </button>
                ) : (
                  <div className="glass rounded-xl p-3 space-y-2 border border-gold/30">
                    <label className="text-xs uppercase tracking-wider text-gold font-semibold">
                      Create New Category
                    </label>
                    <input
                      placeholder="Category name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createCategoryInline();
                        }
                      }}
                      className="w-full rounded-xl bg-input border border-border px-3 py-2 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={createCategoryInline}
                        disabled={creatingCat || !newCatName.trim()}
                        className="flex-1 rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                      >
                        {creatingCat ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {creatingCat ? "Creating..." : "Create & Select"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCat(false);
                          setNewCatName("");
                        }}
                        className="rounded-full glass border border-border px-3 py-1.5 text-xs hover:text-destructive"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <input
                type="number"
                placeholder="Price (৳)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="rounded-xl bg-input border border-border px-3 py-2"
              />
              <input
                type="number"
                placeholder="Compare price"
                value={form.compare_at_price ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    compare_at_price: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="rounded-xl bg-input border border-border px-3 py-2"
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="rounded-xl bg-input border border-border px-3 py-2"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Images (first is the cover)
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-50">
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" />
                    )}{" "}
                    {uploading ? "Uploading..." : "Upload from gallery"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={uploadFiles}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={aiGenerate}
                    disabled={generating || uploading}
                    className="rounded-full glass border border-gold/40 px-3 py-1.5 text-xs text-gold inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />{" "}
                    {generating ? "Generating..." : "Generate with AI"}
                  </button>
                  <button
                    type="button"
                    onClick={addImage}
                    className="rounded-full glass border border-border px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:text-gold"
                  >
                    <ImagePlus className="h-3.5 w-3.5" /> Add URL
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Mobile gallery uploads go to Supabase Storage. URL images still work as a fallback.
              </p>
              <div className="space-y-2">
                {form.images.map((url, i) => (
                  <div key={`${i}-${url.slice(0, 20)}`} className="flex gap-2 items-center">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-cocoa border border-border/60 shrink-0">
                      {url ? (
                        <ProductImage src={url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <input
                      value={url}
                      onChange={(e) => updateImage(i, e.target.value)}
                      placeholder="https://... or uploaded image URL"
                      className="flex-1 min-w-0 rounded-xl bg-input border border-border px-3 py-2 text-sm"
                    />
                    {form.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="p-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl bg-input border border-border px-3 py-2"
            />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />{" "}
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />{" "}
                Active
              </label>
            </div>
            <button
              onClick={save}
              disabled={saving || uploading || generating}
              className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save instantly"}
            </button>
          </div>

          {previewing && (
            <div
              className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur p-4"
              onClick={() => setPreviewing(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="glass-strong rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold">Preview</p>
                    <h3 className="font-display text-2xl">Before publishing</h3>
                  </div>
                  <button onClick={() => setPreviewing(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-cocoa border border-gold/30 shadow-gold">
                    {coverImage ? (
                      <ProductImage
                        src={coverImage}
                        alt={form.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid place-items-center h-full text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h1 className="font-display text-4xl">{form.name || "Product name"}</h1>
                    {form.name_bn && (
                      <p className="font-arabic text-lg text-gold/80">{form.name_bn}</p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-gradient-gold font-semibold">
                        {bdt(form.price)}
                      </span>
                      {form.compare_at_price && form.compare_at_price > form.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {bdt(form.compare_at_price)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {form.description || "Description goes here..."}
                    </p>
                    <div className="flex gap-1.5 pt-2">
                      {form.images
                        .slice(0, 5)
                        .filter(Boolean)
                        .map((u, i) => (
                          <div
                            key={i}
                            className="h-12 w-12 rounded-lg overflow-hidden border border-border/60"
                          >
                            <ProductImage src={u} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground pt-2">
                      {form.is_active ? "✓ Will be visible" : "⚠ Hidden — toggle Active to publish"}{" "}
                      · {form.is_featured ? "★ Featured" : "Not featured"} · Stock: {form.stock}
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
