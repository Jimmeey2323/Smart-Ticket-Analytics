#!/bin/bash
# Complete import script: applies schema, prepares CSVs, and runs bulk import
set -e

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

echo "🚀 Starting complete import process..."

# Step 1: Apply schema if needed (run these in Supabase SQL editor manually first time)
echo "ℹ️  Make sure you've applied the schema files in Supabase SQL editor first:"
echo "  - script/sql/01_extensions_and_enums.sql"
echo "  - script/sql/02_create_tables.sql" 
echo "  - script/sql/03_indexes_and_grants.sql"
echo ""

# Step 2: Prepare CSVs
echo "📝 Preparing CSVs from attached_assets..."
node script/prepare_import.js

# Check if tmp CSVs exist
if [ ! -f "tmp/categories.csv" ] || [ ! -f "tmp/subcategories.csv" ] || [ ! -f "tmp/form_fields.csv" ]; then
  echo "❌ CSV preparation failed - missing files in tmp/"
  exit 1
fi

echo "✅ CSVs prepared:"
echo "   $(wc -l < tmp/categories.csv) categories"
echo "   $(wc -l < tmp/subcategories.csv) subcategories" 
echo "   $(wc -l < tmp/form_fields.csv) form fields"

# Step 3: Run psql import
echo "📊 Importing to database via psql..."

# Create a temporary SQL script that includes the COPY commands and upserts
cat > tmp/import.sql << 'EOF'
-- Temporary import script

BEGIN;

-- Create temp tables (as defined in 05_import_via_temp_table.sql)
CREATE TEMP TABLE tmp_categories (
  id text,
  name text,
  description text,
  icon text,
  color text,
  default_department text,
  is_active boolean
);

CREATE TEMP TABLE tmp_subcategories (
  id text,
  category_id text,
  name text,
  description text,
  form_fields jsonb,
  default_department text,
  is_active boolean
);

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

-- Import CSVs into temp tables
\copy tmp_categories FROM 'tmp/categories.csv' CSV HEADER
\copy tmp_subcategories FROM 'tmp/subcategories.csv' CSV HEADER  
\copy tmp_form_fields FROM 'tmp/form_fields.csv' CSV HEADER

-- Upsert into final tables
INSERT INTO public.categories (id, name, description, icon, color, default_department, is_active)
SELECT id, name, description, icon, color, NULLIF(default_department, ''), coalesce(is_active, true) FROM tmp_categories
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  default_department = EXCLUDED.default_department,
  is_active = EXCLUDED.is_active;

INSERT INTO public.subcategories (id, category_id, name, description, form_fields, default_department, is_active)
SELECT id, category_id, name, description, form_fields::jsonb, NULLIF(default_department, ''), coalesce(is_active, true) FROM tmp_subcategories
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  form_fields = EXCLUDED.form_fields,
  default_department = EXCLUDED.default_department,
  is_active = EXCLUDED.is_active;

INSERT INTO public.form_fields (id, label, field_type, options, sub_category, category, unique_id, description, is_required, is_hidden, validation, order_index, is_active)
SELECT id, label, field_type, options::jsonb, sub_category, category, unique_id, description, coalesce(is_required, false), coalesce(is_hidden, false), validation::jsonb, coalesce(order_index,0), coalesce(is_active, true)
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

-- Show final counts
SELECT 'Categories' as table_name, count(*) as count FROM public.categories
UNION ALL
SELECT 'Subcategories', count(*) FROM public.subcategories  
UNION ALL
SELECT 'Form Fields', count(*) FROM public.form_fields;
EOF

# Run the import
psql "$DATABASE_URL" -f tmp/import.sql

echo "✅ Import completed successfully!"
echo "🎉 Your categories, subcategories, and form fields are now in the database."