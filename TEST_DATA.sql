-- ============================================================================
-- TEST DATA FOR DEPARTMENTS, TEAMS & ROUTING SYSTEM
-- ============================================================================
-- Use this file to populate test data for development and testing

-- ============================================================================
-- 1. TEST DEPARTMENTS (already created by setup, but here for reference)
-- ============================================================================

-- Clear and recreate departments (for testing only)
-- DO NOT RUN IN PRODUCTION

-- DELETE FROM "public"."department_hierarchy";
-- DELETE FROM "public"."routing_rules";
-- DELETE FROM "public"."team_members";
-- DELETE FROM "public"."teams";
-- DELETE FROM "public"."departments";

-- Insert test departments
INSERT INTO "public"."departments" ("name", "code", "description", "email", "phone", "is_active")
VALUES
    ('Training', 'TRN', 'Training & Development Department', 'training@physique57.com', '+91-22-xxxx-xxxx', true),
    ('Sales & Client Servicing', 'SCS', 'Sales and Client Services', 'sales@physique57.com', '+91-22-xxxx-xxxx', true),
    ('Marketing', 'MKT', 'Marketing & Communications', 'marketing@physique57.com', '+91-22-xxxx-xxxx', true),
    ('Studio Operations & Amenities', 'SOA', 'Studio Operations and Amenities Management', 'operations@physique57.com', '+91-22-xxxx-xxxx', true),
    ('Brand & Policies', 'BRP', 'Brand Management and Policies', 'brand@physique57.com', '+91-22-xxxx-xxxx', true),
    ('Accounts', 'ACC', 'Accounts and Finance', 'accounts@physique57.com', '+91-22-xxxx-xxxx', true),
    ('Studio Operations', 'SOP', 'Studio Operations', 'studio@physique57.com', '+91-22-xxxx-xxxx', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. TEST TEAMS
-- ============================================================================

-- Create teams for each department
WITH dept_data AS (
    SELECT id, name, code FROM "public"."departments"
)
INSERT INTO "public"."teams" 
("name", "department_id", "team_code", "description", "email", "phone", "max_capacity", "is_active")
SELECT
    d.name || ' Team A',
    d.id,
    d.code || '_TEAM_A',
    'Primary support team for ' || d.name,
    LOWER(d.code) || '_a@physique57.com',
    '+91-22-xxxx-xxxx',
    10,
    true
FROM dept_data d
ON CONFLICT (name) DO NOTHING;

-- Create secondary teams for high-volume departments
WITH dept_data AS (
    SELECT id, name, code FROM "public"."departments" WHERE name IN ('Sales & Client Servicing', 'Training')
)
INSERT INTO "public"."teams" 
("name", "department_id", "team_code", "description", "email", "phone", "max_capacity", "is_active")
SELECT
    d.name || ' Team B',
    d.id,
    d.code || '_TEAM_B',
    'Secondary support team for ' || d.name,
    LOWER(d.code) || '_b@physique57.com',
    '+91-22-xxxx-xxxx',
    8,
    true
FROM dept_data d
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. TEST TEAM ASSIGNMENTS (already handled by seed script)
-- ============================================================================

-- Verify assignments with this query
SELECT 
    u.full_name,
    u.email,
    d.name AS department,
    t.name AS team,
    tm.role_in_team
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."departments" d ON tm.department_id = d.id
JOIN "public"."teams" t ON tm.team_id = t.id
ORDER BY d.name, u.full_name;

-- ============================================================================
-- 4. TEST ROUTING RULES
-- ============================================================================

-- Get categories for routing rule creation
SELECT id, name FROM "public"."categories" LIMIT 10;

-- Example: Create routing rules for different categories
-- Replace category IDs with actual IDs from your database

-- Training category → Training department
INSERT INTO "public"."routing_rules"
("name", "code", "description", "priority", "category_id", "priority_level", 
 "department_id", "route_to_team_id", "load_balancing_strategy", 
 "auto_escalate_after_minutes", "is_active")
SELECT
    'Route Training to Training Team',
    'ROUTE_TRAINING_TRN_001',
    'Automatically route training tickets to Training department',
    10,
    c.id,
    'high',
    d.id,
    t.id,
    'least_loaded',
    60,
    true
FROM "public"."categories" c
JOIN "public"."departments" d ON d.name = 'Training'
JOIN "public"."teams" t ON t.department_id = d.id AND t.name LIKE '%Team A%'
WHERE c.name LIKE '%training%' OR c.name LIKE '%instructor%'
LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- Billing category → Sales department
INSERT INTO "public"."routing_rules"
("name", "code", "description", "priority", "category_id", "priority_level", 
 "department_id", "route_to_team_id", "load_balancing_strategy", 
 "auto_escalate_after_minutes", "is_active")
SELECT
    'Route Billing to Sales Team',
    'ROUTE_BILLING_SCS_001',
    'Automatically route billing tickets to Sales department',
    15,
    c.id,
    'high',
    d.id,
    t.id,
    'least_loaded',
    30,
    true
FROM "public"."categories" c
JOIN "public"."departments" d ON d.name = 'Sales & Client Servicing'
JOIN "public"."teams" t ON t.department_id = d.id AND t.name LIKE '%Team A%'
WHERE c.name LIKE '%billing%' OR c.name LIKE '%invoice%' OR c.name LIKE '%payment%'
LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- Complaint category → Manager escalation
INSERT INTO "public"."routing_rules"
("name", "code", "description", "priority", "category_id", "priority_level", 
 "department_id", "load_balancing_strategy", 
 "auto_escalate_after_minutes", "is_active")
SELECT
    'Route Critical Complaints for Escalation',
    'ROUTE_COMPLAINT_CRITICAL_001',
    'Escalate critical complaints',
    5,
    c.id,
    'critical',
    d.id,
    'round_robin',
    15,
    true
FROM "public"."categories" c
JOIN "public"."departments" d ON d.name = 'Sales & Client Servicing'
WHERE c.name LIKE '%complaint%' OR c.name LIKE '%issue%'
LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 5. TEST ESCALATION RULES (already created by setup)
-- ============================================================================

-- View current escalation rules
SELECT * FROM "public"."escalation_rules" WHERE is_active = true ORDER BY priority, escalation_level;

-- Example escalation rule for critical tickets
INSERT INTO "public"."escalation_rules"
("name", "priority", "escalation_level", "escalate_after_minutes", "escalate_to_role", "notify_original_assignee", "notify_department_manager", "is_active")
VALUES
    ('Critical Priority - Manager Escalation', 'critical', 1, 15, 'admin', true, true, true),
    ('High Priority - Team Lead Escalation', 'high', 1, 30, 'manager', true, true, true),
    ('Medium Priority - Follow Up', 'medium', 1, 60, 'team_member', true, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. TEST TICKET CREATION WITH ROUTING
-- ============================================================================

-- Example: Create test tickets
INSERT INTO "public"."tickets"
("ticket_number", "category_id", "title", "description", "client_name", "client_email", 
 "client_phone", "status", "priority", "department", "reported_by_id", "created_at")
SELECT
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY c.id)::text, 3, '0'),
    c.id,
    'Test Ticket - ' || c.name,
    'This is a test ticket for category: ' || c.name,
    'Test Customer',
    'test@example.com',
    '+91-98765-43210',
    'open',
    'high',
    d.name,
    u.id,
    NOW()
