// CSV Import Utility for Field Definitions
import 'dotenv/config';
import fs from 'fs';
import csv from 'csv-parser';
import dns from 'dns/promises';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql as drizzleSql, eq } from 'drizzle-orm';
import { db as serverDb } from '../server/db';
import { categories, subcategories } from '../shared/schema';
import { CATEGORIES, SUB_CATEGORIES } from '../shared/ticket-categories';
import { FIELD_DEFINITIONS } from '../shared/field-definitions';

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

interface CategorySubcategoryRow {
  Category: string;
  'Sub Category': string;
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function ensureDb() {
  // Prefer server db if available
  if (serverDb) return serverDb;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  // Try connect with retries and IPv4 fallback
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const sql = postgres(databaseUrl, { max: 5 });
      const localDb = drizzle(sql);
      // Quick smoke-test
      await localDb.select().from(categories).limit(1);
      console.log('✅ Database connected successfully');
      return localDb;
    } catch (err: any) {
      lastErr = err;
      // If network unreachable related to IPv6, try resolving A records and retry with IPv4 host replacement
      if (err && (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH' || err.message?.includes('EHOSTUNREACH'))) {
        try {
          const parsed = new URL(databaseUrl);
          const hostname = parsed.hostname;
          console.log(`⚠️ Network error connecting to DB host ${hostname}, resolving A records...`);
          const addrs = await dns.resolve4(hostname);
          if (addrs && addrs.length > 0) {
            parsed.hostname = addrs[0];
            const ipv4Url = parsed.toString();
            console.log('🔁 Retrying DB connection with IPv4 address:', addrs[0]);
            const sql = postgres(ipv4Url, { max: 5 });
            const localDb = drizzle(sql);
            await localDb.select().from(categories).limit(1);
            console.log('✅ Database connected successfully (via IPv4)');
            return localDb;
          }
        } catch (dnsErr) {
          console.warn('⚠️ IPv4 fallback failed:', dnsErr instanceof Error ? dnsErr.message : dnsErr);
        }
      }

      const backoff = attempt * 500;
      console.log(`Retrying DB connection in ${backoff}ms (attempt ${attempt}/4)...`);
      await sleep(backoff);
    }
  }

  throw lastErr || new Error('Failed to connect to database');
}

