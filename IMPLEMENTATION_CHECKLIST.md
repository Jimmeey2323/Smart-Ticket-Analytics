# Implementation Checklist - Departments, Teams & Routing System

## Pre-Implementation

- [ ] Database is accessible and working
- [ ] Drizzle ORM is configured
- [ ] Node.js and TypeScript are set up
- [ ] All users are in the `users` table
- [ ] Categories and subcategories are populated

## Phase 1: Database Setup

### SQL Migrations

- [ ] Run `script/departments-teams-setup.sql` successfully
- [ ] Verify departments table exists
  ```sql
  SELECT COUNT(*) FROM "public"."departments";
  ```
- [ ] Verify teams table exists
  ```sql
  SELECT COUNT(*) FROM "public"."teams";
  ```
- [ ] Verify team_members table exists
  ```sql
  SELECT COUNT(*) FROM "public"."team_members";
  ```
- [ ] Verify routing_rules table exists
  ```sql
  SELECT COUNT(*) FROM "public"."routing_rules";
  ```
- [ ] Verify RLS policies are enabled
  ```sql
  SELECT tablename FROM pg_tables 
  WHERE schemaname='public' AND tablename IN ('departments', 'teams', 'team_members', 'routing_rules', 'users', 'tickets');
  ```

### Verify Data Population

- [ ] 7 departments created
  ```sql
  SELECT COUNT(*) FROM "public"."departments" WHERE is_active = true;
  -- Should return 7
  ```
- [ ] Teams created for each department
  ```sql
  SELECT COUNT(*) FROM "public"."teams" WHERE is_active = true;
  -- Should return >= 7
  ```
- [ ] Routing rules created
  ```sql
  SELECT COUNT(*) FROM "public"."routing_rules" WHERE is_active = true;
  -- Should return > 0
  ```

## Phase 2: TypeScript Schema Integration

### Schema Files

- [ ] Copy `shared/schema-departments-teams.ts` to project
- [ ] Import in `shared/schema.ts` or create new import
- [ ] Verify types export correctly
  ```typescript
  import type { Department, Team, TeamMember, RoutingRule } from '../shared/schema-departments-teams';
  ```
- [ ] No TypeScript compilation errors
  ```bash
  npm run build
  ```

### Type Exports

- [ ] Department type available
- [ ] Team type available
- [ ] TeamMember type available
- [ ] RoutingRule type available
- [ ] All insert schemas available

## Phase 3: Backend API Integration

### Route Implementation

- [ ] Copy `server/routes-departments.ts` to project
- [ ] Import department routes in `server/index.ts`
  ```typescript
  import departmentRoutes from './routes-departments';
  ```
- [ ] Register routes
  ```typescript
  app.use('/api', departmentRoutes);
  ```
- [ ] No import errors
- [ ] Server starts without errors
  ```bash
  npm run dev
  ```

### API Endpoint Testing

- [ ] Test departments endpoint
  ```bash
  curl http://localhost:5003/api/departments
  ```
  Expected: Array of departments

- [ ] Test teams endpoint
  ```bash
  curl http://localhost:5003/api/teams
  ```
  Expected: Array of teams

- [ ] Test team members endpoint
  ```bash
  curl http://localhost:5003/api/team-members
  ```
  Expected: Array of team members

- [ ] Test routing rules endpoint
  ```bash
  curl http://localhost:5003/api/routing-rules/active
  ```
  Expected: Array of active routing rules

## Phase 4: Seeding User Data

### Run Seeding Script

- [ ] Execute seeding script
  ```bash
  npx ts-node script/seed-departments-teams.ts
  ```
- [ ] Script completes without errors
- [ ] Check user assignments
  ```sql
  SELECT COUNT(*) FROM "public"."team_members";
  -- Should be >= number of active users
  ```

### Verify User Assignments

