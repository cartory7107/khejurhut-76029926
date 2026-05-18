import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "./types";

export async function fetchProducts(opts?: { search?: string; categorySlug?: string; featured?: boolean }): Promise<Product[]> {
  let q = supabase.from("products").select("*").eq("is_active", true).order("is_featured", { ascending: false });
  if (opts?.search) q = q.ilike("name", `%${opts.search}%`);
  if (opts?.featured) q = q.eq("is_featured", true);
  if (opts?.categorySlug) {
    const { data: c } = await supabase.from("categories").select("id").eq("slug", opts.categorySlug).maybeSingle();
    if (c) q = q.eq("category_id", c.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, images: (d.images as string[]) || [], price: Number(d.price), compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null, rating: Number(d.rating) }));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  return { ...(data as any), images: (data.images as string[]) || [], price: Number(data.price), compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null, rating: Number(data.rating) };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return (data || []) as Category[];
}
