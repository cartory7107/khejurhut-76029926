
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

-- Auto-create profile + assign customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_bn TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  stock INT NOT NULL DEFAULT 0,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  origin TEXT,
  weight_grams INT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);

-- Cart
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Wishlist
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid()=id);

CREATE POLICY "roles self select" ON public.user_roles FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "roles admin all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "products public read" ON public.products FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "cart self" ON public.cart_items FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "wishlist self" ON public.wishlist_items FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE POLICY "orders self select" ON public.orders FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders self insert" ON public.orders FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "order_items select" ON public.order_items FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "order_items insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.user_id=auth.uid())
);