- [ ] Vivaran Dhasmana assigned to Training
  ```sql
  SELECT tm.* FROM team_members tm
  JOIN users u ON tm.user_id = u.id
  WHERE u.email = 'vivaran@physique57mumbai.com';
  ```

- [ ] Jimmeey assigned to Sales & Client Servicing
  ```sql
  SELECT tm.* FROM team_members tm
  JOIN users u ON tm.user_id = u.id
  WHERE u.email = 'jimmeey@physique57india.com';
  ```

- [ ] All active users have team assignments
  ```sql
  SELECT COUNT(DISTINCT u.id) as total_users,
         COUNT(DISTINCT tm.user_id) as assigned_users
  FROM users u
  LEFT JOIN team_members tm ON u.id = tm.user_id
  WHERE u.is_active = true;
  ```

## Phase 5: Routing Integration

### Create Routing Service

- [ ] Create `lib/routing-service.ts` or similar
- [ ] Implement `getTicketAssignmentTarget()` function
- [ ] Implement `getAvailableTeamMember()` function
- [ ] Implement `decrementTeamLoad()` function
- [ ] All functions compile without errors

### Integrate with Ticket Creation

- [ ] Update ticket creation endpoint to use routing
- [ ] Test ticket assignment
  ```typescript
  // Create a test ticket
  POST /api/tickets
  {
    "categoryId": "...",
    "title": "Test Ticket",
    "description": "Testing routing",
    "priority": "high"
  }
  ```
- [ ] Verify ticket is assigned to correct user
- [ ] Verify team load increases

### Verify Load Tracking

- [ ] Create 5 test tickets
- [ ] Check team load increases
  ```sql
  SELECT name, current_load, max_capacity FROM teams WHERE id = '...';
  ```
- [ ] Check team member load increases
  ```sql
  SELECT user_id, current_ticket_count FROM team_members;
  ```

## Phase 6: Escalation Setup

### Create Escalation Service

- [ ] Create `lib/escalation-service.ts` or similar
- [ ] Implement `checkAndEscalateTickets()` function
- [ ] Implement ticket escalation handler

### Test Escalation

- [ ] Create high-priority ticket
- [ ] Manually trigger escalation (or wait for SLA)
- [ ] Verify ticket marked as escalated
  ```sql
  SELECT is_escalated, escalated_at FROM tickets WHERE id = '...';
  ```
- [ ] Verify notification created
  ```sql
  SELECT * FROM notifications WHERE type = 'escalation';
  ```

## Phase 7: RLS Policies Verification

### Test Access Control

- [ ] Admin can view all departments
  ```typescript
  // As admin user
  GET /api/departments
  // Should return all 7 departments
  ```

- [ ] Manager can view own department
  ```typescript
  // As department manager
  GET /api/departments/:managedDeptId
  // Should return department
  ```

- [ ] Team member cannot see other teams' data
  ```typescript
  // As team member in Training team
  GET /api/team-members/team/:differentTeamId
  // Should return 403 or empty
  ```

### Database-Level RLS

- [ ] Enable RLS on all tables
  ```sql
  SELECT tablename FROM pg_tables 
  WHERE schemaname='public' 
  AND tablename IN ('users', 'departments', 'teams', 'team_members', 'routing_rules', 'tickets');
  ```

