-- 05_import_via_temp_table.sql
-- Usage (psql):
-- 1. psql "$DATABASE_URL"
-- 2. \i script/sql/05_import_via_temp_table.sql
-- (Before running, run: \copy tmp/categories.csv FROM 'tmp/categories.csv' CSV HEADER; and similarly for subcategories/form_fields)

BEGIN;

-- temp table for categories
CREATE TEMP TABLE tmp_categories (
  id text,
  name text,
  description text,
  icon text,
  color text,
  default_department text,
  is_active boolean
);

-- temp table for subcategories
CREATE TEMP TABLE tmp_subcategories (
  id text,
  category_id text,
  name text,
  description text,
  form_fields jsonb,
  default_department text,
  is_active boolean
);

-- temp table for form fields
CREATE TEMP TABLE tmp_form_fields (
  id text,
  label text,
  field_type text,
  options jsonb,
  sub_category text,
  category text,
  unique_id text,
  description text,
  is_required boolean,
  is_hidden boolean,
  validation jsonb,
  order_index integer,
  is_active boolean
);

-- Upsert categories from tmp
INSERT INTO public.categories (id, name, description, icon, color, default_department, is_active)
SELECT id, name, description, icon, color, default_department, coalesce(is_active, true) FROM tmp_categories
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  default_department = EXCLUDED.default_department,
  is_active = EXCLUDED.is_active;

-- Upsert subcategories
INSERT INTO public.subcategories (id, category_id, name, description, form_fields, default_department, is_active)
SELECT id, category_id, name, description, form_fields, default_department, coalesce(is_active, true) FROM tmp_subcategories
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_fields = EXCLUDED.form_fields,
  default_department = EXCLUDED.default_department,
  is_active = EXCLUDED.is_active;

-- Upsert form fields
INSERT INTO public.form_fields (id, label, field_type, options, sub_category, category, unique_id, description, is_required, is_hidden, validation, order_index, is_active)
SELECT id, label, field_type, options, sub_category, category, unique_id, description, coalesce(is_required, false), coalesce(is_hidden, false), validation, coalesce(order_index,0), coalesce(is_active, true)
FROM tmp_form_fields
ON CONFLICT (unique_id) DO UPDATE SET
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  options = EXCLUDED.options,
  description = EXCLUDED.description,
  is_required = EXCLUDED.is_required,
  is_hidden = EXCLUDED.is_hidden,
  validation = EXCLUDED.validation,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;

COMMIT;

-- End of import
