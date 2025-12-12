# 🚀 Complete Fresh Supabase Setup Instructions

## Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `Smart Ticket Analytics` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait 2-3 minutes for project initialization

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL** (e.g., `https://abcdefghijk.supabase.co`)
   - **Project API Keys**:
     - `anon public` key (this is your publishable key)

## Step 3: Set Up Environment Variables

Update your `.env` file with your new project credentials:

```bash
# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key-here"
VITE_SUPABASE_ANON_KEY="your-publishable-key-here"
DATABASE_URL="postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres"

# Optional - for development
NODE_ENV=development
```

## Step 4: Run the Database Setup Script

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Copy the entire contents of `script/sql/fresh_supabase_setup.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

This will create:
- All necessary tables (users, categories, subcategories, form_fields, tickets, etc.)
- Proper relationships and foreign keys
- Performance indexes
- Sample global fields

## Step 5: Import Your CSV Data

Set your environment variables and run the import:

```bash
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
npm run fresh-import
```

OR use the automated setup script:

```bash
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
npm run fresh-setup
```

## Step 6: Verify the Setup

1. In Supabase dashboard, go to **Table Editor**
2. Check these tables exist and have data:
   - `categories` - Should have 8-12 categories with icons/colors
   - `subcategories` - Should have 100+ subcategories  
   - `form_fields` - Should have 961+ fields from your CSV
   - `users`, `teams`, `tickets` tables should exist (empty for now)

## Step 7: Test Your Application

```bash
# Start your development server
npm run dev
```

Navigate to your app and test:
- Create a new ticket
- Verify categories load correctly
- Check that form fields appear dynamically
- Test different subcategories show different fields

## 🔍 What You'll Get

- **Clean database** with proper UUID primary keys
- **All 961+ fields** from your CSV properly imported
- **Dynamic forms** that load fields based on category/subcategory selection
- **Proper relationships** between categories, subcategories, and fields
- **Performance optimized** with all necessary indexes
- **Secure** with publishable key authentication

## 🚨 Important Notes

- **Save your database password** - you'll need it for the DATABASE_URL
- **Use publishable key** - no need for service role key for this setup
- **The publishable key is safe** to use in frontend code
- **Run the SQL script first** before the import script
- **Check the CSV file exists** at `attached_assets/fields_1765467205072.csv`

## 🛠️ Troubleshooting

**CSV file not found:**
- Ensure `attached_assets/fields_1765467205072.csv` exists

**Environment variables missing:**
- Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`

**Import errors:**
- Check Supabase logs in dashboard
- Verify SQL setup ran successfully first

**Authentication errors:**
- Ensure you're using the publishable key (not service role key)
- Check that RLS policies allow your operations

This setup will give you a completely fresh, properly structured database with all your real data and optimal performance for your Smart Ticket Analytics system using modern Supabase best practices.