export type Product = {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  description_bn: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: string[];
  origin: string | null;
  weight_grams: number | null;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
};
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};
