# Fresh Setup Guide for Smart Ticket Analytics

This guide provides complete scripts to set up your database and import all field data from scratch.

## 📋 Files Created

1. **`script/sql/fresh_supabase_setup.sql`** - Complete database setup script
2. **`script/fresh-import.ts`** - TypeScript script to import CSV data
3. **`script/fresh-setup.sh`** - Automated setup script
4. **Package.json scripts** - Added `fresh-import` and `fresh-setup` commands

## 🚀 Quick Start

### Step 1: Set Environment Variables

```bash
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-publishable-key-here"
```

### Step 2: Run Database Setup

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the entire contents of `script/sql/fresh_supabase_setup.sql`
3. Click "Run" to execute the script

### Step 3: Import Data

```bash
npm run fresh-import
```

OR run the complete automated setup:

```bash
npm run fresh-setup
```

## 📊 What Gets Set Up

### Database Tables
- ✅ `users` - User management
- ✅ `teams` - Team organization  
- ✅ `categories` - Ticket categories (updated existing)
- ✅ `subcategories` - Ticket subcategories (updated existing)
- ✅ `form_fields` - Dynamic form fields (NEW TABLE)
- ✅ `tickets` - Main tickets table
- ✅ `ticket_responses` - Comments/responses
- ✅ `ticket_attachments` - File attachments

### Data Import
- ✅ **961+ form fields** from your CSV file
- ✅ **Categories** mapped and enhanced with icons/colors
- ✅ **Subcategories** with proper relationships
- ✅ **Global fields** that apply to all tickets
- ✅ **Proper indexing** for performance

### Key Features
- ✅ **UUID primary keys** for all entities
- ✅ **Proper foreign key relationships**
- ✅ **JSONB fields** for flexible form data storage
- ✅ **Row Level Security** enabled
- ✅ **Performance indexes** on key fields
- ✅ **Enum types** for status/priority/roles

## 🔧 Manual Steps

If you prefer to run steps manually:

1. **Database Setup:**
   ```sql
   -- Copy/paste script/sql/fresh_supabase_setup.sql into Supabase SQL Editor
   ```

2. **Import CSV Data:**
   ```bash
   npx tsx script/fresh-import.ts
   ```

## 📝 Verification

After setup, verify in Supabase dashboard:

1. Check `categories` table has 8-12 categories with icons/colors
2. Check `subcategories` table has 100+ subcategories
3. Check `form_fields` table has 961+ fields
4. Test a few queries to ensure relationships work

## 🛠️ Troubleshooting

**CSV file not found:**
- Ensure `attached_assets/fields_1765467205072.csv` exists

**Environment variables missing:**
- Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`

**Import errors:**
- Check Supabase logs in dashboard
- Verify SQL setup ran successfully first

**Performance issues:**
- All necessary indexes are created automatically
- Form fields are batched during import (100 per batch)

## 🎯 Next Steps

After successful setup:

1. Start development server: `npm run dev`
2. Test ticket creation with dynamic forms
3. Verify all field types render correctly
4. Check category/subcategory filtering works
5. Test form validation rules

Your Smart Ticket Analytics system will now have:
- Complete database schema
- All 961+ fields from your CSV
- Proper relationships and performance optimization
- Ready for production use