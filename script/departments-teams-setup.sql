-- ============================================================================
-- DEPARTMENTS, TEAMS, AND ROUTING SETUP
-- ============================================================================

-- 1. DEPARTMENTS TABLE
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

-- 2. TEAMS TABLE (Enhanced)
-- Note: teams table already exists, so we'll alter it to add necessary fields
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "public"."departments"("id") ON DELETE SET NULL;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "team_code" varchar;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "email" varchar;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "phone" varchar;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "max_capacity" integer DEFAULT 10;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "current_load" integer DEFAULT 0;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_teams_department_id ON "public"."teams"("department_id");

-- 3. TEAM MEMBERS TABLE (Link users to teams)
CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "team_id" uuid NOT NULL REFERENCES "public"."teams"("id") ON DELETE CASCADE,
    "department_id" uuid NOT NULL REFERENCES "public"."departments"("id") ON DELETE CASCADE,
    "role_in_team" varchar DEFAULT 'member' NOT NULL, -- member, lead, backup_lead
    "is_primary_team" boolean DEFAULT false NOT NULL,
    "max_tickets" integer DEFAULT 10,
    "current_ticket_count" integer DEFAULT 0,
    "availability_status" varchar DEFAULT 'available' NOT NULL, -- available, busy, away, offline
    "skills" jsonb, -- Array of skills/expertise areas
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    UNIQUE("user_id", "team_id")
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON "public"."team_members"("user_id");
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON "public"."team_members"("team_id");
CREATE INDEX IF NOT EXISTS idx_team_members_department_id ON "public"."team_members"("department_id");

-- 4. ROUTING RULES TABLE
CREATE TABLE IF NOT EXISTS "public"."routing_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" varchar NOT NULL,
    "code" varchar NOT NULL UNIQUE,
    "description" text,
    "priority" integer DEFAULT 100 NOT NULL, -- Lower number = higher priority
    
    -- Routing conditions
    "category_id" uuid REFERENCES "public"."categories"("id") ON DELETE CASCADE,
    "sub_category_id" uuid REFERENCES "public"."subcategories"("id") ON DELETE CASCADE,
    "priority_level" varchar, -- low, medium, high, critical
    "department_id" uuid REFERENCES "public"."departments"("id") ON DELETE CASCADE,
    
    -- Routing targets
    "route_to_team_id" uuid REFERENCES "public"."teams"("id") ON DELETE SET NULL,
    "route_to_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    
    -- Routing logic
    "load_balancing_strategy" varchar DEFAULT 'round_robin', -- round_robin, least_loaded, random, skill_based
    "required_skills" jsonb, -- Array of skills required
    
    -- Conditions
    "client_status_filter" jsonb, -- Array of client statuses (e.g., ['existing', 'new'])
    "location_id" uuid REFERENCES "public"."locations"("id") ON DELETE SET NULL,
    
    -- Escalation settings
    "auto_escalate_after_minutes" integer,
    "escalate_to_team_id" uuid REFERENCES "public"."teams"("id") ON DELETE SET NULL,
    "escalate_to_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_category ON "public"."routing_rules"("category_id");
CREATE INDEX IF NOT EXISTS idx_routing_rules_department ON "public"."routing_rules"("department_id");
CREATE INDEX IF NOT EXISTS idx_routing_rules_team ON "public"."routing_rules"("route_to_team_id");
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON "public"."routing_rules"("priority");

-- 5. ENHANCED ESCALATION RULES TABLE
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "escalation_level" integer DEFAULT 1; -- Level 1, 2, 3, etc.
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "category_id" uuid REFERENCES "public"."categories"("id") ON DELETE SET NULL;
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "public"."departments"("id") ON DELETE SET NULL;
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "escalate_to_team_id" uuid REFERENCES "public"."teams"("id") ON DELETE SET NULL;
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "escalate_to_department_id" uuid REFERENCES "public"."departments"("id") ON DELETE SET NULL;
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "notify_department_manager" boolean DEFAULT true;
ALTER TABLE "public"."escalation_rules" ADD COLUMN IF NOT EXISTS "requires_approval" boolean DEFAULT false;

-- 6. DEPARTMENT HIERARCHY TABLE (for reporting structure)
CREATE TABLE IF NOT EXISTS "public"."department_hierarchy" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "parent_department_id" uuid NOT NULL REFERENCES "public"."departments"("id") ON DELETE CASCADE,
    "child_department_id" uuid NOT NULL REFERENCES "public"."departments"("id") ON DELETE CASCADE,
    "escalation_order" integer DEFAULT 1,
    "created_at" timestamp DEFAULT now(),
    UNIQUE("parent_department_id", "child_department_id")
);

