-- ============================================================================
-- POPULATE DEPARTMENTS, TEAMS, AND TEAM MEMBERS FROM USER DATA
-- ============================================================================
-- This script creates and populates department-related tables based on the
-- users table data that already exists in your database.

-- ============================================================================
-- 1. CREATE DEPARTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" varchar NOT NULL UNIQUE,
    "code" varchar NOT NULL UNIQUE,
    "description" text,
    "manager_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "parent_department_id" uuid REFERENCES "public"."departments"("id") ON DELETE SET NULL,
    "email" varchar,
    "phone" varchar,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON "public"."departments"("manager_id");
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON "public"."departments"("parent_department_id");

-- ============================================================================
-- 2. ENHANCE TEAMS TABLE
-- ============================================================================

ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "public"."departments"("id") ON DELETE SET NULL;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "team_code" varchar;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "email" varchar;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "phone" varchar;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "max_capacity" integer DEFAULT 10;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "current_load" integer DEFAULT 0;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_teams_department_id ON "public"."teams"("department_id");

-- ============================================================================
-- 3. CREATE TEAM MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "team_id" uuid NOT NULL REFERENCES "public"."teams"("id") ON DELETE CASCADE,
    "department_id" uuid NOT NULL REFERENCES "public"."departments"("id") ON DELETE CASCADE,
    "role_in_team" varchar DEFAULT 'member' NOT NULL,
    "is_primary_team" boolean DEFAULT false NOT NULL,
    "max_tickets" integer DEFAULT 10,
    "current_ticket_count" integer DEFAULT 0,
    "availability_status" varchar DEFAULT 'available' NOT NULL,
    "skills" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    UNIQUE("user_id", "team_id")
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON "public"."team_members"("user_id");
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON "public"."team_members"("team_id");
CREATE INDEX IF NOT EXISTS idx_team_members_department_id ON "public"."team_members"("department_id");

-- ============================================================================
-- 4. INSERT DEPARTMENTS
-- ============================================================================
-- Based on unique departments from users table

INSERT INTO "public"."departments" ("name", "code", "description", "is_active")
VALUES
    ('Training', 'TRN', 'Training and Development Department', true),
    ('Sales & Client Servicing', 'SCS', 'Sales and Client Services', true),
    ('Marketing', 'MKT', 'Marketing Department', true),
    ('Studio Operations & Amenities', 'SOA', 'Studio Operations and Amenities', true),
    ('Brand & Policies', 'BRP', 'Brand and Policies', true),
    ('Accounts', 'ACC', 'Accounts and Finance', true),
    ('Studio Operations', 'SOP', 'Studio Operations', true)
ON CONFLICT ("name") DO NOTHING;

-- ============================================================================
-- 5. SET DEPARTMENT MANAGERS (Admin user assigned to departments)
-- ============================================================================
-- Jimmeey (admin) will manage Sales & Client Servicing

UPDATE "public"."departments"
SET manager_id = (SELECT id FROM "public"."users" WHERE email = 'jimmeey@physique57india.com')
WHERE name = 'Sales & Client Servicing';

-- ============================================================================
-- 6. CREATE DEFAULT TEAMS FOR EACH DEPARTMENT
-- ============================================================================

WITH dept_data AS (
    SELECT id, name, code FROM "public"."departments"
)
INSERT INTO "public"."teams" ("name", "department_id", "team_code", "description", "is_active", "manager_id")
SELECT 
    d.name || ' Team',
    d.id,
    d.code || '_TEAM_01',
    'Default team for ' || d.name,
    true,
    (SELECT id FROM "public"."users" WHERE email = 'jimmeey@physique57india.com')
FROM dept_data d
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."teams" t2 
    WHERE t2.department_id = d.id
);

-- ============================================================================
-- 7. ASSIGN USERS TO TEAMS (team_members)
-- ============================================================================
-- Map users from the users table to their departments and teams

INSERT INTO "public"."team_members" ("user_id", "team_id", "department_id", "role_in_team", "is_primary_team", "availability_status", "skills")

