-- Minimal schema for importing categories, subcategories, and form fields
-- Run this in Supabase SQL editor or via psql using your DATABASE_URL

-- Note: adjust ENUMs and constraints to match your production schema if needed.

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

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_form_fields_unique_id ON public.form_fields (unique_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories (name);

-- End of minimal schema
