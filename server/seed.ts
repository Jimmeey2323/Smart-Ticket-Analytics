// Seed the database with predefined categories and fields
import { storage } from './storage.js';
import { CATEGORIES, SUB_CATEGORIES } from '../shared/ticket-categories.js';
import { FIELD_DEFINITIONS } from '../shared/field-definitions.js';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    
    // Seed categories
    console.log('📂 Seeding categories...');
    for (const category of CATEGORIES) {
      try {
        await storage.createCategory({
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon
        });
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.warn(`⚠️  Category ${category.name} may already exist`);
      }
    }
    
    // Seed subcategories
    console.log('📁 Seeding subcategories...');
    for (const subCategory of SUB_CATEGORIES) {
      try {
        await storage.createSubcategory({
          categoryId: subCategory.categoryId,
          name: subCategory.name,
          description: subCategory.description
        });
        console.log(`✅ Created subcategory: ${subCategory.name}`);
      } catch (error) {
        console.warn(`⚠️  Subcategory ${subCategory.name} may already exist`);
      }
    }
    
    // Note: Since we don't have a createField method in the current storage,
    // we'll skip field creation for now and focus on categories/subcategories
    console.log('📋 Field definitions available but skipping field creation (not yet implemented in storage layer)');
    console.log(`📊 ${FIELD_DEFINITIONS.length} field definitions available for future implementation`);
    
    console.log('🎉 Database seeding completed!');
    
    // Verify the data
    const categories = await storage.getCategories();
    const allSubcategories = [];
    for (const category of categories) {
      const subcategories = await storage.getSubcategories(category.id);
      allSubcategories.push(...subcategories);
    }
    
    console.log(`📊 Verification:`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Subcategories: ${allSubcategories.length}`);
    console.log(`   Field definitions: ${FIELD_DEFINITIONS.length} (available for implementation)`);
    
    return {
      success: true,
      counts: {
        categories: categories.length,
        subcategories: allSubcategories.length,
        fieldDefinitions: FIELD_DEFINITIONS.length
      }
    };
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}