export async function importCategoriesAndFields() {
  console.log('🚀 Starting import of categories, subcategories, and fields...');

  try {
    // 1. Try to use a direct DB connection first (no mock fallback)
    let activeDb: any = null;
    try {
      activeDb = await ensureDb();
    } catch (dbErr) {
      console.warn('⚠️ Direct DB connection failed, will try Supabase REST API as a non-mock fallback:', dbErr instanceof Error ? dbErr.message : dbErr);
    }

    // Helper: perform REST upsert to Supabase (PostgREST) using service role key
    async function upsertViaRest(table: string, rows: any[], on_conflict: string) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
      const endpoint = `${supabaseUrl.replace(/\/$/,'')}/rest/v1/${table}?on_conflict=${on_conflict}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(rows)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase REST upsert failed (${res.status}): ${text}`);
      }
      return res.json();
    }

    // Helper: Map our categories to existing database categories
    function mapCategoryToExisting(ourCategory: { id?: string; name?: string }) {
      const categoryMapping: Record<string, string> = {
        global: 'Miscellaneous', // Global -> Miscellaneous
        'booking-technology': 'Booking & Technology',
        'customer-service': 'Customer Service',
        'facilities-equipment': 'Facility & Amenities',
        'class-instruction': 'Class Experience',
        'membership-billing': 'Membership & Billing',
        'health-safety': 'Health & Safety',
        miscellaneous: 'Miscellaneous',
      };

      if (ourCategory.id && categoryMapping[ourCategory.id]) return categoryMapping[ourCategory.id];
      return ourCategory.name ?? ourCategory.id ?? 'Miscellaneous';
    }
    
    // Helper: Get existing category ID by name
    async function getExistingCategoryId(categoryName: string) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) return null;
      
      const endpoint = `${supabaseUrl.replace(/\/$/,'')}/rest/v1/categories?select=id,name&name=eq.${encodeURIComponent(categoryName)}`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      });
      
      if (res.ok) {
        const results = await res.json();
        return results.length > 0 ? results[0].id : null;
      }
      return null;
    }

    // 2. Update existing categories with metadata instead of inserting new ones
    console.log('📝 Updating existing categories with metadata...');
    for (const category of CATEGORIES) {
      const existingName = mapCategoryToExisting(category);
      const existingId = await getExistingCategoryId(existingName);
      
      if (existingId) {
        const updateData = {
          description: category.description,
          icon: category.icon,
          color_code: category.color
        };
        
        if (activeDb) {
          // Direct DB update (if connection works)
          await activeDb.update(categories).set(updateData).where(eq(categories.id, existingId));
        } else {
          // REST API update 
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/categories?id=eq.${existingId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
            },
            body: JSON.stringify(updateData)
          });
        }
        console.log(`   ✅ Updated ${existingName} with metadata`);
      } else {
        console.log(`   ⚠️ No existing category found for: ${existingName}`);
      }
    }

    // 3. Process subcategories with embedded form fields (using existing category IDs)
    console.log('📁 Processing subcategories and form fields...');
    for (const subCategory of SUB_CATEGORIES) {
      // Map our category to existing database category
      const existingCategoryName = mapCategoryToExisting({ id: subCategory.categoryId, name: subCategory.categoryId });
      const existingCategoryId = await getExistingCategoryId(existingCategoryName);
      
      if (!existingCategoryId) {
        console.log(`   ⚠️ Skipping subcategory ${subCategory.name} - no matching category found`);
        continue;
      }
      
      // Get all fields for this subcategory from our FIELD_DEFINITIONS
      const subCategoryFields = FIELD_DEFINITIONS.filter(field => 
        field.subCategory === subCategory.name ||
        field.subCategory === subCategory.id ||
        (field.category && mapCategoryToExisting({ id: field.category, name: field.category }) === existingCategoryName)
      );
      
      // Convert to the embedded format expected by the existing schema
      const embeddedFields = {
        fields: subCategoryFields.map(field => ({
          id: field.uniqueId,
          key: field.label.toLowerCase().replace(/[^a-z0-9]/g, ''),
          type: mapFieldType(field.fieldType),
          label: field.label,
          options: field.options,
          required: field.isRequired,
          description: field.description,
          placeholder: `Enter ${field.label.toLowerCase()}...`
        }))
      };
      
      const subCatData = {
        category_id: existingCategoryId, // Use the actual existing category ID
        name: subCategory.name,
        description: subCategory.description,
        form_fields: embeddedFields,
        is_active: true,
      };
      
      if (activeDb) {
        // For direct DB - we need to check if subcategory exists first
        try {
          await activeDb.insert(subcategories).values(subCatData);
        } catch (err: any) {
          // If conflict, do update
          if (err.message?.includes('duplicate key')) {
            await activeDb.update(subcategories)
              .set({ form_fields: subCatData.form_fields, description: subCatData.description })
              .where(eq(subcategories.name, subCatData.name));
          } else {
            throw err;
          }
        }
      } else {
        // For REST API - use upsert by name+category_id
        try {
          await upsertViaRest('subcategories', [subCatData], 'name,category_id');
        } catch (restErr: any) {
          // If upsert fails, try regular insert
          const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/subcategories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(subCatData)
          });
          if (!res.ok && !res.status.toString().startsWith('409')) {
            const errorText = await res.text();
            console.warn(`   ⚠️ Could not insert subcategory ${subCategory.name}: ${errorText}`);
          }
        }
      }
      
      console.log(`   ✅ Processed ${subCategory.name} with ${subCategoryFields.length} fields`);
    }


    console.log('✅ Import completed successfully!');
    console.log(`   - ${CATEGORIES.length} categories imported`);
    console.log(`   - ${SUB_CATEGORIES.length} subcategories with embedded fields imported`);
    console.log(`   - ${FIELD_DEFINITIONS.length} form fields processed`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

export async function importFromCSV(csvFilePath: string) {
  console.log(`📥 Importing field definitions from CSV: ${csvFilePath}`);

  const results: CSVRow[] = [];

  return new Promise(async (resolve, reject) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
      }
      const serviceKeyStr: string = serviceKey;

      async function restGet(pathAndQuery: string) {
        const res = await fetch(`${supabaseUrl}${pathAndQuery}`, {
          headers: {
            apikey: serviceKeyStr,
            Authorization: `Bearer ${serviceKeyStr}`,
          } as Record<string, string>,
        });
        if (!res.ok) throw new Error(`Supabase REST GET failed (${res.status}): ${await res.text()}`);
        return res.json();
      }

      async function restPatch(pathAndQuery: string, body: unknown) {
        const res = await fetch(`${supabaseUrl}${pathAndQuery}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKeyStr,
            Authorization: `Bearer ${serviceKeyStr}`,
          } as Record<string, string>,
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Supabase REST PATCH failed (${res.status}): ${await res.text()}`);
      }

      async function restPost(pathAndQuery: string, body: unknown) {
        const res = await fetch(`${supabaseUrl}${pathAndQuery}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKeyStr,
            Authorization: `Bearer ${serviceKeyStr}`,
            Prefer: 'return=representation',
          } as Record<string, string>,
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Supabase REST POST failed (${res.status}): ${await res.text()}`);
        return res.json();
      }
      
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data: CSVRow) => results.push(data))
        .on('end', async () => {
          try {
          console.log(`📊 Processing ${results.length} field definitions...`);

          // Group by categories and subcategories
          const categoriesMap = new Map<string, { name: string; description: string; color_code: string; icon: string }>();
          const subCategoriesMap = new Map<string, { categoryName: string; name: string; description: string; fieldIds: string[] }>();
          const fieldsBySubCatKey = new Map<string, any[]>();

          for (const row of results) {
            const categoryName = (row.Category || '').trim();
            const subCategoryName = (row['Sub Category'] || '').trim();
            const uniqueId = (row['Unique ID'] || '').trim();
            if (!categoryName || !subCategoryName || !uniqueId) continue;

            // Extract category info
            if (!categoriesMap.has(categoryName.toLowerCase())) {
              categoriesMap.set(categoryName.toLowerCase(), {
                name: categoryName,
                description: `${categoryName} related tickets`,
                color_code: getColorForCategory(categoryName),
                icon: getIconForCategory(categoryName),
              });
            }

            // Extract subcategory info
            const subCategoryKey = `${categoryName}||${subCategoryName}`;
            if (!subCategoriesMap.has(subCategoryKey)) {
              subCategoriesMap.set(subCategoryKey, {
                categoryName,
                name: subCategoryName,
                description: `${subCategoryName} in ${categoryName}`,
                fieldIds: [],
              });
            }

            // Add field to subcategory
            subCategoriesMap.get(subCategoryKey)!.fieldIds.push(uniqueId);

            // Extract field definition
            const rawOptions = (row['Options/Other Details'] || '').trim();
            const options = rawOptions
              ? rawOptions === 'Yes/No'
                ? ['Yes', 'No']
                : rawOptions.includes(' | ')
                  ? rawOptions.split(' | ').map(s => s.trim()).filter(Boolean)
                  : null
              : null;

            const orderIndexMatch = uniqueId.match(/(\d+)$/);
            const orderIndex = orderIndexMatch ? Number(orderIndexMatch[1]) : 0;

            const embeddedField = {
              id: uniqueId,
              key: uniqueId.toLowerCase().replace(/[^a-z0-9]/g, ''),
              type: mapFieldType(row['Field Type'] || ''),
              label: (row.Label || '').trim(),
              options,
              required: (row['Is Required'] || '').trim().toLowerCase() === 'yes',
              hidden: (row['Is Hidden'] || '').trim().toLowerCase() === 'yes',
              description: (row.Description || '').trim(),
              placeholder: `Enter ${(row.Label || '').trim().toLowerCase()}...`,
              orderIndex,
              validation: generateValidationRules(row),
            };

            const list = fieldsBySubCatKey.get(subCategoryKey) ?? [];
            list.push(embeddedField);
            fieldsBySubCatKey.set(subCategoryKey, list);
          }

          // Fetch existing categories once
          const existingCategories: Array<{ id: string; name: string }> = await restGet('/rest/v1/categories?select=id,name');
          const categoryIdByName = new Map<string, string>();
          for (const c of existingCategories) {
            if (c?.id && c?.name) categoryIdByName.set(String(c.name).trim().toLowerCase(), String(c.id));
          }

          // Ensure categories exist (update if present, insert if missing)
          for (const category of categoriesMap.values()) {
            const key = category.name.trim().toLowerCase();
            const existingId = categoryIdByName.get(key);
            if (existingId) {
              await restPatch(`/rest/v1/categories?id=eq.${existingId}`, {
                description: category.description,
                icon: category.icon,
                color_code: category.color_code,
              });
            } else {
              const created = await restPost('/rest/v1/categories', [{
                name: category.name,
                description: category.description,
                icon: category.icon,
                color_code: category.color_code,
                is_active: true,
              }]);
              const newId = created?.[0]?.id;
              if (newId) categoryIdByName.set(key, String(newId));
            }
          }

          // Fetch existing subcategories once
          const existingSubCategories: Array<{ id: string; name: string; category_id: string }> = await restGet('/rest/v1/subcategories?select=id,name,category_id');
          const subCatKeyToId = new Map<string, string>();
          for (const sc of existingSubCategories) {
            const name = String(sc?.name ?? '').trim();
            const catId = String(sc?.category_id ?? '').trim();
            if (sc?.id && name && catId) subCatKeyToId.set(`${catId}||${name.toLowerCase()}`, String(sc.id));
          }

          // Insert/update subcategories with embedded fields
          for (const [subCategoryKey, subCategory] of subCategoriesMap.entries()) {
            const categoryId = categoryIdByName.get(subCategory.categoryName.trim().toLowerCase());
            if (!categoryId) continue;

            const fieldsForSubCat = fieldsBySubCatKey.get(subCategoryKey) ?? [];
            const embeddedFields = {
              fields: fieldsForSubCat.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
            };
            
            // Debug logging
            if (subCategoryKey.includes('Global')) {
              console.log(`  [DEBUG] Processing ${subCategoryKey}: found ${fieldsForSubCat.length} fields`);
            }

            // Look up existing subcategory - try both the categoryId format and search by name+categoryId
            let existingSubId = subCatKeyToId.get(`${categoryId}||${subCategory.name.trim().toLowerCase()}`);
            
            // If not found, try to find it by searching existing subcategories by name only
            if (!existingSubId) {
              for (const [key, subId] of subCatKeyToId.entries()) {
                const [_, namePart] = key.split('||');
                if (namePart === subCategory.name.trim().toLowerCase()) {
                  // Found a subcategory with the same name, use it
                  existingSubId = subId;
                  if (subCategoryKey.includes('Global')) {
                    console.log(`  [DEBUG] Found existing by name match: ${key} -> ${subId}`);
                  }
                  break;
                }
              }
            }
            const payload = {
              category_id: categoryId,
              name: subCategory.name,
              description: subCategory.description,
              form_fields: embeddedFields,
              is_active: true,
            };

            if (existingSubId) {
              await restPatch(`/rest/v1/subcategories?id=eq.${existingSubId}`, {
                description: payload.description,
                form_fields: payload.form_fields,
                is_active: payload.is_active,
              });
            } else {
              const created = await restPost('/rest/v1/subcategories', [payload]);
              const newId = created?.[0]?.id;
              if (newId) subCatKeyToId.set(`${categoryId}||${subCategory.name.trim().toLowerCase()}`, String(newId));
            }
          }

          console.log('✅ CSV import completed successfully!');
          console.log(`   - ${categoriesMap.size} categories`);
          console.log(`   - ${subCategoriesMap.size} subcategories`);
          console.log(`   - ${results.length} fields`);

          resolve(results);
        } catch (error) {
          console.error('❌ CSV import failed:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ Failed to start CSV import:', error);
      reject(error);
    }
  });
}

