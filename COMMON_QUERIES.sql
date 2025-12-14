-- ============================================================================
-- COMMON QUERIES FOR DEPARTMENTS, TEAMS & ROUTING SYSTEM
-- ============================================================================

-- ============================================================================
-- DEPARTMENT QUERIES
-- ============================================================================

-- Get all departments with manager names
SELECT 
    d.id,
    d.name,
    d.code,
    d.description,
    u.full_name AS manager_name,
    u.email AS manager_email,
    d.is_active,
    d.created_at
FROM "public"."departments" d
LEFT JOIN "public"."users" u ON d.manager_id = u.id
ORDER BY d.name;

-- Get department with full team structure
SELECT 
    d.id,
    d.name,
    d.code,
    COUNT(DISTINCT t.id) AS total_teams,
    COUNT(DISTINCT tm.user_id) AS total_members
FROM "public"."departments" d
LEFT JOIN "public"."teams" t ON d.id = t.department_id
LEFT JOIN "public"."team_members" tm ON d.id = tm.department_id
GROUP BY d.id, d.name, d.code
ORDER BY d.name;

-- Get department workload statistics
SELECT 
    d.name AS department,
    COUNT(DISTINCT t.id) AS total_teams,
    COUNT(DISTINCT tm.user_id) AS total_members,
    SUM(t.max_capacity) AS total_capacity,
    SUM(t.current_load) AS current_load,
    ROUND(100.0 * SUM(t.current_load) / NULLIF(SUM(t.max_capacity), 0), 2) AS utilization_percentage
FROM "public"."departments" d
LEFT JOIN "public"."teams" t ON d.id = t.department_id
LEFT JOIN "public"."team_members" tm ON d.id = tm.department_id
GROUP BY d.id, d.name
ORDER BY utilization_percentage DESC;

-- Find department manager hierarchy
WITH RECURSIVE dept_hierarchy AS (
    SELECT 
        id,
        name,
        manager_id,
        parent_department_id,
        0 AS level
    FROM "public"."departments"
    WHERE parent_department_id IS NULL
    
    UNION ALL
    
    SELECT 
        d.id,
        d.name,
        d.manager_id,
        d.parent_department_id,
        dh.level + 1
    FROM "public"."departments" d
    JOIN dept_hierarchy dh ON d.parent_department_id = dh.id
)
SELECT 
    REPEAT('  ', level) || name AS department_hierarchy,
    manager_id
FROM dept_hierarchy
ORDER BY level, name;

-- ============================================================================
-- TEAM QUERIES
-- ============================================================================

-- Get all teams with capacity information
SELECT 
    t.id,
    t.name,
    d.name AS department,
    u.full_name AS manager_name,
    t.max_capacity,
    t.current_load,
    (t.max_capacity - t.current_load) AS available_capacity,
    ROUND(100.0 * t.current_load / NULLIF(t.max_capacity, 0), 2) AS utilization_percentage,
    COUNT(DISTINCT tm.user_id) AS member_count,
    t.is_active
FROM "public"."teams" t
LEFT JOIN "public"."departments" d ON t.department_id = d.id
LEFT JOIN "public"."users" u ON t.manager_id = u.id
LEFT JOIN "public"."team_members" tm ON t.id = tm.team_id
GROUP BY t.id, t.name, d.name, u.full_name
ORDER BY utilization_percentage DESC;

-- Find teams with most availability
SELECT 
    t.id,
    t.name,
    t.max_capacity - t.current_load AS available_slots,
    COUNT(tm.user_id) AS team_members,
    COUNT(CASE WHEN tm.availability_status = 'available' THEN 1 END) AS available_members
FROM "public"."teams" t
LEFT JOIN "public"."team_members" tm ON t.id = tm.team_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.max_capacity, t.current_load
HAVING (t.max_capacity - t.current_load) > 0
ORDER BY available_slots DESC;

-- Get team member distribution by availability
SELECT 
    t.name AS team,
    tm.availability_status,
    COUNT(*) AS member_count
