#!/usr/bin/env node
// Simple test script to populate mock storage and test the frontend
import { storage } from './server/storage.js';
import { CATEGORIES, SUB_CATEGORIES } from './shared/ticket-categories.js';

async function testSeed() {
  console.log('🌱 Starting test seeding...');
  
  try {
    // Test categories
    console.log('📂 Testing categories...');
    for (const category of CATEGORIES) {
      try {
        const created = await storage.createCategory({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon
        });
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.warn(`⚠️  Category ${category.name}:`, error.message);
      }
    }
    
    // Test subcategories
    console.log('📁 Testing subcategories...');
    for (const subCategory of SUB_CATEGORIES) {
      try {
        const created = await storage.createSubcategory({
          id: subCategory.id,
          categoryId: subCategory.categoryId,
          name: subCategory.name,
          description: subCategory.description
        });
        console.log(`✅ Created subcategory: ${subCategory.name}`);
      } catch (error) {
        console.warn(`⚠️  Subcategory ${subCategory.name}:`, error.message);
      }
    }
    
    // Verify
    const categories = await storage.getCategories();
    console.log(`\n📊 Final count: ${categories.length} categories`);
    
    for (const category of categories) {
      const subcategories = await storage.getSubcategories(category.id);
      console.log(`   - ${category.name}: ${subcategories.length} subcategories`);
    }
    
    console.log('\n🎉 Test seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Test seeding failed:', error);
  }
}

testSeed();