-- ============================================================================
-- INSERT DEPARTMENTS BASED ON USER DATA
-- ============================================================================

INSERT INTO "public"."departments" ("name", "code", "description", "is_active")
VALUES
    ('Training', 'TRN', 'Training Department', true),
    ('Sales & Client Servicing', 'SCS', 'Sales and Client Services', true),
    ('Marketing', 'MKT', 'Marketing Department', true),
    ('Studio Operations & Amenities', 'SOA', 'Studio Operations and Amenities', true),
    ('Brand & Policies', 'BRP', 'Brand and Policies', true),
    ('Accounts', 'ACC', 'Accounts and Finance', true),
    ('Studio Operations', 'SOP', 'Studio Operations', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INSERT DEFAULT TEAMS
-- ============================================================================

-- Get department IDs for team creation
WITH dept_ids AS (
    SELECT id, name FROM "public"."departments"
)
INSERT INTO "public"."teams" ("name", "department_id", "team_code", "description", "is_active")
SELECT 
    d.name || ' Team',
    d.id,
    d.code || '_TEAM_01',
    'Default team for ' || d.name,
    true
FROM dept_ids d
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES - NEW TABLES ONLY
-- ============================================================================

-- Enable RLS on NEW tables only (existing tables left unchanged)
ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routing_rules" ENABLE ROW LEVEL SECURITY;

-- DEPARTMENTS TABLE RLS POLICIES
-- Admin can manage all departments
DROP POLICY IF EXISTS "admin_all_departments" ON "public"."departments";
CREATE POLICY "admin_all_departments" ON "public"."departments"
    FOR ALL
    USING (auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND role = 'admin'));

-- Department managers can see and manage their department
DROP POLICY IF EXISTS "manager_own_department" ON "public"."departments";
CREATE POLICY "manager_own_department" ON "public"."departments"
    FOR SELECT
    USING (manager_id = auth.uid() OR
           auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND role = 'admin'));

-- All authenticated users can view active departments
DROP POLICY IF EXISTS "all_users_view_active_departments" ON "public"."departments";
CREATE POLICY "all_users_view_active_departments" ON "public"."departments"
    FOR SELECT
    USING (is_active = true);

-- TEAM MEMBERS TABLE RLS POLICIES
-- Admin can manage all team memberships
DROP POLICY IF EXISTS "admin_all_team_members" ON "public"."team_members";
CREATE POLICY "admin_all_team_members" ON "public"."team_members"
    FOR ALL
    USING (auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND role = 'admin'));

-- Team leads can see and manage their team members
DROP POLICY IF EXISTS "team_lead_manage_members" ON "public"."team_members";
CREATE POLICY "team_lead_manage_members" ON "public"."team_members"
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."team_members" tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role_in_team IN ('lead', 'backup_lead')
    ));

-- Users can see their own team memberships
DROP POLICY IF EXISTS "user_view_own_memberships" ON "public"."team_members";
CREATE POLICY "user_view_own_memberships" ON "public"."team_members"
    FOR SELECT
    USING (user_id = auth.uid());

-- ROUTING RULES TABLE RLS POLICIES
-- Admin can manage all routing rules
DROP POLICY IF EXISTS "admin_all_routing_rules" ON "public"."routing_rules";
CREATE POLICY "admin_all_routing_rules" ON "public"."routing_rules"
    FOR ALL
    USING (auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" WHERE id = auth.uid() AND role = 'admin'));

-- All active users can view active routing rules (for reference)
DROP POLICY IF EXISTS "user_view_active_routing_rules" ON "public"."routing_rules";
CREATE POLICY "user_view_active_routing_rules" ON "public"."routing_rules"
    FOR SELECT
    USING (is_active = true);

-- Department managers can manage rules for their department
DROP POLICY IF EXISTS "dept_manager_manage_routing_rules" ON "public"."routing_rules";
CREATE POLICY "dept_manager_manage_routing_rules" ON "public"."routing_rules"
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "public"."departments" d
        WHERE d.id = routing_rules.department_id
        AND d.manager_id = auth.uid()
    ));

-- ============================================================================
-- CREATE FUNCTIONS FOR ROUTING AND ASSIGNMENT
-- ============================================================================

