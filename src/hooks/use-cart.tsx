import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Product } from "@/lib/types";

export type CartLine = {
  id: string;
  product_id: string;
  quantity: number;
  product: Pick<Product, "id" | "name" | "slug" | "price" | "images" | "stock">;
};

type CartCtx = {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (p: { id: string }, qty?: number) => Promise<void>;
  update: (id: string, qty: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CartCtx>({} as CartCtx);
const LOCAL_KEY = "kh_cart_v1";

type LocalLine = { product_id: string; quantity: number };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);

  const loadProducts = async (lines: LocalLine[]): Promise<CartLine[]> => {
    if (!lines.length) return [];
    const ids = lines.map(l => l.product_id);
    const { data } = await supabase
      .from("products")
      .select("id,name,slug,price,images,stock")
      .in("id", ids);
    return lines.map(l => {
      const p = data?.find(d => d.id === l.product_id);
      if (!p) return null;
      return {
        id: l.product_id, product_id: l.product_id, quantity: l.quantity,
        product: { ...p, images: (p.images as string[]) || [] },
      };
    }).filter(Boolean) as CartLine[];
  };

  const refresh = useCallback(async () => {
    if (user) {
      const { data } = await supabase
        .from("cart_items")
        .select("id,product_id,quantity,products(id,name,slug,price,images,stock)")
        .eq("user_id", user.id);
      setItems(
        (data || []).map((r: any) => ({
          id: r.id, product_id: r.product_id, quantity: r.quantity,
          product: { ...r.products, images: (r.products?.images as string[]) || [] },
        }))
      );
    } else {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY) : null;
      const lines: LocalLine[] = raw ? JSON.parse(raw) : [];
      setItems(await loadProducts(lines));
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const persistLocal = (lines: LocalLine[]) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(lines));
  };

  const add: CartCtx["add"] = async (p, qty = 1) => {
    if (user) {
      const existing = items.find(i => i.product_id === p.id);
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: p.id, quantity: qty });
      }
    } else {
      const raw = localStorage.getItem(LOCAL_KEY);
      const lines: LocalLine[] = raw ? JSON.parse(raw) : [];
      const ex = lines.find(l => l.product_id === p.id);
      if (ex) ex.quantity += qty;
      else lines.push({ product_id: p.id, quantity: qty });
      persistLocal(lines);
    }
    await refresh();
  };
  const update: CartCtx["update"] = async (id, qty) => {
    if (qty <= 0) return remove(id);
    if (user) await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    else {
      const raw = localStorage.getItem(LOCAL_KEY);
      const lines: LocalLine[] = raw ? JSON.parse(raw) : [];
      const ex = lines.find(l => l.product_id === id);
      if (ex) ex.quantity = qty;
      persistLocal(lines);
    }
    await refresh();
  };
  const remove: CartCtx["remove"] = async (id) => {
    if (user) await supabase.from("cart_items").delete().eq("id", id);
    else {
      const raw = localStorage.getItem(LOCAL_KEY);
      const lines: LocalLine[] = raw ? JSON.parse(raw) : [];
      persistLocal(lines.filter(l => l.product_id !== id));
    }
    await refresh();
  };
  const clear: CartCtx["clear"] = async () => {
    if (user) await supabase.from("cart_items").delete().eq("user_id", user.id);
    else localStorage.removeItem(LOCAL_KEY);
    await refresh();
  };

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, count, subtotal, add, update, remove, clear, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