export async function importCategorySubcategoryList(csvFilePath: string) {
  console.log(`📥 Importing category/subcategory list from CSV: ${csvFilePath}`);

  const rows: CategorySubcategoryRow[] = [];

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  const serviceKeyStr: string = serviceKey;

  async function restGet(pathAndQuery: string) {
    const res = await fetch(`${supabaseUrl}${pathAndQuery}`, {
      headers: {
        apikey: serviceKeyStr,
        Authorization: `Bearer ${serviceKeyStr}`,
      } as Record<string, string>,
    });
    if (!res.ok) throw new Error(`Supabase REST GET failed (${res.status}): ${await res.text()}`);
    return res.json();
  }

  async function restPatch(pathAndQuery: string, body: unknown) {
    const res = await fetch(`${supabaseUrl}${pathAndQuery}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKeyStr,
        Authorization: `Bearer ${serviceKeyStr}`,
      } as Record<string, string>,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Supabase REST PATCH failed (${res.status}): ${await res.text()}`);
  }

  async function restPost(pathAndQuery: string, body: unknown) {
    const res = await fetch(`${supabaseUrl}${pathAndQuery}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKeyStr,
        Authorization: `Bearer ${serviceKeyStr}`,
        Prefer: 'return=representation',
      } as Record<string, string>,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Supabase REST POST failed (${res.status}): ${await res.text()}`);
    return res.json();
  }

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: any) => rows.push(data as CategorySubcategoryRow))
      .on('end', async () => {
        try {
          console.log(`📊 Processing ${rows.length} category/subcategory rows...`);

          // Fetch existing categories + subcategories
          const existingCategories: Array<{ id: string; name: string }> = await restGet('/rest/v1/categories?select=id,name');
          const categoryIdByName = new Map<string, string>();
          for (const c of existingCategories) {
            if (c?.id && c?.name) categoryIdByName.set(String(c.name).trim().toLowerCase(), String(c.id));
          }

          const existingSubCategories: Array<{ id: string; name: string; category_id: string }> = await restGet('/rest/v1/subcategories?select=id,name,category_id');
          const subCatKeyToId = new Map<string, string>();
          for (const sc of existingSubCategories) {
            const name = String(sc?.name ?? '').trim();
            const catId = String(sc?.category_id ?? '').trim();
            if (sc?.id && name && catId) subCatKeyToId.set(`${catId}||${name.toLowerCase()}`, String(sc.id));
          }

          // De-dupe input
          const wanted = new Map<string, { category: string; subCategory: string }>();
          for (const r of rows) {
            const category = String(r.Category ?? '').trim();
            const subCategory = String((r as any)['Sub Category'] ?? '').trim();
            if (!category || !subCategory) continue;
            wanted.set(`${category.toLowerCase()}||${subCategory.toLowerCase()}`, { category, subCategory });
          }

          // Ensure categories exist
          for (const { category } of wanted.values()) {
            const key = category.toLowerCase();
            if (categoryIdByName.has(key)) continue;

            const created = await restPost('/rest/v1/categories', [{
              name: category,
              description: `${category} related tickets`,
              icon: getIconForCategory(category),
              color_code: getColorForCategory(category),
              is_active: true,
            }]);
            const newId = created?.[0]?.id;
            if (newId) categoryIdByName.set(key, String(newId));
          }

          // Ensure subcategories exist (with empty fields if missing)
          let createdSub = 0;
          let updatedSub = 0;

          for (const { category, subCategory } of wanted.values()) {
            const categoryId = categoryIdByName.get(category.toLowerCase());
            if (!categoryId) continue;

            const subKey = `${categoryId}||${subCategory.toLowerCase()}`;
            const existingId = subCatKeyToId.get(subKey);
            const payload = {
              category_id: categoryId,
              name: subCategory,
              description: `${subCategory} in ${category}`,
              form_fields: { fields: [] },
              is_active: true,
            };

            if (existingId) {
              await restPatch(`/rest/v1/subcategories?id=eq.${existingId}`, {
                description: payload.description,
                is_active: payload.is_active,
              });
              updatedSub++;
            } else {
              const created = await restPost('/rest/v1/subcategories', [payload]);
              const newId = created?.[0]?.id;
              if (newId) subCatKeyToId.set(subKey, String(newId));
              createdSub++;
            }
          }

          console.log('✅ Category/subcategory list import completed!');
          console.log(`   - ${categoryIdByName.size} categories (total)`);
          console.log(`   - ${createdSub} subcategories created`);
          console.log(`   - ${updatedSub} subcategories touched`);

          resolve();
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject);
  });
}

