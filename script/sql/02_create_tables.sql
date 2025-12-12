-- 02_create_tables.sql
-- Creates the core tables used by the importer: categories, subcategories, form_fields

BEGIN;

CREATE TABLE IF NOT EXISTS public.categories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL UNIQUE,
  description text,
  icon varchar,
  color varchar,
  default_department department,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id varchar NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  description text,
  form_fields jsonb,
  default_department department,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

COMMIT;
