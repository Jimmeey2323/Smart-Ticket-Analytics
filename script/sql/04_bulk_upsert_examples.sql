-- 04_bulk_upsert_examples.sql
-- Example upserts (bulk) for categories, subcategories and form_fields
-- You can paste many VALUES rows into these queries to insert/update many rows at once.

-- Upsert categories
INSERT INTO public.categories (id, name, description, icon, color, default_department, is_active)
VALUES
  ('global','Global','Global category','Globe','#64748b', NULL, true),
  ('booking-technology','Booking & Technology','Booking and technology issues','Smartphone','#3b82f6', 'operations', true),
  ('customer-service','Customer Service','Customer service related','Users','#10b981', 'operations', true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      color = EXCLUDED.color,
      default_department = EXCLUDED.default_department,
      is_active = EXCLUDED.is_active;

-- Upsert subcategories
INSERT INTO public.subcategories (id, category_id, name, description, form_fields, default_department, is_active)
VALUES
  ('app-website-issues','booking-technology','App/Website Issues','Problems with website or app', '[]', 'operations', true),
  ('booking-failures','booking-technology','Booking Failures','Bookings failing to complete','[]','operations', true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      form_fields = EXCLUDED.form_fields,
      default_department = EXCLUDED.default_department,
      is_active = EXCLUDED.is_active;

-- Upsert form fields (example with JSON options)
INSERT INTO public.form_fields (id, label, field_type, options, sub_category, category, unique_id, description, is_required, is_hidden, validation, order_index, is_active)
VALUES
  ('GLB-001','Summary','Short Text', NULL, 'Global','Global','GLB-001','Short summary', true, false, NULL, 1, true),
  ('GLB-002','Details','Long Text', NULL, 'Global','Global','GLB-002','Longer details', false, false, NULL, 2, true)
ON CONFLICT (unique_id) DO UPDATE
  SET label = EXCLUDED.label,
      field_type = EXCLUDED.field_type,
      options = EXCLUDED.options,
      description = EXCLUDED.description,
      is_required = EXCLUDED.is_required,
      is_hidden = EXCLUDED.is_hidden,
      validation = EXCLUDED.validation,
      order_index = EXCLUDED.order_index,
      is_active = EXCLUDED.is_active;

-- For very large batches consider loading CSV into a temporary table and running a single
-- INSERT ... SELECT ... ON CONFLICT DO UPDATE to reduce round trips.