// Helper function to map field types to expected format
function mapFieldType(fieldType: string): string {
  const typeMapping: { [key: string]: string } = {
    'Short Text': 'text',
    'Long Text': 'textarea', 
    'Dropdown': 'dropdown',
    'Radio Button': 'radio',
    'Checkbox': 'checkbox',
    'DateTime': 'datetime',
    'Date': 'date',
    'Time': 'time',
    'Email': 'email',
    'Phone': 'tel',
    'Number': 'number',
    'File Upload': 'file',
    'Auto-generated': 'text', // fallback to text for auto-generated
    'Text': 'text'
  };
  
  return typeMapping[fieldType] || 'text';
}

function getColorForCategory(category: string): string {
  const colors: Record<string, string> = {
    Global: '#64748b',
    'Booking & Technology': '#3b82f6',
    'Customer Service': '#10b981',
    'Facilities & Equipment': '#f59e0b',
    'Class & Instruction': '#8b5cf6',
    'Membership & Billing': '#ef4444',
    'Health & Safety': '#dc2626',
    Miscellaneous: '#6b7280',
  };
  return colors[category] ?? '#6b7280';
}

function getIconForCategory(category: string): string {
  const icons: Record<string, string> = {
    Global: 'Globe',
    'Booking & Technology': 'Smartphone',
    'Customer Service': 'Users',
    'Facilities & Equipment': 'Building',
    'Class & Instruction': 'GraduationCap',
    'Membership & Billing': 'CreditCard',
    'Health & Safety': 'Shield',
    Miscellaneous: 'MoreHorizontal',
  };
  return icons[category] ?? 'MoreHorizontal';
}

