
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'buyer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Subcategories
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subcategories are public" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Admins manage subcategories" ON public.subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Listings
CREATE TYPE public.listing_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'used');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'draft', 'removed');

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  condition listing_condition NOT NULL DEFAULT 'good',
  status listing_status NOT NULL DEFAULT 'active',
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are public" ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view own listings" ON public.listings FOR SELECT TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Admins view all listings" ON public.listings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers create own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers update own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers delete own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Admins manage listings" ON public.listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX listings_category_idx ON public.listings(category_id);
CREATE INDEX listings_seller_idx ON public.listings(seller_id);
CREATE INDEX listings_status_idx ON public.listings(status);

-- Ratings (buyer rates seller)
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, rater_id, listing_id)
);
GRANT SELECT ON public.ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings are public" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users create ratings" ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rater_id AND auth.uid() <> seller_id);
CREATE POLICY "Users update own ratings" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = rater_id);
CREATE POLICY "Users delete own ratings" ON public.ratings FOR DELETE TO authenticated USING (auth.uid() = rater_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile + default buyer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');

  IF COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer') = 'seller' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed categories + subcategories
WITH cats(name, slug, icon) AS (VALUES
  ('Electronics', 'electronics', 'Laptop'),
  ('Fashion', 'fashion', 'Shirt'),
  ('Home & Garden', 'home-garden', 'Home'),
  ('Vehicles', 'vehicles', 'Car'),
  ('Sports & Outdoors', 'sports', 'Bike'),
  ('Books & Media', 'books-media', 'BookOpen'),
  ('Toys & Kids', 'toys-kids', 'ToyBrick'),
  ('Services', 'services', 'Wrench')
), ins AS (
  INSERT INTO public.categories (name, slug, icon) SELECT * FROM cats RETURNING id, slug
)
INSERT INTO public.subcategories (category_id, name, slug)
SELECT ins.id, sub.name, sub.slug FROM ins JOIN (VALUES
  ('electronics','Phones','phones'), ('electronics','Laptops','laptops'), ('electronics','Cameras','cameras'), ('electronics','Audio','audio'),
  ('fashion','Men','men'), ('fashion','Women','women'), ('fashion','Kids','kids'), ('fashion','Shoes','shoes'),
  ('home-garden','Furniture','furniture'), ('home-garden','Kitchen','kitchen'), ('home-garden','Garden','garden'),
  ('vehicles','Cars','cars'), ('vehicles','Motorcycles','motorcycles'), ('vehicles','Parts','parts'),
  ('sports','Fitness','fitness'), ('sports','Cycling','cycling'), ('sports','Outdoors','outdoors'),
  ('books-media','Books','books'), ('books-media','Music','music'), ('books-media','Movies','movies'),
  ('toys-kids','Toys','toys'), ('toys-kids','Baby','baby'),
  ('services','Repair','repair'), ('services','Tutoring','tutoring')
) AS sub(cat_slug, name, slug) ON ins.slug = sub.cat_slug;
