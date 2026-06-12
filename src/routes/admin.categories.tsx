import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, UploadCloud, Pencil, X, Check, ImagePlus } from "lucide-react";
import { normalizeImageUrl } from "@/lib/images";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

const CATEGORY_IMAGE_BUCKET = "category-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const missingBucketMessage =
  "Category image storage is not set up yet, so the image was saved as a data URL.";

const isMissingBucketError = (message: string) => /bucket not found/i.test(message);

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });

const categoryQueryKeys = [["admin-cats-list"], ["admin-cats"], ["cats"], ["cats-page"], ["products"], ["featured"]];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

type CatForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
};

const emptyForm: CatForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: 0,
};

function AdminCats() {
  const qc = useQueryClient();
  const { data, isFetching } = useQuery({
    queryKey: ["admin-cats-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const [form, setForm] = useState<CatForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const invalidateCategoryCaches = useCallback(() => {
    for (const queryKey of categoryQueryKeys) {
      qc.invalidateQueries({ queryKey, refetchType: "all" });
    }
  }, [qc]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-categories-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, invalidateCategoryCaches)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateCategoryCaches]);

  const uploadCatImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (uploading) return;
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) {
      return toast.error("Only image files up to 5MB are allowed");
    }

    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `categories/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(CATEGORY_IMAGE_BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(CATEGORY_IMAGE_BUCKET).getPublicUrl(path);
      setForm((current) => current && { ...current, image_url: urlData.data.publicUrl });
      toast.success("Category image uploaded");
    } catch (e: any) {
      const message = String(e?.message || "");
      if (isMissingBucketError(message)) {
        try {
          const dataUrl = await fileToDataUrl(file);
          setForm((current) => current && { ...current, image_url: dataUrl });
          toast.success(missingBucketMessage);
        } catch {
          toast.error("Failed to read image file");
        }
      } else {
        toast.error(message || "Image upload failed. Check storage bucket policies.");
      }
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form || saving) return;
    const trimmed = form.name.trim();
    if (!trimmed) return toast.error("Category name required");
    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        slug: form.slug || slugify(trimmed),
        description: form.description.trim() || null,
        image_url: normalizeImageUrl(form.image_url) || null,
        sort_order: form.sort_order,
      };
      const query = form.id
        ? supabase.from("categories").update(payload).eq("id", form.id).select("*").single()
        : supabase.from("categories").insert(payload).select("*").single();
      const { data: category, error } = await query;
      if (error) throw error;

      if (form.id) {
        qc.setQueryData<any[]>(["admin-cats-list"], (current = []) =>
          current.map((c) => (c.id === form.id ? category : c)),
        );
      } else {
        qc.setQueryData<any[]>(["admin-cats-list"], (current = []) =>
          category ? [...current, category] : current,
        );
      }
      invalidateCategoryCaches();
      toast.success(form.id ? "Category updated instantly" : "Category added instantly");
      setForm(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (deletingId || !confirm("Delete category? Products in this category will be uncategorized.")) return;
    setDeletingId(id);
    const previous = qc.getQueryData<any[]>(["admin-cats-list"]);
    qc.setQueryData<any[]>(["admin-cats-list"], (current = []) => current.filter((category) => category.id !== id));
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      invalidateCategoryCaches();
      toast.success("Category deleted instantly");
    } catch (e: any) {
      qc.setQueryData(["admin-cats-list"], previous);
      toast.error(e?.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl">Categories</h1>
          <p className="text-xs text-muted-foreground">Category changes sync immediately with product filters.</p>
        </div>
        <button
          onClick={() => setForm({ ...emptyForm })}
          className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
        >
          <ImagePlus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="glass rounded-2xl divide-y divide-border/40">
        {isFetching && <div className="p-3 text-xs text-muted-foreground">Syncing…</div>}
        {data?.map((c: any) => (
          <div key={c.id} className="flex justify-between items-center p-3">
            <div className="flex items-center gap-3">
              {c.image_url ? (
                <img
                  src={normalizeImageUrl(c.image_url)}
                  alt={c.name}
                  className="h-10 w-10 rounded-lg object-cover border border-border/60"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-cocoa border border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                  N/A
                </div>
              )}
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">/{c.slug}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setForm({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    description: c.description || "",
                    image_url: c.image_url || "",
                    sort_order: c.sort_order || 0,
                  })
                }
                className="p-2 hover:text-gold"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => del(c.id)}
                disabled={deletingId === c.id}
                className="text-muted-foreground hover:text-destructive p-2 disabled:opacity-50"
              >
                {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
        {(data || []).length === 0 && <div className="p-6 text-center text-muted-foreground">No categories yet</div>}
      </div>

      {/* Add / Edit Category Modal */}
      {form && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur p-4"
          onClick={() => { if (!saving) setForm(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto space-y-5"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl">{form.id ? "Edit" : "Add"} Category</h2>
              <button onClick={() => { if (!saving) setForm(null); }} disabled={saving}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category Name</label>
              <input
                placeholder="e.g. Premium Dates"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })
                }
                className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm"
                autoFocus
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">URL Slug</label>
              <input
                placeholder="auto-generated from name"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                placeholder="Short description for the category page..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm"
              />
            </div>

            {/* Category Image */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-gold font-semibold border-b border-gold/20 pb-1">
                Category Image
              </h3>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-50">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  {uploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadCatImage}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              </div>
              {/* Image Preview */}
              {form.image_url && (
                <div className="relative inline-block">
                  <div className="h-28 w-28 rounded-xl overflow-hidden border border-gold/30 shadow-gold">
                    <img
                      src={normalizeImageUrl(form.image_url)}
                      alt="Category preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {/* Manual URL input */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Or paste image URL</label>
                <input
                  placeholder="https://example.com/image.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
              <input
                type="number"
                placeholder="0"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-sm"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={save}
              disabled={saving || uploading}
              className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> {form.id ? "Update Category" : "Create Category"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
