import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const mine = reviews?.find((r) => r.user_id === user?.id);

  const submit = async () => {
    if (!user) return toast.error("Please sign in to review");
    setBusy(true);
    const { error } = await supabase.from("product_reviews").upsert(
      { product_id: productId, user_id: user.id, rating, title: title || null, body: body || null },
      { onConflict: "product_id,user_id" }
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(mine ? "Review updated" : "Review submitted");
    setTitle(""); setBody("");
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const remove = async () => {
    if (!mine) return;
    await supabase.from("product_reviews").delete().eq("id", mine.id);
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
    qc.invalidateQueries({ queryKey: ["product"] });
    toast.success("Review removed");
  };

  return (
    <div className="mt-16">
      <h2 className="font-display text-3xl mb-6">Customer reviews</h2>

      <div className="glass rounded-2xl p-6 mb-6 space-y-3">
        <div className="text-sm text-muted-foreground">{mine ? "Update your review" : "Share your experience"}</div>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`h-6 w-6 ${n <= rating ? "fill-current text-gold" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-xl bg-input border border-border px-4 py-2.5 outline-none focus:border-gold transition text-sm"
        />
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="What did you love about these dates?"
          rows={3}
          className="w-full rounded-xl bg-input border border-border px-4 py-2.5 outline-none focus:border-gold transition text-sm"
        />
        <div className="flex gap-2">
          <button onClick={submit} disabled={busy}
            className="rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
            {mine ? "Update review" : "Post review"}
          </button>
          {mine && (
            <button onClick={remove} className="rounded-full glass border border-border px-4 py-2.5 text-sm text-destructive flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {(reviews || []).length === 0 && (
          <div className="text-sm text-muted-foreground glass rounded-2xl p-6 text-center">No reviews yet — be the first.</div>
        )}
        {reviews?.map((r: any) => (
          <div key={r.id} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current text-gold" : "text-muted-foreground"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.title && <div className="font-display text-lg mt-2">{r.title}</div>}
            {r.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}