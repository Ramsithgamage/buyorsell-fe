
-- Create demo seller auth users, profiles, roles, and sample listings
DO $$
DECLARE
  s1 uuid := '11111111-1111-1111-1111-111111111111';
  s2 uuid := '22222222-2222-2222-2222-222222222222';
  s3 uuid := '33333333-3333-3333-3333-333333333333';
  cat_electronics uuid := '2b0031ab-5788-43d4-b89a-a66513ab6671';
  cat_fashion uuid := '6f172fe2-9577-4e5c-be89-f7e6213eac75';
  cat_home uuid := '5f586002-9276-4fe8-a971-2034c5270c34';
  cat_vehicles uuid := 'd03a3a14-3713-49b0-a48d-d8e5cb5d2f2f';
  cat_sports uuid := '83cb8000-0e00-4cea-8a04-5d59f8f3c0e8';
  cat_books uuid := 'b9b8de48-9efa-4d18-a2a9-32dd7cd5bb81';
  cat_toys uuid := 'b87a0e68-3a97-49c6-a6b6-0e02e5b90854';
  cat_services uuid := 'f2b038dc-c4b8-4a12-b387-d26c7b9a60da';
  sub_phones uuid := 'cdd6fcbc-4bb7-4b1b-81df-5914c4cf584c';
  sub_laptops uuid := '5d8ee019-482d-4061-a099-86a5fc8995ba';
  sub_cameras uuid := '15310045-fc9e-472f-a6e3-c52169ec69fc';
  sub_audio uuid := '59265687-b85e-4ad1-9049-9fad19e24d36';
  sub_men uuid := '4add7d45-6ed8-4648-9ac1-1e1435f3d2de';
  sub_women uuid := 'f91453ab-54e0-4860-8bc6-ab40b47ca321';
  sub_shoes uuid := '1b8a0473-decd-4049-a382-bd83c9a1f633';
  sub_furniture uuid := '8790e111-4b5d-4e81-a3ab-6fb209157c71';
  sub_kitchen uuid := '31aafbd8-4ff9-420c-83ef-8be2a3d66fd6';
  sub_cars uuid := '33086136-3363-45b8-aebf-e146c0802a28';
  sub_motorcycles uuid := 'd3be4978-d1a5-4621-b69d-44875f66bda5';
  sub_fitness uuid := 'a20d0ee2-c77a-4e7d-b666-71a7c69c5c24';
  sub_cycling uuid := '5b99f3b5-e9ca-4a0e-ab9e-12ea739b53c7';
  sub_books uuid := 'c1551fe6-22ba-4041-b49c-7ef17ed98a9b';
  sub_toys uuid := '64428864-0ceb-444a-bfce-538386fb7fae';
  sub_tutoring uuid := '633acb98-79e5-426e-9038-6ab39a3dab7b';
