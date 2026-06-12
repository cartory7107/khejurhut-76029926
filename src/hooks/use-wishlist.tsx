import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

type WishCtx = {
  ids: Set<string>;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  count: number;
};

const Ctx = createContext<WishCtx>({ ids: new Set(), toggle: async () => {}, has: () => false, count: 0 });
const LOCAL_KEY = "kh_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (user) {
      const { data } = await supabase.from("wishlist_items").select("product_id").eq("user_id", user.id);
      setIds(new Set((data || []).map((r) => r.product_id)));
    } else {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY) : null;
      setIds(new Set<string>(raw ? JSON.parse(raw) : []));
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (pid: string) => {
    const next = new Set(ids);
    const had = next.has(pid);
    if (had) next.delete(pid); else next.add(pid);
    setIds(next);
    if (user) {
      if (had) await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", pid);
      else await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: pid });
    } else {
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...next]));
    }
  };

  return (
    <Ctx.Provider value={{ ids, toggle, has: (id) => ids.has(id), count: ids.size }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWishlist = () => useContext(Ctx);