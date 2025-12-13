// Seed the database with predefined categories and fields
import { storage } from './storage.js';
import { CATEGORIES, SUB_CATEGORIES } from '../shared/ticket-categories.js';
import { FIELD_DEFINITIONS } from '../shared/field-definitions.js';

export async function seedDatabase() {
  try {
    // Seed categories
    for (const category of CATEGORIES) {
      try {
        await storage.createCategory({
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon
        });
      } catch (error) {
        // Category may already exist, continue
      }
    }
    
    // Seed subcategories
    for (const subCategory of SUB_CATEGORIES) {
      try {
        await storage.createSubcategory({
          categoryId: subCategory.categoryId,
          name: subCategory.name,
          description: subCategory.description
        });
      } catch (error) {
        // Subcategory may already exist, continue
      }
    }
    
    // Verify the data
    const categories = await storage.getCategories();
    const allSubcategories = [];
    for (const category of categories) {
      const subcategories = await storage.getSubcategories(category.id);
      allSubcategories.push(...subcategories);
    }
    
    return {
      success: true,
      counts: {
        categories: categories.length,
        subcategories: allSubcategories.length,
        fieldDefinitions: FIELD_DEFINITIONS.length
      }
    };
  } catch (error) {
    console.error('Database seeding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}