BEGIN
  -- Create demo auth users if missing
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    (s1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.alex@example.com', crypt('DemoPass123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Alex Green","account_type":"seller"}', false, '', '', '', ''),
    (s2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.maria@example.com', crypt('DemoPass123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maria Fields","account_type":"seller"}', false, '', '', '', ''),
    (s3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.sam@example.com', crypt('DemoPass123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Sam Rivers","account_type":"seller"}', false, '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure profiles exist (trigger should have created them, but be safe)
  INSERT INTO public.profiles (id, display_name) VALUES
    (s1, 'Alex Green'), (s2, 'Maria Fields'), (s3, 'Sam Rivers')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES
    (s1, 'seller'), (s2, 'seller'), (s3, 'seller'),
    (s1, 'buyer'), (s2, 'buyer'), (s3, 'buyer')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Sample listings
  INSERT INTO public.listings (seller_id, category_id, subcategory_id, title, description, price, currency, condition, status, location, image_url) VALUES
  (s1, cat_electronics, sub_phones, 'iPhone 14 Pro 256GB - Deep Purple', 'Excellent condition, unlocked, includes original box and charger. Battery health 94%.', 749.00, 'USD', 'like_new', 'active', 'San Francisco, CA', 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&q=80'),
  (s2, cat_electronics, sub_laptops, 'MacBook Air M2 13" - Midnight', '2023 model, 16GB RAM, 512GB SSD. Barely used, perfect for students.', 1099.00, 'USD', 'like_new', 'active', 'Austin, TX', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80'),
  (s3, cat_electronics, sub_cameras, 'Sony A7 III Mirrorless Camera', 'Full-frame, comes with 28-70mm kit lens. Under 8k shutter count.', 1450.00, 'USD', 'good', 'active', 'Brooklyn, NY', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'),
  (s1, cat_electronics, sub_audio, 'Sony WH-1000XM5 Headphones', 'Noise cancelling, black. Great sound, all accessories included.', 249.00, 'USD', 'good', 'active', 'San Francisco, CA', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80'),
  (s2, cat_fashion, sub_men, 'Levi''s 501 Original Jeans - 32x32', 'Classic straight fit, dark wash. Only worn a few times.', 45.00, 'USD', 'like_new', 'active', 'Austin, TX', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'),
  (s3, cat_fashion, sub_women, 'Vintage Leather Jacket - Size M', 'Genuine leather, brown, timeless design. Great fall piece.', 120.00, 'USD', 'good', 'active', 'Brooklyn, NY', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'),
  (s1, cat_fashion, sub_shoes, 'Nike Air Jordan 1 Retro High - Size 10', 'Chicago colorway, worn twice, comes with original box.', 220.00, 'USD', 'like_new', 'active', 'San Francisco, CA', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80'),
  (s2, cat_home, sub_furniture, 'Mid-Century Walnut Coffee Table', 'Solid walnut, tapered legs. Small scratch on top, otherwise perfect.', 180.00, 'USD', 'good', 'active', 'Austin, TX', 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80'),
  (s3, cat_home, sub_kitchen, 'KitchenAid Artisan Stand Mixer - Red', '5-quart, all attachments included. Barely used wedding gift.', 285.00, 'USD', 'like_new', 'active', 'Brooklyn, NY', 'https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=800&q=80'),
  (s1, cat_vehicles, sub_cars, '2018 Honda Civic EX - 42k miles', 'One owner, clean title, well maintained. Silver, automatic.', 16500.00, 'USD', 'good', 'active', 'San Francisco, CA', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'),
  (s2, cat_vehicles, sub_motorcycles, 'Kawasaki Ninja 400 - 2021', 'Only 3,200 miles. Green/black, adult owned, never dropped.', 4900.00, 'USD', 'like_new', 'active', 'Austin, TX', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80'),
  (s3, cat_sports, sub_cycling, 'Trek Domane SL 5 Road Bike - 56cm', 'Carbon frame, Shimano 105, tuned up last month. Great commuter/racer.', 1650.00, 'USD', 'good', 'active', 'Brooklyn, NY', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80'),
  (s1, cat_sports, sub_fitness, 'Adjustable Dumbbells Set 5-52.5 lbs', 'Bowflex SelectTech pair. Perfect for home gym, all weights work.', 320.00, 'USD', 'good', 'active', 'San Francisco, CA', 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&q=80'),
  (s2, cat_books, sub_books, 'Harry Potter Complete Hardcover Set', 'All 7 books, US editions, excellent condition. Includes slipcase.', 95.00, 'USD', 'good', 'active', 'Austin, TX', 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=800&q=80'),
  (s3, cat_toys, sub_toys, 'LEGO Star Wars Millennium Falcon 75257', 'Built once, complete with instructions and box. All minifigures included.', 130.00, 'USD', 'like_new', 'active', 'Brooklyn, NY', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80'),
  (s1, cat_services, sub_tutoring, 'Math Tutoring - High School & SAT Prep', 'Certified teacher, 8+ years experience. Online or in-person Bay Area. $45/hr.', 45.00, 'USD', 'new', 'active', 'San Francisco, CA', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80');
END $$;