FROM "public"."team_members" tm
JOIN "public"."teams" t ON tm.team_id = t.id
GROUP BY t.id, t.name, tm.availability_status
ORDER BY t.name, tm.availability_status;

-- ============================================================================
-- TEAM MEMBER QUERIES
-- ============================================================================

-- Get all team members with full details
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.role,
    d.name AS department,
    t.name AS team,
    tm.role_in_team,
    tm.max_tickets,
    tm.current_ticket_count,
    tm.availability_status,
    tm.skills,
    tm.is_primary_team,
    u.is_active
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."departments" d ON tm.department_id = d.id
JOIN "public"."teams" t ON tm.team_id = t.id
ORDER BY d.name, t.name, u.full_name;

-- Get users' team memberships
SELECT 
    u.full_name,
    u.email,
    STRING_AGG(DISTINCT t.name, ', ') AS teams,
    STRING_AGG(DISTINCT tm.role_in_team, ', ') AS roles,
    COUNT(DISTINCT tm.id) AS team_count
FROM "public"."users" u
LEFT JOIN "public"."team_members" tm ON u.id = tm.user_id
LEFT JOIN "public"."teams" t ON tm.team_id = t.id
GROUP BY u.id, u.full_name, u.email
ORDER BY u.full_name;

-- Find overloaded team members
SELECT 
    u.full_name,
    u.email,
    t.name AS team,
    tm.max_tickets,
    tm.current_ticket_count,
    (tm.current_ticket_count - tm.max_tickets) AS overload,
    CASE 
        WHEN tm.current_ticket_count > tm.max_tickets THEN 'OVERLOADED'
        WHEN tm.current_ticket_count = tm.max_tickets THEN 'AT_CAPACITY'
        ELSE 'OK'
    END AS status
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."teams" t ON tm.team_id = t.id
WHERE tm.current_ticket_count >= tm.max_tickets
ORDER BY overload DESC;

-- Get team members with specific skills
SELECT 
    u.full_name,
    u.email,
    t.name AS team,
    tm.skills
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."teams" t ON tm.team_id = t.id
WHERE tm.skills @> '["billing_support"]'::jsonb
ORDER BY t.name, u.full_name;

-- ============================================================================
-- ROUTING RULES QUERIES
-- ============================================================================

-- Get all active routing rules
SELECT 
    rr.id,
    rr.name,
    rr.code,
    rr.priority,
    c.name AS category,
    rr.priority_level,
    d.name AS department,
    t.name AS route_to_team,
    u.full_name AS route_to_user,
    rr.load_balancing_strategy,
    rr.auto_escalate_after_minutes,
    rr.is_active
FROM "public"."routing_rules" rr
LEFT JOIN "public"."categories" c ON rr.category_id = c.id
LEFT JOIN "public"."departments" d ON rr.department_id = d.id
LEFT JOIN "public"."teams" t ON rr.route_to_team_id = t.id
LEFT JOIN "public"."users" u ON rr.route_to_user_id = u.id
WHERE rr.is_active = true
ORDER BY rr.priority ASC;

-- Get routing rules by category
SELECT 
    c.name AS category,
    COUNT(*) AS total_rules,
    COUNT(CASE WHEN rr.is_active THEN 1 END) AS active_rules,
    STRING_AGG(DISTINCT rr.load_balancing_strategy, ', ') AS strategies
FROM "public"."routing_rules" rr
JOIN "public"."categories" c ON rr.category_id = c.id
GROUP BY c.id, c.name
ORDER BY total_rules DESC;

-- Find which department gets which category
SELECT 
    c.name AS category,
    d.name AS department,
    rr.priority,
    rr.load_balancing_strategy
FROM "public"."routing_rules" rr
JOIN "public"."categories" c ON rr.category_id = c.id
LEFT JOIN "public"."departments" d ON rr.department_id = d.id
WHERE rr.is_active = true
ORDER BY c.name, rr.priority;

-- Get escalation chain for a priority level
SELECT 
    priority,
    escalation_level,
    escalate_after_minutes,
    escalate_to_role,
    notify_original_assignee,
    requires_approval
FROM "public"."escalation_rules"
WHERE is_active = true
ORDER BY priority, escalation_level;

