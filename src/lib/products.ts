import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "./types";

const categoryFallbacks: Record<string, { image_url: string; description: string }> = {
  "premium-dates": {
    image_url: "/images/products/ajwa.jpg",
    description: "Royal Ajwa, Medjool and rare hand-selected dates.",
  },
  "organic-dates": {
    image_url: "/images/products/sukkari.jpg",
    description: "Naturally sweet dates with clean, harvest-fresh flavor.",
  },
  "gift-boxes": {
    image_url: "/images/products/giftbox.jpg",
    description: "Luxury boxes crafted for Eid, Ramadan and premium gifting.",
  },
  ramadan: {
    image_url: "/images/products/stuffed.jpg",
    description: "Special Ramadan selections for iftar tables and family sharing.",
  },
};

function normalizeProduct(d: any): Product {
  return {
    ...d,
    images: (d.images as string[]) || [],
    price: Number(d.price),
    compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null,
    rating: Number(d.rating),
  };
}

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
  return (data || []).map(normalizeProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalizeProduct(data);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data || []).map((category: any) => {
    const fallback = categoryFallbacks[category.slug];
    return {
      ...category,
      image_url: category.image_url || fallback?.image_url || "/images/products/medjool.jpg",
      description: category.description || fallback?.description || "Explore premium Saudi dates.",
    };
  }) as Category[];
}
