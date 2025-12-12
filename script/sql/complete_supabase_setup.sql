-- COMPLETE SUPABASE SETUP SCRIPT
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- This creates tables, indexes, and imports sample data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create tables for import
CREATE TABLE IF NOT EXISTS public.categories (
  id varchar PRIMARY KEY,
  name varchar NOT NULL UNIQUE,
  description text,
  icon varchar,
  color varchar,
  default_department varchar,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
  id varchar PRIMARY KEY,
  category_id varchar NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  description text,
  form_fields jsonb,
  default_department varchar,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_fields (
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

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_form_fields_unique_id ON public.form_fields (unique_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories (name);

-- Sample data (delete these if you only want the schema)
INSERT INTO public.categories (id, name, description, icon, color, is_active) VALUES
('global','Global','Global category','Globe','#64748b', true),
('booking-technology','Booking & Technology','Booking and technology issues','Smartphone','#3b82f6', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.subcategories (id, category_id, name, description, form_fields, is_active) VALUES
('global-general','global','Global','General global issues','[]', true),
('app-website-issues','booking-technology','App/Website Issues','Problems with website or app', '[]', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.form_fields (id, label, field_type, sub_category, category, unique_id, description, is_required, order_index, is_active) VALUES
('GLB-001','Summary','Short Text','global-general','global','GLB-001','Brief summary', true, 1, true),
('BT-APP-001','Issue Type','Dropdown','app-website-issues','booking-technology','BT-APP-001','Type of app/website issue', true, 1, true)
ON CONFLICT (unique_id) DO UPDATE SET label = EXCLUDED.label;

-- Verify setup
SELECT 'Setup completed. Tables created:' as status;
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('categories', 'subcategories', 'form_fields');