import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

const categoryQueryKeys = [["admin-cats-list"], ["admin-cats"], ["cats"], ["cats-page"], ["products"], ["featured"]];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

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
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const slug = slugify(trimmed);
      const { data: category, error } = await supabase.from("categories").insert({ name: trimmed, slug }).select("*").single();
      if (error) throw error;
      qc.setQueryData<any[]>(["admin-cats-list"], (current = []) => (category ? [...current, category] : current));
      setName("");
      invalidateCategoryCaches();
      toast.success("Category added instantly");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add category");
    } finally {
      setCreating(false);
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
      <div>
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="text-xs text-muted-foreground">Category changes sync immediately with product filters.</p>
      </div>
      <div className="glass rounded-2xl p-4 flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New category" className="flex-1 rounded-xl bg-input border border-border px-3 py-2" />
        <button onClick={add} disabled={creating} className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {creating ? "Adding..." : "Add"}
        </button>
      </div>
      <div className="glass rounded-2xl divide-y divide-border/40">
        {isFetching && <div className="p-3 text-xs text-muted-foreground">Syncing…</div>}
        {data?.map((c: any) => (
          <div key={c.id} className="flex justify-between items-center p-3">
            <div><div>{c.name}</div><div className="text-xs text-muted-foreground">/{c.slug}</div></div>
            <button onClick={() => del(c.id)} disabled={deletingId === c.id} className="text-muted-foreground hover:text-destructive p-2 disabled:opacity-50">
              {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        ))}
        {(data || []).length === 0 && <div className="p-6 text-center text-muted-foreground">No categories yet</div>}
      </div>
    </div>
  );
}
