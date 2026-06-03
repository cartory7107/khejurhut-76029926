-- Keep admin changes fresh and enable reliable product image uploads.

-- Public bucket for product/gallery uploads from the admin panel.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product images admin insert" ON storage.objects;
CREATE POLICY "product images admin insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_permission(auth.uid(), 'products.manage')
  );

DROP POLICY IF EXISTS "product images admin update" ON storage.objects;
CREATE POLICY "product images admin update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND public.has_permission(auth.uid(), 'products.manage')
  ) WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_permission(auth.uid(), 'products.manage')
  );

DROP POLICY IF EXISTS "product images admin delete" ON storage.objects;
CREATE POLICY "product images admin delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND public.has_permission(auth.uid(), 'products.manage')
  );

-- Maintain updated_at automatically for rows edited in the admin panel.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime needs tables in the supabase_realtime publication. Duplicate-object
-- errors are ignored so this migration is safe to run on projects that already
-- enabled realtime manually.
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.coupons REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END;
$$;