-- ============================================================================
-- TICKET ASSIGNMENT QUERIES
-- ============================================================================

-- Find which team handles which ticket categories
SELECT 
    c.name AS category,
    d.name AS department,
    t.name AS team,
    COUNT(DISTINCT tk.id) AS total_tickets,
    COUNT(CASE WHEN tk.status = 'open' THEN 1 END) AS open_tickets,
    COUNT(CASE WHEN tk.status = 'in_progress' THEN 1 END) AS in_progress,
    AVG(EXTRACT(EPOCH FROM (tk.resolved_at - tk.created_at))/3600)::INT AS avg_hours_to_resolve
FROM "public"."tickets" tk
LEFT JOIN "public"."categories" c ON tk.category_id = c.id
LEFT JOIN "public"."departments" d ON tk.department = d.name
LEFT JOIN "public"."teams" t ON tk.assignee_id IN (
    SELECT user_id FROM "public"."team_members" 
    WHERE team_id = t.id
)
GROUP BY c.id, c.name, d.id, d.name, t.id, t.name
ORDER BY total_tickets DESC;

-- Show current ticket load by team member
SELECT 
    u.full_name,
    u.email,
    d.name AS department,
    t.name AS team,
    tm.max_tickets,
    tm.current_ticket_count,
    (tm.max_tickets - tm.current_ticket_count) AS available_capacity,
    ROUND(100.0 * tm.current_ticket_count / NULLIF(tm.max_tickets, 0), 2) AS utilization
FROM "public"."team_members" tm
JOIN "public"."users" u ON tm.user_id = u.id
JOIN "public"."departments" d ON tm.department_id = d.id
JOIN "public"."teams" t ON tm.team_id = t.id
ORDER BY utilization DESC, u.full_name;

-- ============================================================================
-- ESCALATION TRACKING QUERIES
-- ============================================================================

-- Find escalated tickets
SELECT 
    tk.ticket_number,
    tk.title,
    c.name AS category,
    tk.priority,
    tk.status,
    tk.escalated_at,
    u_assigned.full_name AS originally_assigned_to,
    u_escalated.full_name AS escalated_to,
    tk.escalation_reason,
    EXTRACT(EPOCH FROM (NOW() - tk.escalated_at))/3600 AS hours_since_escalation
FROM "public"."tickets" tk
LEFT JOIN "public"."categories" c ON tk.category_id = c.id
LEFT JOIN "public"."users" u_assigned ON tk.assignee_id = u_assigned.id
LEFT JOIN "public"."users" u_escalated ON tk.escalated_to_id = u_escalated.id
WHERE tk.is_escalated = true
ORDER BY tk.escalated_at DESC;

-- Find tickets approaching escalation timeout
SELECT 
    tk.ticket_number,
    tk.title,
    tk.priority,
    er.escalate_after_minutes,
    EXTRACT(EPOCH FROM (NOW() - tk.created_at))/60 AS minutes_since_creation,
    (er.escalate_after_minutes - EXTRACT(EPOCH FROM (NOW() - tk.created_at))/60) AS minutes_until_escalation,
    CASE 
        WHEN (er.escalate_after_minutes - EXTRACT(EPOCH FROM (NOW() - tk.created_at))/60) < 5 THEN 'CRITICAL'
        WHEN (er.escalate_after_minutes - EXTRACT(EPOCH FROM (NOW() - tk.created_at))/60) < 15 THEN 'WARNING'
        ELSE 'OK'
    END AS escalation_status
FROM "public"."tickets" tk
LEFT JOIN "public"."escalation_rules" er ON tk.priority::text = er.priority::text
WHERE tk.is_escalated = false
AND tk.status NOT IN ('resolved', 'closed')
AND er.is_active = true
ORDER BY minutes_until_escalation ASC;

-- ============================================================================
-- MANAGEMENT QUERIES
-- ============================================================================