- [ ] Verify policies exist
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('departments', 'teams', 'team_members');
  ```

## Phase 8: Frontend Integration (Optional)

### Add Hooks

- [ ] Create `client/src/hooks/useTicketRouting.ts`
- [ ] Implement `useDepartments()` hook
- [ ] Implement `useTeams()` hook
- [ ] Implement `useRoutingRules()` hook
- [ ] Implement `useTeamMembers()` hook

### Update Forms

- [ ] Add department selector to ticket form
- [ ] Add team/user assignment UI
- [ ] Add routing rule configuration UI
- [ ] Add escalation rule management UI

## Phase 9: Documentation

- [ ] Read `DEPARTMENTS_TEAMS_ROUTING.md` completely
- [ ] Read `INTEGRATION_GUIDE.md` completely
- [ ] Review `COMMON_QUERIES.sql` for useful queries
- [ ] Share documentation with team

## Phase 10: Testing

### Unit Tests

- [ ] Test `getTicketAssignmentTarget()` function
- [ ] Test `decrementTeamLoad()` function
- [ ] Test routing with different strategies
- [ ] Test escalation logic

### Integration Tests

- [ ] Create ticket → Auto-assign to team
- [ ] Update team capacity → Affects routing
- [ ] Escalate ticket → Send notification
- [ ] Resolve ticket → Decrement load

### End-to-End Tests

- [ ] Create complete workflow (ticket → assignment → resolution)
- [ ] Test with multiple departments
- [ ] Test load balancing across teams
- [ ] Test escalation chain

## Phase 11: Performance & Monitoring

### Database Optimization

- [ ] All indexes created
  ```sql
  SELECT COUNT(*) FROM pg_indexes 
  WHERE schemaname='public' AND tablename IN ('teams', 'team_members', 'routing_rules', 'tickets');
  ```
- [ ] Query performance acceptable
  - Get all departments: < 100ms
  - Find routing rule: < 50ms
  - Get team members: < 100ms

### Monitoring Setup

- [ ] Logging for routing decisions
- [ ] Monitoring for failed assignments
- [ ] Alerts for overloaded teams
- [ ] Dashboard for team utilization

## Phase 12: Production Deployment

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors in development
- [ ] Documentation complete and reviewed
- [ ] Team trained on new system

### Deployment

- [ ] Database migrations applied to production
- [ ] Backend code deployed
- [ ] API endpoints tested in production
- [ ] Frontend updated (if applicable)
- [ ] Monitor for errors

### Post-Deployment

- [ ] Monitor system performance
- [ ] Check escalation timing
- [ ] Verify load distribution
- [ ] Collect feedback from users
- [ ] Adjust routing rules as needed

## Phase 13: Maintenance

### Regular Tasks

- [ ] [ ] Weekly: Check team utilization
- [ ] [ ] Weekly: Review escalated tickets
- [ ] [ ] Monthly: Analyze routing effectiveness
- [ ] [ ] Monthly: Update routing rules
- [ ] [ ] Monthly: Review user assignments

### Monitoring Queries

- [ ] Department statistics
  ```bash
  SELECT * FROM v_department_stats;
  ```
- [ ] Team load distribution
  ```bash
  SELECT * FROM v_team_load;
  ```
- [ ] Escalation trends
  ```bash
  SELECT * FROM v_escalation_trends;
  ```

## Troubleshooting Checklist

### Common Issues

- [ ] **"No routing rule found"**
  - Check: `SELECT * FROM routing_rules WHERE is_active = true;`
  - Solution: Create routing rules for your categories

- [ ] **"User not in team"**
  - Check: `SELECT * FROM team_members WHERE user_id = '...';`
  - Solution: Run seed script or manually add user

- [ ] **"RLS policy blocking"**
  - Check: User role and RLS policies
  - Solution: Verify policy for your user role

- [ ] **"Team at capacity"**
  - Check: `SELECT current_load, max_capacity FROM teams WHERE id = '...';`
  - Solution: Increase team capacity or resolve tickets

### Debug Queries

- Check all system ready
  ```bash
  psql $DATABASE_URL < COMMON_QUERIES.sql
  ```

## Sign-Off

- [ ] All phases completed
- [ ] All tests passing
- [ ] Documentation reviewed
- [ ] Team trained
- [ ] Ready for production

**Completed By:** _________________
**Date:** _________________
**Notes:** _________________

---

## Next Steps After Completion

1. Monitor system for 1 week
2. Gather user feedback
3. Adjust routing rules based on data
4. Optimize database queries if needed
5. Plan Phase 2 enhancements
   - ML-based routing
   - Advanced analytics dashboard
   - Integration with external systems
   - Auto-scaling based on demand
