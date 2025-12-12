#!/usr/bin/env node

// FRESH CSV IMPORT SCRIPT
// This script imports the 961 fields from your CSV file into the properly structured database
// Run this after setting up the database with fresh_supabase_setup.sql

import 'dotenv/config';
import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const CSV_FILE_PATH = './attached_assets/fields_1765467205072.csv';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('   - SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Initialize Supabase client with publishable key
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function assertImportSchemaReady(): Promise<void> {
  // 1) categories table must exist
  {
    const { error } = await supabase.from('categories').select('id').limit(1);
    if (error?.code === 'PGRST205') {
      throw new Error(
        "Supabase table 'categories' not found. Run script/sql/fresh_supabase_setup.sql in Supabase SQL Editor, then retry."
      );
    }
  }

  // 2) categories.id must accept slug ids like 'global' (varchar).
  // If it's UUID, PostgREST will fail when we filter with a non-uuid value.
  {
    const { error } = await supabase.from('categories').select('id').eq('id', 'global').limit(1);
    if (error?.code === '22P02') {
      throw new Error(
        "Your 'categories.id' column is UUID (it rejects the slug 'global'). Run script/sql/fresh_supabase_setup.sql to reset the schema, then retry."
      );
    }
  }

  // 3) categories.color must exist (this repo's schema uses 'color', not 'color_code')
  {
    const { error } = await supabase.from('categories').select('color').limit(1);
    if (error?.code === 'PGRST204') {
      throw new Error(
        "Your 'categories' table is missing the 'color' column. Run script/sql/fresh_supabase_setup.sql to recreate the import schema, then retry."
      );
    }
  }

  // 4) form_fields table must exist
  {
    const { error } = await supabase.from('form_fields').select('unique_id').limit(1);
    if (error?.code === 'PGRST205') {
      throw new Error(
        "Supabase table 'form_fields' not found. Run script/sql/fresh_supabase_setup.sql in Supabase SQL Editor, then retry."
      );
    }
  }
}

// CSV Column interface
interface CSVRow {
  Label: string;
  'Field Type': string;
  'Options/Other Details': string;
  'Sub Category': string;
  Category: string;
  'Unique ID': string;
  Description: string;
  'Is Required': string;
  'Is Hidden': string;
}

// Helper functions
function mapFieldType(csvFieldType: string): string {
  const typeMapping: { [key: string]: string } = {
    'Short Text': 'text',
    'Long Text': 'textarea',
    'Dropdown': 'dropdown',
    'Radio Button': 'radio',
    'Checkbox': 'checkbox',
    'Date Time': 'datetime',
    'Date': 'date',
    'Time': 'time',
    'Email': 'email',
    'Phone': 'tel',
    'Number': 'number',
    'Auto-generated': 'hidden',
    'Text': 'text',
  };
  return typeMapping[csvFieldType] || 'text';
}

function parseOptions(optionsString: string): string[] | null {
  if (!optionsString || optionsString.trim() === '') return null;
  
  // Split by common delimiters
  const delimiters = [' | ', '|', ',', ';', '\n'];
  let options: string[] = [];
  
  for (const delimiter of delimiters) {
    if (optionsString.includes(delimiter)) {
      options = optionsString.split(delimiter).map(opt => opt.trim()).filter(opt => opt !== '');
      break;
    }
  }
  
  // If no delimiter found, treat as single option
  if (options.length === 0) {
    options = [optionsString.trim()];
  }
  
  return options.length > 0 ? options : null;
}

function generateCategoryId(categoryName: string): string {
  return categoryName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
}

function generateSubcategoryId(subcategoryName: string, categoryId: string): string {
  const subId = subcategoryName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  return `${categoryId}-${subId}`;
}

function getCategoryIcon(categoryName: string): string {
  const iconMap: { [key: string]: string } = {
    'Global': 'Globe',
    'Booking & Technology': 'Smartphone',
    'Customer Service': 'Users',
    'Facilities & Equipment': 'Building',
    'Facility & Amenities': 'Building',
    'Class Experience': 'GraduationCap',
    'Class & Instruction': 'GraduationCap',
    'Membership & Billing': 'CreditCard',
    'Health & Safety': 'Shield',
    'Instructor Related': 'User',
    'Community & Culture': 'Users',
    'Sales & Marketing': 'TrendingUp',
    'Special Programs': 'Star',
    'Retail & Merchandise': 'ShoppingBag',
    'Miscellaneous': 'MoreHorizontal',
  };
  return iconMap[categoryName] || 'Circle';
}

function getCategoryColor(categoryName: string): string {
  const colorMap: { [key: string]: string } = {
    'Global': '#64748b',
    'Booking & Technology': '#3b82f6',
    'Customer Service': '#10b981',
    'Facilities & Equipment': '#f59e0b',
    'Facility & Amenities': '#f59e0b',
    'Class Experience': '#8b5cf6',
    'Class & Instruction': '#8b5cf6',
    'Membership & Billing': '#ef4444',
    'Health & Safety': '#dc2626',
    'Instructor Related': '#06b6d4',
    'Community & Culture': '#84cc16',
    'Sales & Marketing': '#f97316',
    'Special Programs': '#ec4899',
    'Retail & Merchandise': '#14b8a6',
    'Miscellaneous': '#6b7280',
  };
  return colorMap[categoryName] || '#6b7280';
}

function getTrailingNumber(value: string): number {
  const match = value.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

async function importCSVData() {
  console.log('🚀 Starting fresh CSV import...');
  console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`);

  await assertImportSchemaReady();
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
  }

  const results: CSVRow[] = [];
  
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data: CSVRow) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`📊 Processing ${results.length} field definitions...`);
          
          // Organize data
          const categoriesMap = new Map<string, any>();
          const subcategoriesMap = new Map<string, any>();
          const formFields: any[] = [];
          
          // Process each row
          for (const row of results) {
            const categoryName = row.Category.trim();
            const subcategoryName = row['Sub Category'].trim();
            const categoryId = generateCategoryId(categoryName);
            const subcategoryId = generateSubcategoryId(subcategoryName, categoryId);
            
            // Collect category
            if (!categoriesMap.has(categoryId)) {
              categoriesMap.set(categoryId, {
                id: categoryId,
                name: categoryName,
                description: `${categoryName} related tickets`,
                icon: getCategoryIcon(categoryName),
                color: getCategoryColor(categoryName),
                default_department: null,
                is_active: true,
              });
            }
            
            // Collect subcategory
            if (!subcategoriesMap.has(subcategoryId)) {
              subcategoriesMap.set(subcategoryId, {
                id: subcategoryId,
                category_id: categoryId,
                name: subcategoryName,
                description: `${subcategoryName} in ${categoryName}`,
                form_fields: { fields: [] },
                default_department: null,
                is_active: true,
              });
            }
            
            // Process form field
            const options = parseOptions(row['Options/Other Details']);
            const fieldData = {
              id: row['Unique ID'],
              label: row.Label?.trim() || '',
              field_type: mapFieldType(row['Field Type']),
              options: options,
              sub_category: subcategoryId,
              category: categoryId,
              unique_id: row['Unique ID'],
              description: row.Description || '',
              is_required: row['Is Required']?.toLowerCase() === 'yes',
              is_hidden: row['Is Hidden']?.toLowerCase() === 'yes',
              validation: null,
              order_index: getTrailingNumber(row['Unique ID']),
              is_active: true,
            };
            
            formFields.push(fieldData);
          }
          
          // Import to database
          console.log('📝 Importing categories...');
          const categories = Array.from(categoriesMap.values());
          const { error: categoriesError } = await supabase
            .from('categories')
            .upsert(categories, { onConflict: 'id' });
          
          if (categoriesError) {
            console.error('Categories error:', categoriesError);
            throw categoriesError;
          }
          console.log(`   ✅ Imported ${categories.length} categories`);
          
          console.log('📁 Importing subcategories...');
          const subcategories = Array.from(subcategoriesMap.values());
          const { error: subcategoriesError } = await supabase
            .from('subcategories')
            .upsert(subcategories, { onConflict: 'id' });
          
          if (subcategoriesError) {
            console.error('Subcategories error:', subcategoriesError);
            throw subcategoriesError;
          }
          console.log(`   ✅ Imported ${subcategories.length} subcategories`);
          
          console.log('📋 Importing form fields in batches...');
          const batchSize = 100;
          for (let i = 0; i < formFields.length; i += batchSize) {
            const batch = formFields.slice(i, i + batchSize);
            const { error: fieldsError } = await supabase
              .from('form_fields')
              .upsert(batch, { onConflict: 'unique_id' });
            
            if (fieldsError) {
              console.error(`Fields batch ${i} error:`, fieldsError);
              throw fieldsError;
            }
            console.log(`   ✅ Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(formFields.length/batchSize)}`);
          }
          
          console.log('✅ Import completed successfully!');
          console.log(`   - ${categories.length} categories imported`);
          console.log(`   - ${subcategories.length} subcategories imported`);
          console.log(`   - ${formFields.length} form fields imported`);
          
          resolve();
        } catch (error) {
          console.error('❌ Import failed:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  importCSVData()
    .then(() => {
      console.log('🎉 Fresh import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export { importCSVData };