-- Function to find the best team/user for ticket routing
CREATE OR REPLACE FUNCTION get_best_assignment_target(
    p_category_id uuid,
    p_priority varchar,
    p_department_name varchar
)
RETURNS TABLE(
    target_type varchar,
    target_id uuid,
    target_name varchar
) AS $$
BEGIN
    -- First, try to find a specific routing rule
    RETURN QUERY
    SELECT 
        CASE 
            WHEN rr.route_to_team_id IS NOT NULL THEN 'team'
            ELSE 'user'
        END as target_type,
        COALESCE(rr.route_to_team_id, rr.route_to_user_id) as target_id,
        COALESCE(t.name, u.full_name) as target_name
    FROM "public"."routing_rules" rr
    LEFT JOIN "public"."teams" t ON rr.route_to_team_id = t.id
    LEFT JOIN "public"."users" u ON rr.route_to_user_id = u.id
    WHERE rr.is_active = true
    AND rr.category_id = p_category_id
    AND (rr.priority_level = p_priority OR rr.priority_level IS NULL)
    ORDER BY rr.priority ASC
    LIMIT 1;
    
    -- If no specific rule, return based on department
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            'team'::varchar as target_type,
            t.id as target_id,
            t.name as target_name
        FROM "public"."teams" t
        JOIN "public"."departments" d ON t.department_id = d.id
        WHERE d.name = p_department_name
        AND t.is_active = true
        ORDER BY t.current_load ASC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get least loaded team member
CREATE OR REPLACE FUNCTION get_available_team_member(p_team_id uuid)
RETURNS TABLE(
    user_id uuid,
    user_name varchar,
    current_ticket_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.user_id,
        u.full_name,
        tm.current_ticket_count
    FROM "public"."team_members" tm
    JOIN "public"."users" u ON tm.user_id = u.id
    WHERE tm.team_id = p_team_id
    AND tm.availability_status = 'available'
    AND u.is_active = true
    ORDER BY tm.current_ticket_count ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to handle ticket escalation
CREATE OR REPLACE FUNCTION escalate_ticket(
    p_ticket_id uuid,
    p_reason text
)
RETURNS void AS $$
DECLARE
    v_ticket_record RECORD;
    v_escalation_rule RECORD;
    v_target_user_id uuid;
    v_target_team_id uuid;
BEGIN
    -- Get ticket details
    SELECT * INTO v_ticket_record FROM "public"."tickets" WHERE id = p_ticket_id;
    
    -- Find appropriate escalation rule
    SELECT * INTO v_escalation_rule
    FROM "public"."escalation_rules"
    WHERE is_active = true
    AND priority = v_ticket_record.priority::ticket_priority
    ORDER BY escalation_level ASC
    LIMIT 1;
    
    IF v_escalation_rule IS NOT NULL THEN
        -- Update ticket as escalated
        UPDATE "public"."tickets"
        SET 
            is_escalated = true,
            escalated_at = now(),
            escalation_reason = p_reason
        WHERE id = p_ticket_id;
        
        -- Assign to escalation target
        IF v_escalation_rule.escalate_to_user_id IS NOT NULL THEN
            v_target_user_id := v_escalation_rule.escalate_to_user_id;
        ELSIF v_escalation_rule.escalate_to_team_id IS NOT NULL THEN
            SELECT user_id INTO v_target_user_id
            FROM get_available_team_member(v_escalation_rule.escalate_to_team_id)
            LIMIT 1;
        END IF;
        
        -- Create notification for escalation
        INSERT INTO "public"."notifications" (user_id, ticket_id, type, title, message)
        VALUES (
            v_target_user_id,
            p_ticket_id,
            'escalation',
            'Ticket Escalated: ' || v_ticket_record.ticket_number,
            'Ticket has been escalated. Reason: ' || p_reason
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."departments" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."teams" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."team_members" TO authenticated;
GRANT SELECT ON "public"."routing_rules" TO authenticated;
GRANT SELECT ON "public"."tickets" TO authenticated;
GRANT SELECT, INSERT ON "public"."ticket_comments" TO authenticated;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_team_members_availability ON "public"."team_members"("availability_status");
CREATE INDEX IF NOT EXISTS idx_tickets_department_status ON "public"."tickets"("department", "status");
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_status ON "public"."tickets"("assignee_id", "status");
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON "public"."routing_rules"("is_active", "priority");
