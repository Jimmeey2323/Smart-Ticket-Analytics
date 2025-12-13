import 'dotenv/config';
import { dbReady, db } from '../server/db.js';
import { categories, subcategories, fieldGroups, formFields } from '../shared/schema.js';
import { and, eq } from 'drizzle-orm';
import { P57_TICKET_TEMPLATES } from './p57-ticket-templates.js';

function slugify(input: string): string {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

type EmbeddedField = {
  id: string;
  key: string;
  type: string;
  label: string;
  options?: string[];
  required: boolean;
  description?: string;
  hidden?: boolean;
  placeholder?: string;
};

async function ensureCategoryIdByName(categoryName: string): Promise<string> {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, categoryName));

  if (existing?.id) return existing.id;

  const [created] = await db
    .insert(categories)
    .values({
      name: categoryName,
      description: `${categoryName} templates`,
      isActive: true,
      createdAt: new Date(),
    } as any)
    .returning({ id: categories.id });

  if (!created?.id) throw new Error(`Failed to create category: ${categoryName}`);
  return created.id;
}

async function ensureSubcategoryIds(categoryId: string, subcategoryName: string, description?: string) {
  const existing = await db
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.name, subcategoryName)));

  if (existing.length > 0) {
    return existing.map((r) => r.id);
  }

  const [created] = await db
    .insert(subcategories)
    .values({
      categoryId,
      name: subcategoryName,
      description: description ?? null,
      isActive: true,
      createdAt: new Date(),
    } as any)
    .returning({ id: subcategories.id });

  if (!created?.id) throw new Error(`Failed to create subcategory: ${subcategoryName}`);
  return [created.id];
}

async function main() {
  await dbReady;

  console.log(`🧩 Seeding ${P57_TICKET_TEMPLATES.length} Physique 57 ticket templates...`);

  for (const template of P57_TICKET_TEMPLATES) {
    const categoryId = await ensureCategoryIdByName(template.categoryName);
    const subcategoryIds = await ensureSubcategoryIds(categoryId, template.subcategoryName, template.subcategoryDescription);

    // Build embedded fields array in display order
    const embeddedFields: EmbeddedField[] = [];
    for (const section of template.sections) {
      for (const f of section.fields) {
        embeddedFields.push({
          id: f.id,
          key: slugify(f.label) || slugify(f.id) || f.id,
          type: f.fieldType,
          label: f.label,
          options: f.options,
          required: Boolean(f.isRequired),
          hidden: Boolean(f.isHidden ?? false),
          description: f.description,
          placeholder: f.fieldType === 'Dropdown' ? `Select ${f.label}` : `Enter ${f.label.toLowerCase()}...`,
        });

        // Also upsert into admin form_fields table for visibility in Settings
        await db
          .insert(formFields)
          .values({
            id: f.id,
            label: f.label,
            fieldType: f.fieldType,
            options: f.options ?? null,
            subCategory: template.subcategoryName,
            category: template.categoryName,
            uniqueId: f.id,
            description: f.description,
            isRequired: Boolean(f.isRequired),
            isHidden: Boolean(f.isHidden ?? false),
            orderIndex: embeddedFields.length - 1,
            isActive: true,
            updatedAt: new Date(),
            createdAt: new Date(),
          } as any)
          .onConflictDoUpdate({
            target: formFields.id,
            set: {
              label: f.label,
              fieldType: f.fieldType,
              options: f.options ?? null,
              subCategory: template.subcategoryName,
              category: template.categoryName,
              description: f.description,
              isRequired: Boolean(f.isRequired),
              isHidden: Boolean(f.isHidden ?? false),
              orderIndex: embeddedFields.length - 1,
              isActive: true,
              updatedAt: new Date(),
            } as any,
          });
      }
    }

    // Update all duplicates (if any) so UI always picks the richest schema
    for (const subcategoryId of subcategoryIds) {
      await db
        .update(subcategories)
        .set({
          description: template.subcategoryDescription ?? null,
          formFields: { fields: embeddedFields },
        } as any)
        .where(eq(subcategories.id, subcategoryId));

      // Upsert field groups per section for accordion headers
      for (let i = 0; i < template.sections.length; i++) {
        const section = template.sections[i];
        const groupId = `p57tmpl-${slugify(template.subcategoryName)}-${slugify(section.name)}`;
        const fieldIds = section.fields.map((f) => f.id);

        await db
          .insert(fieldGroups)
          .values({
            id: groupId,
            name: section.name,
            categoryId,
            subCategoryId: subcategoryId,
            fieldIds,
            orderIndex: i,
            isCollapsible: true,
            isCollapsedByDefault: false,
            createdAt: new Date(),
          } as any)
          .onConflictDoUpdate({
            target: fieldGroups.id,
            set: {
              name: section.name,
              categoryId,
              subCategoryId: subcategoryId,
              fieldIds,
              orderIndex: i,
              isCollapsible: true,
              isCollapsedByDefault: false,
            } as any,
          });
      }
    }

    console.log(`✅ Seeded template: ${template.subcategoryName} → ${template.categoryName}`);
  }

  console.log('🎉 Done. Templates are now available in Create Ticket.');
}

main().catch((err) => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