-- Count all resources
SELECT 
    (SELECT COUNT(*) FROM "public"."departments") AS total_departments,
    (SELECT COUNT(*) FROM "public"."teams") AS total_teams,
    (SELECT COUNT(*) FROM "public"."team_members") AS total_team_members,
    (SELECT COUNT(*) FROM "public"."routing_rules" WHERE is_active = true) AS active_routing_rules,
    (SELECT COUNT(*) FROM "public"."escalation_rules" WHERE is_active = true) AS active_escalation_rules,
    (SELECT COUNT(*) FROM "public"."users" WHERE is_active = true) AS active_users;

-- Get department summary report
SELECT 
    d.name AS department,
    COUNT(DISTINCT t.id) AS teams,
    COUNT(DISTINCT tm.user_id) AS members,
    u.full_name AS manager,
    SUM(t.max_capacity) AS total_capacity,
    SUM(t.current_load) AS current_load,
    ROUND(100.0 * SUM(t.current_load) / NULLIF(SUM(t.max_capacity), 0), 1) AS utilization_pct,
    COUNT(CASE WHEN tm.availability_status = 'available' THEN 1 END) AS available_members,
    COUNT(DISTINCT CASE WHEN tk.status = 'open' THEN tk.id END) AS open_tickets
FROM "public"."departments" d
LEFT JOIN "public"."users" u ON d.manager_id = u.id
LEFT JOIN "public"."teams" t ON d.id = t.department_id
LEFT JOIN "public"."team_members" tm ON d.id = tm.department_id
LEFT JOIN "public"."tickets" tk ON d.name = tk.department AND tk.status = 'open'
WHERE d.is_active = true
GROUP BY d.id, d.name, u.full_name
ORDER BY utilization_pct DESC;

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- Find users not assigned to any team
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.department
FROM "public"."users" u
LEFT JOIN "public"."team_members" tm ON u.id = tm.user_id
WHERE tm.id IS NULL
AND u.is_active = true
ORDER BY u.full_name;

-- Find teams with no members
SELECT 
    t.id,
    t.name,
    d.name AS department,
    t.max_capacity,
    t.is_active
FROM "public"."teams" t
LEFT JOIN "public"."departments" d ON t.department_id = d.id
LEFT JOIN "public"."team_members" tm ON t.id = tm.team_id
GROUP BY t.id, t.name, d.name
HAVING COUNT(tm.user_id) = 0
ORDER BY d.name, t.name;

-- Find routing rules with missing targets
SELECT 
    rr.id,
    rr.name,
    rr.code,
    rr.route_to_team_id,
    rr.route_to_user_id,
    c.name AS category,
    d.name AS department
FROM "public"."routing_rules" rr
LEFT JOIN "public"."categories" c ON rr.category_id = c.id
LEFT JOIN "public"."departments" d ON rr.department_id = d.id
WHERE rr.is_active = true
AND rr.route_to_team_id IS NULL
AND rr.route_to_user_id IS NULL
ORDER BY rr.priority;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Update team load based on actual ticket counts
UPDATE "public"."teams" t
SET current_load = (
    SELECT COUNT(DISTINCT tk.id)
    FROM "public"."tickets" tk
    JOIN "public"."team_members" tm ON tk.assignee_id = tm.user_id
    WHERE tm.team_id = t.id
    AND tk.status NOT IN ('resolved', 'closed')
)
WHERE t.is_active = true;

-- Update team member ticket count
UPDATE "public"."team_members" tm
SET current_ticket_count = (
    SELECT COUNT(*)
    FROM "public"."tickets" tk
    WHERE tk.assignee_id = tm.user_id
    AND tk.status NOT IN ('resolved', 'closed')
)
WHERE tm.user_id IN (SELECT id FROM "public"."users" WHERE is_active = true);

-- Mark old escalations as resolved if ticket is closed
UPDATE "public"."tickets"
SET is_escalated = false
WHERE is_escalated = true
AND status IN ('resolved', 'closed')
AND escalated_at < NOW() - INTERVAL '7 days';

-- ============================================================================
-- PERFORMANCE INDEXES (Already created in setup)
-- ============================================================================

-- Verify indexes exist
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('departments', 'teams', 'team_members', 'routing_rules', 'tickets')
ORDER BY tablename, indexname;
