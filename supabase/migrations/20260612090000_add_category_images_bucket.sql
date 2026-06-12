-- Create a public storage bucket for category image uploads from the admin panel.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access to category images
DROP POLICY IF EXISTS "category images public read" ON storage.objects;
CREATE POLICY "category images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

-- Allow admins with categories.manage permission to insert category images
DROP POLICY IF EXISTS "category images admin insert" ON storage.objects;
CREATE POLICY "category images admin insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'category-images'
    AND public.has_permission(auth.uid(), 'categories.manage')
  );

-- Allow admins with categories.manage permission to update category images
DROP POLICY IF EXISTS "category images admin update" ON storage.objects;
CREATE POLICY "category images admin update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'category-images'
    AND public.has_permission(auth.uid(), 'categories.manage')
  ) WITH CHECK (
    bucket_id = 'category-images'
    AND public.has_permission(auth.uid(), 'categories.manage')
  );

-- Allow admins with categories.manage permission to delete category images
DROP POLICY IF EXISTS "category images admin delete" ON storage.objects;
CREATE POLICY "category images admin delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'category-images'
    AND public.has_permission(auth.uid(), 'categories.manage')
  );
