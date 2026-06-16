
-- Make admin write policies forgiving: admin/super_admin roles always allowed, in addition to fine-grained permissions.
DROP POLICY IF EXISTS "products admin write" ON public.products;
CREATE POLICY "products admin write" ON public.products
  FOR ALL TO authenticated
  USING (
    public.has_permission(auth.uid(), 'products.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'products.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "categories admin write" ON public.categories;
CREATE POLICY "categories admin write" ON public.categories
  FOR ALL TO authenticated
  USING (
    public.has_permission(auth.uid(), 'categories.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'categories.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "coupons admin write" ON public.coupons;
CREATE POLICY "coupons admin write" ON public.coupons
  FOR ALL TO authenticated
  USING (
    public.has_permission(auth.uid(), 'coupons.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'coupons.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.has_permission(auth.uid(), 'orders.manage')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );
