#!/bin/bash

# FRESH SETUP SCRIPT
# This script sets up everything from scratch

set -e  # Exit on any error

echo "🚀 Starting fresh Smart Ticket Analytics setup..."

# Check if required files exist
if [ ! -f "attached_assets/fields_1765467205072.csv" ]; then
    echo "❌ CSV file not found: attached_assets/fields_1765467205072.csv"
    echo "   Please ensure the CSV file is in the attached_assets directory"
    exit 1
fi

# Check environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable"
    exit 1
fi

if [ -z "$SUPABASE_PUBLISHABLE_KEY" ] && [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY environment variable"
    exit 1
fi

echo "✅ Environment variables configured"
echo "✅ CSV file found"

echo ""
echo "📋 SETUP INSTRUCTIONS:"
echo "1. First, run the SQL setup script in your Supabase dashboard:"
echo "   - Go to your Supabase project dashboard"
echo "   - Click on 'SQL Editor' in the sidebar"
echo "   - Copy and paste the contents of: script/sql/fresh_supabase_setup.sql"
echo "   - Click 'Run' to execute the script"
echo ""
echo "2. After the SQL setup is complete, run the import script:"
echo "   npm run fresh-import"
echo ""
echo "🔗 Supabase Dashboard: $SUPABASE_URL"
echo ""
echo "Press ENTER when you have completed step 1 (SQL setup in Supabase dashboard)..."
read

echo "🔄 Running CSV import script..."
npx tsx script/fresh-import.ts

echo ""
echo "🎉 Fresh setup completed!"
echo ""
echo "📊 What was set up:"
echo "   ✅ Database tables created/updated"
echo "   ✅ Categories imported and mapped"
echo "   ✅ Subcategories imported with form field structure"
echo "   ✅ All 961+ form fields imported from CSV"
echo "   ✅ Proper relationships and indexes created"
echo ""
echo "🚀 Your Smart Ticket Analytics system is ready!"
echo ""
echo "Next steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Open your app and test the ticket creation flow"
echo "   3. Check that all form fields are loading correctly"