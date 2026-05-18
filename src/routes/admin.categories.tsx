import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

function AdminCats() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-cats-list"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data || [],
  });
  const [name, setName] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("categories").insert({ name, slug });
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["admin-cats-list"] });
  };
  const del = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cats-list"] });
  };
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Categories</h1>
      <div className="glass rounded-2xl p-4 flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New category" className="flex-1 rounded-xl bg-input border border-border px-3 py-2" />
        <button onClick={add} className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground">Add</button>
      </div>
      <div className="glass rounded-2xl divide-y divide-border/40">
        {data?.map((c: any) => (
          <div key={c.id} className="flex justify-between items-center p-3">
            <div><div>{c.name}</div><div className="text-xs text-muted-foreground">/{c.slug}</div></div>
            <button onClick={() => del(c.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
