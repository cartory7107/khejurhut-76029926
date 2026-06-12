
-- Revoke EXECUTE on trigger-only function
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;

-- Promote existing admins
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';

-- Role default permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE(role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions read all" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "role_permissions super_admin write" ON public.role_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Per-user permission overrides
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_permissions self read" ON public.user_permissions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "user_permissions super_admin write" ON public.user_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed default permissions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('super_admin', 'products.manage'),
  ('super_admin', 'orders.manage'),
  ('super_admin', 'categories.manage'),
  ('super_admin', 'coupons.manage'),
  ('super_admin', 'users.manage'),
  ('super_admin', 'analytics.view'),
  ('admin', 'products.manage'),
  ('admin', 'orders.manage'),
  ('admin', 'categories.manage'),
  ('admin', 'coupons.manage'),
  ('admin', 'analytics.view'),
  ('staff', 'orders.manage'),
  ('staff', 'analytics.view')
ON CONFLICT (role, permission) DO NOTHING;

-- has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Explicit user revoke wins
    NOT EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = _user_id AND permission = _permission AND granted = false
    )
    AND (
      -- Explicit user grant
      EXISTS (
        SELECT 1 FROM public.user_permissions
        WHERE user_id = _user_id AND permission = _permission AND granted = true
      )
      -- Or via role
      OR EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role = ur.role
        WHERE ur.user_id = _user_id AND rp.permission = _permission
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO anon, authenticated;

-- Update RLS policies to accept super_admin (admin role works via has_role still since admin still exists)
-- products
DROP POLICY IF EXISTS "products admin write" ON public.products;
CREATE POLICY "products admin write" ON public.products
  FOR ALL USING (public.has_permission(auth.uid(), 'products.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'products.manage'));

-- categories
DROP POLICY IF EXISTS "categories admin write" ON public.categories;
CREATE POLICY "categories admin write" ON public.categories
  FOR ALL USING (public.has_permission(auth.uid(), 'categories.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'categories.manage'));

-- coupons
DROP POLICY IF EXISTS "coupons admin write" ON public.coupons;
CREATE POLICY "coupons admin write" ON public.coupons
  FOR ALL USING (public.has_permission(auth.uid(), 'coupons.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'coupons.manage'));

DROP POLICY IF EXISTS "coupons public read active" ON public.coupons;
CREATE POLICY "coupons public read active" ON public.coupons
  FOR SELECT USING (is_active = true OR public.has_permission(auth.uid(), 'coupons.manage'));

-- orders admin update
DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders
  FOR UPDATE USING (public.has_permission(auth.uid(), 'orders.manage'));

DROP POLICY IF EXISTS "orders self select" ON public.orders;
CREATE POLICY "orders self select" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.has_permission(auth.uid(), 'orders.manage'));

-- order_items select
DROP POLICY IF EXISTS "order_items select" ON public.order_items;
CREATE POLICY "order_items select" ON public.order_items
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.has_permission(auth.uid(), 'orders.manage'))
  ));

-- order_status_history
DROP POLICY IF EXISTS "osh admin insert" ON public.order_status_history;
CREATE POLICY "osh admin insert" ON public.order_status_history
  FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'orders.manage'));

DROP POLICY IF EXISTS "osh select" ON public.order_status_history;
CREATE POLICY "osh select" ON public.order_status_history
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
      AND (o.user_id = auth.uid() OR public.has_permission(auth.uid(), 'orders.manage'))
  ));

-- user_roles management for super_admin
DROP POLICY IF EXISTS "roles admin all" ON public.user_roles;
CREATE POLICY "roles super_admin all" ON public.user_roles
  FOR ALL USING (public.has_permission(auth.uid(), 'users.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'users.manage'));

-- Profiles: allow super_admin to read all profiles for user management
DROP POLICY IF EXISTS "profiles admin select" ON public.profiles;
CREATE POLICY "profiles admin select" ON public.profiles
  FOR SELECT USING (public.has_permission(auth.uid(), 'users.manage'));