FROM "public"."categories" c
JOIN "public"."departments" d ON TRUE
JOIN "public"."users" u ON u.role = 'admin'
WHERE c.is_active = true
LIMIT 3;

-- View created test tickets
SELECT ticket_number, title, category_id, priority, status, department, created_at
FROM "public"."tickets"
WHERE ticket_number LIKE 'TEST-%'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. TEST QUERIES FOR VERIFICATION
-- ============================================================================

-- Verify departments populated
SELECT COUNT(*) as total_departments, COUNT(CASE WHEN is_active THEN 1 END) as active_departments
FROM "public"."departments";

-- Verify teams populated
SELECT 
    d.name as department,
    COUNT(t.id) as team_count,
    SUM(t.max_capacity) as total_capacity
FROM "public"."departments" d
LEFT JOIN "public"."teams" t ON d.id = t.department_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- Verify team members assigned
SELECT 
    d.name as department,
    COUNT(DISTINCT tm.user_id) as member_count,
    COUNT(DISTINCT tm.id) as memberships
FROM "public"."departments" d
LEFT JOIN "public"."team_members" tm ON d.id = tm.department_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- Verify routing rules
SELECT 
    COUNT(*) as total_rules,
    COUNT(CASE WHEN is_active THEN 1 END) as active_rules,
    COUNT(DISTINCT load_balancing_strategy) as strategies
FROM "public"."routing_rules";

-- Team utilization summary
SELECT 
    t.name,
    d.name as department,
    t.current_load,
    t.max_capacity,
    ROUND(100.0 * t.current_load / NULLIF(t.max_capacity, 0), 1) as utilization_pct,
    COUNT(tm.user_id) as member_count
FROM "public"."teams" t
LEFT JOIN "public"."departments" d ON t.department_id = d.id
LEFT JOIN "public"."team_members" tm ON t.id = tm.team_id
WHERE t.is_active = true
GROUP BY t.id, t.name, d.name, t.current_load, t.max_capacity
ORDER BY utilization_pct DESC NULLS LAST;

