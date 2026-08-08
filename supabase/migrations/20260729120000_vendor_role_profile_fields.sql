-- Vendor role support + profile fields for onboarding metadata
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS br_number TEXT;

CREATE OR REPLACE FUNCTION public.has_sales_role(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('seller', 'vendor')
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    first_name,
    last_name,
    company_name,
    br_number
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NULLIF(trim(concat_ws(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')), ''),
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'br_number', '')
  );

  IF COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer') = 'vendor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendor');
  ELSIF COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer') = 'seller' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  END IF;

  RETURN NEW;
END;
$$;