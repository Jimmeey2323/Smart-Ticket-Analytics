-- 03_indexes_and_grants.sql
-- Create helpful indexes and (optional) read/insert privileges for the anon/service-role roles

BEGIN;

-- Indexes to speed queries used by the app
CREATE INDEX IF NOT EXISTS idx_form_fields_unique_id ON public.form_fields (unique_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories (name);
CREATE INDEX IF NOT EXISTS idx_form_fields_category ON public.form_fields (category);
CREATE INDEX IF NOT EXISTS idx_form_fields_sub_category ON public.form_fields (sub_category);

-- (Optional) Grant select/insert/update privileges to the authenticated role if desired
-- Replace "authenticated" with your project's role if different.
-- GRANT SELECT, INSERT, UPDATE ON public.categories TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON public.subcategories TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON public.form_fields TO authenticated;

COMMIT;