-- Training Department
SELECT 
    u.id,
    t.id,
    d.id,
    CASE WHEN u.role = 'admin' THEN 'lead' WHEN u.role = 'team_member' THEN 'lead' ELSE 'member' END,
    true,
    'available',
    '["general_support", "training_coordination"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Training'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Training'

UNION ALL

-- Sales & Client Servicing Department
SELECT 
    u.id,
    t.id,
    d.id,
    CASE WHEN u.email = 'jimmeey@physique57india.com' THEN 'lead' ELSE 'member' END,
    true,
    'available',
    '["sales", "client_relations"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Sales & Client Servicing'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Sales & Client Servicing'

UNION ALL

-- Marketing Department
SELECT 
    u.id,
    t.id,
    d.id,
    'member',
    true,
    'available',
    '["marketing", "content_creation"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Marketing'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Marketing'

UNION ALL

-- Accounts Department
SELECT 
    u.id,
    t.id,
    d.id,
    'member',
    true,
    'available',
    '["accounts", "finance"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Accounts'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Accounts'

UNION ALL

-- Brand & Policies Department
SELECT 
    u.id,
    t.id,
    d.id,
    'member',
    true,
    'available',
    '["brand_management", "policy"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Brand & Policies'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Brand & Policies'

UNION ALL

-- Studio Operations & Amenities Department
SELECT 
    u.id,
    t.id,
    d.id,
    'member',
    true,
    'available',
    '["operations", "facilities"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Studio Operations & Amenities'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Studio Operations & Amenities'

UNION ALL

-- Studio Operations Department
SELECT 
    u.id,
    t.id,
    d.id,
    'member',
    true,
    'available',
    '["operations"]'::jsonb
FROM "public"."users" u
JOIN "public"."departments" d ON d.name = 'Studio Operations'
JOIN "public"."teams" t ON t.department_id = d.id
WHERE u.department = 'Studio Operations'
AND NOT EXISTS (
    SELECT 1 FROM "public"."team_members" tm2
    WHERE tm2.user_id = u.id AND tm2.team_id = t.id
);

-- ============================================================================
-- 8. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. CREATE RLS POLICIES
-- ============================================================================

-- DEPARTMENTS TABLE RLS POLICIES
DROP POLICY IF EXISTS "admin_all_departments" ON "public"."departments";
CREATE POLICY "admin_all_departments" ON "public"."departments"
    FOR ALL
    USING (auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "manager_own_department" ON "public"."departments";
CREATE POLICY "manager_own_department" ON "public"."departments"
    FOR SELECT
    USING (manager_id = auth.uid());

DROP POLICY IF EXISTS "all_users_view_active_departments" ON "public"."departments";
CREATE POLICY "all_users_view_active_departments" ON "public"."departments"
    FOR SELECT
    USING (is_active = true);

-- TEAM MEMBERS TABLE RLS POLICIES
DROP POLICY IF EXISTS "admin_all_team_members" ON "public"."team_members";
CREATE POLICY "admin_all_team_members" ON "public"."team_members"
    FOR ALL
    USING (auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "team_lead_manage_members" ON "public"."team_members";
CREATE POLICY "team_lead_manage_members" ON "public"."team_members"
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."team_members" tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role_in_team IN ('lead', 'backup_lead')
    ));

DROP POLICY IF EXISTS "user_view_own_memberships" ON "public"."team_members";
CREATE POLICY "user_view_own_memberships" ON "public"."team_members"
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."departments" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."team_members" TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup:

-- Check departments created
SELECT COUNT(*) as total_departments FROM "public"."departments";

-- Check teams created
SELECT COUNT(*) as total_teams FROM "public"."teams" WHERE department_id IS NOT NULL;

-- Check team members assigned
SELECT COUNT(*) as total_team_members FROM "public"."team_members";

-- View user to team assignments
SELECT 
    u.full_name,
    u.email,
    u.department,
    d.name as assigned_department,
    t.name as team_name,
    tm.role_in_team
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."departments" d ON tm.department_id = d.id
JOIN "public"."teams" t ON tm.team_id = t.id
ORDER BY u.department, u.full_name;
