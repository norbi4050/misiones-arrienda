-- This SQL script is to configure the database and environment for running the backend on port 3000.
-- It assumes you are using PostgreSQL with Supabase.

-- 1. Ensure the database is set up with the required schema and tables.
-- Example: Create the Property table if it doesn't exist (adjust columns as needed)
CREATE TABLE IF NOT EXISTS Property (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  bedrooms INT,
  bathrooms INT,
  area NUMERIC,
  address TEXT,
  city TEXT,
  province TEXT,
  postalCode TEXT,
  propertyType TEXT,
  images JSONB,
  amenities JSONB,
  features JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'PUBLISHED',
  isActive BOOLEAN DEFAULT TRUE
);

-- 2. Insert demo data if needed (example)
INSERT INTO Property (id, title, description, price, bedrooms, bathrooms, area, address, city, province, postalCode, propertyType, images, amenities, features, createdAt, status, isActive)
VALUES
('4d4dc702-953a-41b9-b875-8c1eaa3d8714', 'Demo Property', 'A beautiful demo property', 250000, 3, 2, 1200, '123 Demo St', 'Demo City', 'Demo Province', '12345', 'House', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, now(), 'PUBLISHED', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Set environment variables for the backend to connect to Supabase
-- This is usually done outside SQL, but here is an example for reference:
-- export NEXT_PUBLIC_SUPABASE_URL='https://your-supabase-url.supabase.co'
-- export NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'

-- 4. Ensure the backend server is configured to run on port 3000
-- This is typically set in the Next.js app or environment config, not in SQL.

-- Note: To run the backend on port 3000, start the Next.js dev server with:
-- npm run dev
-- or
-- next dev -p 3000

-- This SQL script focuses on database setup and demo data insertion.
