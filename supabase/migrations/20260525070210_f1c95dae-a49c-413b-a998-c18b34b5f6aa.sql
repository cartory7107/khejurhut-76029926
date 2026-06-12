
-- 1. Order numbering
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'AE-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- Backfill existing orders
UPDATE public.orders
SET order_number = 'AE-' || to_char(created_at, 'YYMM') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0')
WHERE order_number IS NULL;

-- 2. Profiles username
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 3. Role expansion
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
