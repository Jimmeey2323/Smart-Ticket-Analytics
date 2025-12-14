#!/bin/bash

# ============================================================================
# QUICK START GUIDE FOR DEPARTMENTS, TEAMS & ROUTING SYSTEM
# ============================================================================

echo "🚀 Smart Ticket Analytics - Departments & Teams Setup"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable not set${NC}"
    exit 1
fi

echo -e "${BLUE}1️⃣  Running database migrations...${NC}"
# This would run Drizzle migrations if you're using them
# npm run db:migrate

echo -e "${YELLOW}⏳ Executing SQL setup script...${NC}"
psql "$DATABASE_URL" < script/departments-teams-setup.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SQL setup completed${NC}"
else
    echo -e "${RED}❌ SQL setup failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2️⃣  Seeding departments and teams...${NC}"
npx ts-node script/seed-departments-teams.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seeding completed${NC}"
else
    echo -e "${RED}❌ Seeding failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Update your server/index.ts to include department routes:"
echo "     import departmentRoutes from './routes-departments';"
echo "     app.use('/api', departmentRoutes);"
echo ""
echo "  2. Run the development server:"
echo "     npm run dev"
echo ""
echo "  3. Access the API endpoints:"
echo "     GET  /api/departments"
echo "     GET  /api/teams"
echo "     GET  /api/team-members"
echo "     GET  /api/routing-rules"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  📖 See DEPARTMENTS_TEAMS_ROUTING.md for comprehensive documentation"
echo ""
