-- FRESH SUPABASE SETUP SCRIPT (IMPORT-READY)
-- Copy/paste into Supabase SQL Editor and run.
--
-- IMPORTANT: This script DROPS and recreates the import tables to ensure
-- IDs are VARCHAR (so values like 'global' work). If you already have data
-- in these tables, back it up first.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables (to avoid UUID/varchar mismatches)
DROP TABLE IF EXISTS public.form_fields CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Categories
CREATE TABLE public.categories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name varchar NOT NULL UNIQUE,
  description text,
  icon varchar,
  color varchar,
  default_department varchar,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories (name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories (is_active);

-- Subcategories
CREATE TABLE public.subcategories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id varchar NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  description text,
  form_fields jsonb,
  default_department varchar,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories (category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON public.subcategories (is_active);

-- Form fields (961+ CSV rows go here)
CREATE TABLE public.form_fields (
  id varchar PRIMARY KEY,
  label varchar NOT NULL,
  field_type varchar NOT NULL,
  options jsonb,
  sub_category varchar NOT NULL,
  category varchar NOT NULL,
  unique_id varchar NOT NULL UNIQUE,
  description text,
  is_required boolean DEFAULT false NOT NULL,
  is_hidden boolean DEFAULT false NOT NULL,
  validation jsonb,
  order_index integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_fields_unique_id ON public.form_fields (unique_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_sub_category ON public.form_fields (sub_category);
CREATE INDEX IF NOT EXISTS idx_form_fields_category ON public.form_fields (category);
CREATE INDEX IF NOT EXISTS idx_form_fields_active ON public.form_fields (is_active);

-- Insert sample global fields that all tickets should have
INSERT INTO public.form_fields (id, label, field_type, sub_category, category, unique_id, description, is_required, order_index, is_active) VALUES
('GLB-001', 'Summary', 'text', 'global', 'global', 'GLB-001', 'Brief summary of the issue', true, 1, true),
('GLB-002', 'Description', 'textarea', 'global', 'global', 'GLB-002', 'Detailed description', true, 2, true),
('GLB-003', 'Reporter Name', 'text', 'global', 'global', 'GLB-003', 'Name of person reporting', true, 3, true),
('GLB-004', 'Contact Method', 'dropdown', 'global', 'global', 'GLB-004', 'How to contact reporter', true, 4, true),
('GLB-005', 'Date Occurred', 'date', 'global', 'global', 'GLB-005', 'When did this happen', false, 5, true),
('GLB-006', 'Location', 'text', 'global', 'global', 'GLB-006', 'Where did this occur', false, 6, true),
('GLB-007', 'Urgency Level', 'radio', 'global', 'global', 'GLB-007', 'How urgent is this issue', true, 7, true)
ON CONFLICT (unique_id) DO UPDATE SET 
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  description = EXCLUDED.description;

-- Add options to dropdown and radio fields
UPDATE public.form_fields 
SET options = '["Email", "Phone", "In-Person", "App Message", "Other"]'::jsonb
WHERE unique_id = 'GLB-004';

UPDATE public.form_fields 
SET options = '["Low", "Medium", "High", "Critical"]'::jsonb
WHERE unique_id = 'GLB-007';

-- Insert sample categories to get started
INSERT INTO public.categories (id, name, description, icon, color, is_active) VALUES
('global', 'Global', 'Global category', 'Globe', '#64748b', true),
('booking-technology', 'Booking & Technology', 'Booking and technology issues', 'Smartphone', '#3b82f6', true),
('customer-service', 'Customer Service', 'Service quality and communication issues', 'Users', '#10b981', true),
('facilities-equipment', 'Facility & Amenities', 'Physical space, equipment, and infrastructure issues', 'Building', '#f59e0b', true),
('class-experience', 'Class Experience', 'Instructor performance and class-related issues', 'GraduationCap', '#8b5cf6', true),
('membership-billing', 'Membership & Billing', 'Account, payment, and membership issues', 'CreditCard', '#ef4444', true),
('health-safety', 'Health & Safety', 'Safety incidents and health-related concerns', 'Shield', '#dc2626', true),
('miscellaneous', 'Miscellaneous', 'Other issues not covered by main categories', 'MoreHorizontal', '#6b7280', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- Insert sample subcategories
INSERT INTO public.subcategories (id, category_id, name, description, form_fields, is_active) VALUES
('global-general', 'global', 'Global', 'General global issues', '{"fields": []}', true),
('app-website-issues', 'booking-technology', 'App/Website Issues', 'Problems with website or app', '{"fields": []}', true),
('booking-failures', 'booking-technology', 'Booking Failures', 'Failed class bookings', '{"fields": []}', true),
('front-desk-service', 'customer-service', 'Front Desk Service', 'Reception and front desk issues', '{"fields": []}', true),
('facility-cleanliness', 'facilities-equipment', 'Facility Cleanliness', 'Cleanliness and maintenance issues', '{"fields": []}', true),
('instructor-performance', 'class-experience', 'Instructor Performance', 'Issues with class instructors', '{"fields": []}', true),
('payment-issues', 'membership-billing', 'Payment Issues', 'Problems with payments and billing', '{"fields": []}', true),
('safety-incident', 'health-safety', 'Safety Incident', 'Safety-related incidents', '{"fields": []}', true),
('other-issues', 'miscellaneous', 'Other Issues', 'Issues not fitting other categories', '{"fields": []}', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Enable Row Level Security (RLS) - Optional but recommended
-- Note: Using publishable key instead of service role, so keeping RLS minimal
-- (RLS is left disabled for import tables unless you explicitly enable it)

-- Create permissive RLS policies for publishable key access
-- If you enable RLS on these tables, add explicit policies for anon/authenticated.

-- Grant necessary permissions for publishable key usage
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Force PostgREST to reload schema cache (prevents "schema cache" errors after running this script)
NOTIFY pgrst, 'reload schema';

-- Final verification
SELECT 'Database setup completed successfully!' as status;
SELECT 
  schemaname, 
  tablename, 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename AND table_schema = schemaname) as column_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('categories', 'subcategories', 'form_fields')
ORDER BY tablename;