-- ============================================================================
-- 8. PERFORMANCE TEST DATA
-- ============================================================================

-- Create many test tickets for load testing (careful with volume!)
-- Uncomment only if you want to test with high volumes

/*
INSERT INTO "public"."tickets"
("ticket_number", "category_id", "title", "description", "client_name", "client_email",
 "status", "priority", "department", "reported_by_id", "created_at")
SELECT
    'PERF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || generate_series::text,
    c.id,
    'Performance Test Ticket #' || generate_series,
    'This is a performance test ticket',
    'Perf Test Customer ' || generate_series,
    'perf-' || generate_series || '@test.com',
    'open',
    CASE (generate_series % 4)
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        WHEN 2 THEN 'high'
        ELSE 'critical'
    END,
    d.name,
    u.id,
    NOW() - (generate_series || ' minutes')::interval
FROM "public"."categories" c
CROSS JOIN "public"."departments" d
CROSS JOIN "public"."users" u
CROSS JOIN generate_series(1, 100, 1)
WHERE c.is_active = true
AND d.is_active = true
AND u.is_active = true
LIMIT 500;
*/

-- ============================================================================
-- 9. CLEANUP QUERIES (Use with caution!)
-- ============================================================================

-- Reset team loads based on actual ticket counts
-- UPDATE "public"."teams" t
-- SET current_load = (
--     SELECT COUNT(DISTINCT tk.id)
--     FROM "public"."tickets" tk
--     JOIN "public"."team_members" tm ON tk.assignee_id = tm.user_id
--     WHERE tm.team_id = t.id
--     AND tk.status NOT IN ('resolved', 'closed')
-- )
-- WHERE t.is_active = true;

-- Reset team member ticket counts
-- UPDATE "public"."team_members" tm
-- SET current_ticket_count = (
--     SELECT COUNT(*)
--     FROM "public"."tickets" tk
--     WHERE tk.assignee_id = tm.user_id
--     AND tk.status NOT IN ('resolved', 'closed')
-- );

-- Delete test tickets (comment out the WHERE clause to delete all)
-- DELETE FROM "public"."tickets"
-- WHERE ticket_number LIKE 'TEST-%'
-- OR ticket_number LIKE 'PERF-%';

-- ============================================================================
-- 10. SAMPLE DASHBOARDS QUERIES
-- ============================================================================

-- Department Performance Dashboard
SELECT 
    d.name as Department,
    COUNT(DISTINCT t.id) as Teams,
    COUNT(DISTINCT tm.user_id) as Members,
    SUM(t.max_capacity) as "Total Capacity",
    SUM(t.current_load) as "Current Load",
    ROUND(100.0 * SUM(t.current_load) / NULLIF(SUM(t.max_capacity), 0), 1) as "Utilization %",
    COUNT(CASE WHEN tm.availability_status = 'available' THEN 1 END) as "Available Members"
FROM "public"."departments" d
LEFT JOIN "public"."teams" t ON d.id = t.department_id
LEFT JOIN "public"."team_members" tm ON d.id = tm.department_id
WHERE d.is_active = true
GROUP BY d.id, d.name
ORDER BY "Utilization %" DESC;

-- Team Member Workload Dashboard
SELECT 
    u.full_name as "Team Member",
    u.email,
    d.name as Department,
    t.name as Team,
    tm.max_tickets as "Max Capacity",
    tm.current_ticket_count as "Current Tickets",
    (tm.max_tickets - tm.current_ticket_count) as "Available Slots",
    tm.availability_status as Status,
    ROUND(100.0 * tm.current_ticket_count / NULLIF(tm.max_tickets, 0), 1) as "Utilization %"
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."departments" d ON tm.department_id = d.id
JOIN "public"."teams" t ON tm.team_id = t.id
WHERE u.is_active = true
ORDER BY "Utilization %" DESC;

-- Routing Effectiveness
SELECT 
    CASE WHEN c.name IS NULL THEN 'Unmatched' ELSE c.name END as Category,
    CASE WHEN d.name IS NULL THEN 'Unassigned' ELSE d.name END as "Routed To",
    COUNT(*) as "Ticket Count",
    COUNT(CASE WHEN tk.status = 'resolved' THEN 1 END) as Resolved,
    ROUND(100.0 * COUNT(CASE WHEN tk.status = 'resolved' THEN 1 END) / COUNT(*), 1) as "Resolution %"
FROM "public"."tickets" tk
LEFT JOIN "public"."categories" c ON tk.category_id = c.id
LEFT JOIN "public"."departments" d ON tk.department = d.name
GROUP BY c.id, c.name, d.id, d.name
ORDER BY "Ticket Count" DESC;
