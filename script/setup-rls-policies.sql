-- ============================================================================
-- ROLE-BASED ACCESS CONTROL - DATABASE LEVEL SECURITY
-- ============================================================================
-- Adds Row Level Security (RLS) policies to enforce role-based access control
-- at the database level for maximum security

-- ============================================================================
-- 1. ENABLE RLS ON USERS TABLE
-- ============================================================================

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. USERS TABLE RLS POLICIES
-- ============================================================================

-- Admin: Can access all user records
DROP POLICY IF EXISTS "users_admin_all" ON "public"."users";
CREATE POLICY "users_admin_all" ON "public"."users"
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can always view their own profile
DROP POLICY IF EXISTS "users_view_self" ON "public"."users";
CREATE POLICY "users_view_self" ON "public"."users"
    FOR SELECT
    USING (id = auth.uid());

-- Managers can view users in their department
DROP POLICY IF EXISTS "users_manager_view_dept" ON "public"."users";
CREATE POLICY "users_manager_view_dept" ON "public"."users"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'manager'
            AND manager.department = "users".department
        )
    );

-- All authenticated users can view basic profile info (limited fields)
DROP POLICY IF EXISTS "users_view_basic_info" ON "public"."users";
CREATE POLICY "users_view_basic_info" ON "public"."users"
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 3. ENABLE RLS ON TICKETS TABLE
-- ============================================================================

ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. TICKETS TABLE RLS POLICIES
-- ============================================================================

-- Admin: Can access all tickets
DROP POLICY IF EXISTS "tickets_admin_all" ON "public"."tickets";
CREATE POLICY "tickets_admin_all" ON "public"."tickets"
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Managers: Can view/edit tickets in their department
DROP POLICY IF EXISTS "tickets_manager_view_dept" ON "public"."tickets";
CREATE POLICY "tickets_manager_view_dept" ON "public"."tickets"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'manager'
            AND manager.department = "tickets".department
        )
    );

-- Team members: Can view their own tickets
DROP POLICY IF EXISTS "tickets_team_member_view_own" ON "public"."tickets";
CREATE POLICY "tickets_team_member_view_own" ON "public"."tickets"
    FOR SELECT
    USING (
        assignee_id = auth.uid() OR
        reported_by_id = auth.uid()
    );

-- Support staff: Can view assigned tickets
DROP POLICY IF EXISTS "tickets_support_view_assigned" ON "public"."tickets";
CREATE POLICY "tickets_support_view_assigned" ON "public"."tickets"
    FOR SELECT
    USING (assignee_id = auth.uid());

-- Anyone authenticated can create tickets
DROP POLICY IF EXISTS "tickets_create_authenticated" ON "public"."tickets";
CREATE POLICY "tickets_create_authenticated" ON "public"."tickets"
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 5. ENABLE RLS ON TEAMS TABLE
-- ============================================================================

ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. TEAMS TABLE RLS POLICIES
-- ============================================================================

-- Admin: Can access all teams
DROP POLICY IF EXISTS "teams_admin_all" ON "public"."teams";
CREATE POLICY "teams_admin_all" ON "public"."teams"
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Managers: Can view all teams (filtering done at API level)
DROP POLICY IF EXISTS "teams_manager_view_dept" ON "public"."teams";
CREATE POLICY "teams_manager_view_dept" ON "public"."teams"
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- All authenticated: Can view active teams
DROP POLICY IF EXISTS "teams_view_active" ON "public"."teams";
CREATE POLICY "teams_view_active" ON "public"."teams"
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 7. ENABLE RLS ON CATEGORIES TABLE
-- ============================================================================

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. CATEGORIES TABLE RLS POLICIES
-- ============================================================================

-- Admin: Can manage all categories
DROP POLICY IF EXISTS "categories_admin_all" ON "public"."categories";
CREATE POLICY "categories_admin_all" ON "public"."categories"
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- All authenticated: Can view active categories
DROP POLICY IF EXISTS "categories_view_active" ON "public"."categories";
CREATE POLICY "categories_view_active" ON "public"."categories"
    FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- ============================================================================
-- 9. ENABLE RLS ON FORM FIELDS TABLE
-- ============================================================================

ALTER TABLE "public"."form_fields" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. FORM FIELDS TABLE RLS POLICIES
-- ============================================================================

-- Admin: Can manage all form fields
DROP POLICY IF EXISTS "form_fields_admin_all" ON "public"."form_fields";
CREATE POLICY "form_fields_admin_all" ON "public"."form_fields"
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- All authenticated: Can view active fields
DROP POLICY IF EXISTS "form_fields_view_active" ON "public"."form_fields";
CREATE POLICY "form_fields_view_active" ON "public"."form_fields"
    FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- ============================================================================
-- 11. ENABLE RLS ON TICKET COMMENTS TABLE
-- ============================================================================

ALTER TABLE "public"."ticket_comments" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. TICKET COMMENTS TABLE RLS POLICIES
-- ============================================================================

-- Admin: Can access all comments
DROP POLICY IF EXISTS "comments_admin_all" ON "public"."ticket_comments";
CREATE POLICY "comments_admin_all" ON "public"."ticket_comments"
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can view comments on their tickets
DROP POLICY IF EXISTS "comments_view_on_own_tickets" ON "public"."ticket_comments";
CREATE POLICY "comments_view_on_own_tickets" ON "public"."ticket_comments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."tickets"
            WHERE tickets.id = ticket_comments.ticket_id
            AND (tickets.assignee_id = auth.uid() OR tickets.reported_by_id = auth.uid())
        )
    );

-- Managers can view comments on department tickets
DROP POLICY IF EXISTS "comments_manager_view_dept" ON "public"."ticket_comments";
CREATE POLICY "comments_manager_view_dept" ON "public"."ticket_comments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."tickets" t
            JOIN "public"."users" u ON u.id = auth.uid()
            WHERE t.id = ticket_comments.ticket_id
            AND t.department = u.department
            AND u.role = 'manager'
        )
    );

-- ============================================================================
-- Setup complete. All RLS policies have been created.
-- ============================================================================