function generateValidationRules(row: CSVRow): any[] | undefined {
  const rules = [];

  const options = row['Options/Other Details'] ?? '';

  if (row['Field Type'] === 'Long Text' && options.includes('min 50 characters')) {
    rules.push({
      type: 'minLength',
      value: 50,
      message: `${row.Label} must be at least 50 characters`
    });
  }

  if (row['Field Type'] === 'Email') {
    rules.push({
      type: 'pattern',
      value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      message: 'Please enter a valid email address'
    });
  }

  if (row['Field Type'] === 'Phone') {
    rules.push({
      type: 'pattern',
      value: '^[\\d\\s\\+\\-\\(\\)]{10,}$',
      message: 'Please enter a valid phone number'
    });
  }

  return rules.length > 0 ? rules : undefined;
}

// CLI usage
const command = process.argv[2];
const csvPath = process.argv[3];

const defaultClientCsv = 'client/src/lib/fields.csv';

if (command === 'import-predefined') {
  importCategoriesAndFields()
    .then(() => {
      console.log('🎉 Predefined data import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
} else if (command === 'import-csv' && csvPath) {
  importFromCSV(csvPath)
    .then(() => {
      console.log('🎉 CSV import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 CSV import failed:', error);
      process.exit(1);
    });
} else if (command === 'import-client-csv') {
  importFromCSV(defaultClientCsv)
    .then(() => {
      console.log('🎉 Client CSV import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Client CSV import failed:', error);
      process.exit(1);
    });
} else if (command === 'import-subcategory-list' && csvPath) {
  importCategorySubcategoryList(csvPath)
    .then(() => {
      console.log('🎉 Subcategory list import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Subcategory list import failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  npm run import-data import-predefined');
  console.log('  npm run import-data import-csv <path-to-csv>');
  console.log('  npm run import-data import-client-csv');
  console.log('  npm run import-data import-subcategory-list <path-to-csv>');
}