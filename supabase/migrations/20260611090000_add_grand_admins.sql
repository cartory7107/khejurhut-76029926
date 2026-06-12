-- Add 2 grand admins (super_admin role)
-- These users must have already signed up via the app's auth flow.
-- The migration looks them up by email in auth.users and upserts their role.

-- goldensos2020@gmail.com → super_admin
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email ILIKE 'goldensos2020@gmail.com' LIMIT 1),
  'super_admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- If they currently have a 'customer' or 'admin' role, also promote them:
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email ILIKE 'goldensos2020@gmail.com' LIMIT 1)
  AND role IN ('customer', 'admin', 'staff');

-- Nexten7107@gmail.com → super_admin
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email ILIKE 'Nexten7107@gmail.com' LIMIT 1),
  'super_admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- If they currently have a 'customer' or 'admin' role, also promote them:
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email ILIKE 'Nexten7107@gmail.com' LIMIT 1)
  AND role IN ('customer', 'admin', 'staff');
