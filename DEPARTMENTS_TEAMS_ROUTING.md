# Departments, Teams & Routing System Documentation

## Overview

This documentation covers the comprehensive departments, teams, and routing system implemented for the Smart Ticket Analytics application. The system manages organizational structure, team hierarchies, intelligent ticket routing, and escalation rules.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Departments](#departments)
4. [Teams](#teams)
5. [Team Members](#team-members)
6. [Routing Rules](#routing-rules)
7. [Escalation Rules](#escalation-rules)
8. [RLS Policies](#rls-policies)
9. [API Endpoints](#api-endpoints)
10. [Role-Based Access Control](#role-based-access-control)
11. [Implementation Guide](#implementation-guide)

## Architecture

The system is built on a hierarchical structure:

```
Organization
├── Departments
│   ├── Teams
│   │   ├── Team Members (Users)
│   │   └── Routing Rules
│   └── Department Hierarchy
├── Routing Rules (Global)
├── Escalation Rules
└── RLS Policies
```

### Key Components

- **Departments**: Organizational units (Training, Sales, Marketing, etc.)
- **Teams**: Sub-groups within departments with specific responsibilities
- **Team Members**: Users assigned to teams with specific roles
- **Routing Rules**: Intelligent rules for ticket assignment based on category, priority, skills
- **Escalation Rules**: Automated escalation based on time, priority, and business rules
- **RLS Policies**: Row-level security for role-based data access

## Database Schema

### Departments Table

```sql
CREATE TABLE departments (
  id uuid PRIMARY KEY,
  name varchar UNIQUE NOT NULL,
  code varchar UNIQUE NOT NULL,
  description text,
  manager_id uuid REFERENCES users,
  parent_department_id uuid REFERENCES departments,
  email varchar,
  phone varchar,
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
);
```

**Key Fields:**
- `code`: Short code for department (e.g., 'SCS', 'MKT')
- `manager_id`: Department manager user ID
- `parent_department_id`: For hierarchical departments

### Teams Table (Enhanced)

```sql
CREATE TABLE teams (
  id uuid PRIMARY KEY,
  name varchar UNIQUE NOT NULL,
  department_id uuid REFERENCES departments,
  team_code varchar,
  description text,
  manager_id uuid REFERENCES users,
  email varchar,
  phone varchar,
  max_capacity integer DEFAULT 10,
  current_load integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
);
```

**Key Fields:**
- `current_load`: Current ticket count
- `max_capacity`: Maximum tickets the team can handle
- `team_code`: Unique team identifier

### Team Members Table

```sql
CREATE TABLE team_members (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users ON DELETE CASCADE,
  team_id uuid REFERENCES teams ON DELETE CASCADE,
  department_id uuid REFERENCES departments,
  role_in_team varchar DEFAULT 'member', -- member, lead, backup_lead
  is_primary_team boolean DEFAULT false,
  max_tickets integer DEFAULT 10,
  current_ticket_count integer DEFAULT 0,
  availability_status varchar DEFAULT 'available', -- available, busy, away, offline
  skills jsonb, -- Array of skills
  created_at timestamp,
  updated_at timestamp,
  UNIQUE(user_id, team_id)
);
```

**Key Fields:**
- `role_in_team`: member, lead, or backup_lead
- `availability_status`: Current availability state
- `skills`: JSON array of expertise areas
- `current_ticket_count`: Active ticket assignments

### Routing Rules Table

```sql
CREATE TABLE routing_rules (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  code varchar UNIQUE NOT NULL,
  description text,
  priority integer DEFAULT 100, -- Lower = higher priority
  
  -- Conditions
  category_id uuid REFERENCES categories,
  sub_category_id uuid REFERENCES subcategories,
  priority_level varchar, -- low, medium, high, critical
  department_id uuid REFERENCES departments,
  client_status_filter jsonb, -- Array of statuses
  location_id uuid REFERENCES locations,
  
  -- Targets
  route_to_team_id uuid REFERENCES teams,
  route_to_user_id uuid REFERENCES users,
  load_balancing_strategy varchar DEFAULT 'round_robin',
  required_skills jsonb, -- Array of required skills
  
  -- Escalation
  auto_escalate_after_minutes integer,
  escalate_to_team_id uuid REFERENCES teams,
  escalate_to_user_id uuid REFERENCES users,
  
  is_active boolean DEFAULT true,
  created_by_id uuid REFERENCES users,
  created_at timestamp,
  updated_at timestamp
);
```

**Strategies:**
- `round_robin`: Distribute equally
- `least_loaded`: Assign to team/user with fewest tickets
- `random`: Random assignment
- `skill_based`: Match required skills with team member skills

### Escalation Rules Table (Enhanced)

```sql
ALTER TABLE escalation_rules ADD COLUMN escalation_level integer DEFAULT 1;
ALTER TABLE escalation_rules ADD COLUMN category_id uuid;
ALTER TABLE escalation_rules ADD COLUMN department_id uuid;
ALTER TABLE escalation_rules ADD COLUMN escalate_to_team_id uuid;
ALTER TABLE escalation_rules ADD COLUMN escalate_to_department_id uuid;
ALTER TABLE escalation_rules ADD COLUMN notify_department_manager boolean DEFAULT true;
ALTER TABLE escalation_rules ADD COLUMN requires_approval boolean DEFAULT false;
```

### Department Hierarchy Table

```sql
CREATE TABLE department_hierarchy (
  id uuid PRIMARY KEY,
  parent_department_id uuid REFERENCES departments ON DELETE CASCADE,
  child_department_id uuid REFERENCES departments ON DELETE CASCADE,
  escalation_order integer DEFAULT 1,
  created_at timestamp,
  UNIQUE(parent_department_id, child_department_id)
);
```

## Departments

### Available Departments

Based on your user data, the system creates:

| Department | Code | Manager | Teams |
|------------|------|---------|-------|
| Training | TRN | Team Lead | Multiple teams by location |
| Sales & Client Servicing | SCS | Admin/Jim | Primary sales team |
| Marketing | MKT | Team Lead | Marketing & social teams |
| Studio Operations & Amenities | SOA | Team Lead | Operations teams |
| Brand & Policies | BRP | Policy Manager | Brand management team |
| Accounts | ACC | Finance Manager | Finance & accounting team |
| Studio Operations | SOP | Operations Lead | Studio operations team |

### Department Features

1. **Hierarchical Support**: Parent-child department relationships
2. **Manager Assignment**: Each department has an assigned manager
3. **Contact Information**: Email and phone for departmental communication
4. **Activity Status**: Enable/disable departments without deletion
5. **Metrics**: Track team capacity, load, and utilization

## Teams

### Team Structure

Each team:
- Belongs to a department
- Has a team lead (manager)
- Manages ticket capacity
- Tracks current workload
- Contains multiple team members

### Team Roles

**Within Team:**
- **Member**: Regular team member
- **Lead**: Team leader with management permissions
- **Backup Lead**: Secondary leader for coverage

### Team Management

```typescript
// Create a team
const newTeam = await db.insert(teams).values({
  name: 'Customer Support Team A',
  departmentId: deptId,
  teamCode: 'CST_A_001',
  managerId: leaderId,
  maxCapacity: 15,
  isActive: true,
});

// Update team load
await db.update(teams)
  .set({ currentLoad: 5 })
  .where(eq(teams.id, teamId));
```

## Team Members

### Assignment

Users are assigned to teams with:

1. **Primary Team**: Main team assignment
2. **Secondary Teams**: Additional team memberships
3. **Role in Team**: lead, backup_lead, or member
4. **Skills**: JSON array of expertise areas
5. **Availability**: Current status (available, busy, away, offline)
6. **Capacity**: Max and current ticket count

### Skills System

Skills can include:
- `general_support`
- `billing_support`
- `technical_support`
- `escalation_handling`
- `vip_customer_care`
- Custom department-specific skills

### User Data Mapping

Your current users are automatically assigned:

```
vivaran@physique57mumbai.com → Training Team
anisha@physique57india.com → Training Team
jimmeey@physique57india.com → Sales & Client Servicing Team
ayesha@physique57mumbai.com → Marketing Team
zahur@physique57mumbai.com → Studio Operations & Amenities Team
mitali@physique57india.com → Brand & Policies Team
gaurav@physique57mumbai.com → Accounts Team
```

## Routing Rules

### How Routing Works

1. **Rule Matching**: System finds applicable routing rule based on:
   - Ticket category
   - Ticket priority
   - Client status
   - Department requirements

2. **Load Balancing**: Selected strategy determines assignment:
   - **Round Robin**: Fair distribution
   - **Least Loaded**: Assign to least busy team
   - **Random**: Unpredictable distribution
   - **Skill Based**: Match skills with requirement

3. **Escalation Trigger**: If not resolved by deadline:
   - Automatic escalation to higher priority team
   - Manager notification
   - Ticket flagged as escalated

### Example Routing Rule

```typescript
const rule = {
  name: 'Critical Billing to SCS Team',
  code: 'ROUTE_BILL_SCS_001',
  priority: 10, // High priority rule
  categoryId: 'billing-category-id',
  priorityLevel: 'critical',
  departmentId: 'scs-dept-id',
  routeToTeamId: 'scs-team-id',
  loadBalancingStrategy: 'least_loaded',
  autoEscalateAfterMinutes: 30,
  escalateToTeamId: 'manager-team-id',
  requiredSkills: ['billing_support', 'general_support'],
};
```

### Load Balancing Strategies

**Round Robin**
- Cycles through team members
- Ensures equal distribution
- Best for homogeneous teams

**Least Loaded**
- Assigns to member with fewest tickets
- Balances current workload
- Best for mixed-skill teams

**Skill Based**
- Matches member skills with ticket needs
- Requires skills defined for members and rules
- Best for specialized support

**Random**
- Unpredictable assignment
- Good for load testing
- Not recommended for production

## Escalation Rules

### Escalation Levels

```
Level 1: Team Member → Supervisor/Lead
         ↓ (If not resolved in X minutes)
Level 2: Team Lead → Department Manager
         ↓ (If not resolved in Y minutes)
Level 3: Department Manager → Executive
```

### Escalation Triggers

1. **Time-Based**: Not resolved within SLA time
2. **Priority-Based**: High/critical tickets escalate faster
3. **Manual**: User manually escalates
4. **Rule-Based**: Custom business rules

### Default Escalation Rules

| Priority | Escalate After | Target Role | Notify |
|----------|----------------|-------------|--------|
| Critical | 15 minutes | Admin | Yes |
| High | 30 minutes | Manager | Yes |
| Medium | 60 minutes | Team Member | Yes |
| Low | 4 hours | Team Member | No |

## RLS Policies

### Role-Based Access Control

#### Admin
- ✅ View all departments, teams, tickets
- ✅ Manage all users and assignments
- ✅ Create and edit routing rules
- ✅ Override any escalation

#### Manager (Department)
- ✅ View department resources
- ✅ Manage team members in department
- ✅ View tickets assigned to department
- ✅ Edit department-specific rules
- ❌ Cannot manage other departments

#### Team Lead
- ✅ View own team members
- ✅ View team member profiles
- ✅ Assign tasks within team
- ✅ View team tickets
- ❌ Cannot modify team structure

#### Team Member/Support Staff
- ✅ View own profile
- ✅ View own tickets
- ✅ View team members
- ✅ Add comments to tickets
- ❌ Cannot view other teams' data

### RLS Policy Examples

```sql
-- Admin can see all users
CREATE POLICY "admin_select_all_users" ON "public"."users"
    FOR SELECT
    USING (auth.uid() IS NOT NULL AND 
           EXISTS (SELECT 1 FROM "public"."users" 
                   WHERE id = auth.uid() AND role = 'admin'));

-- Team members can see own team's tickets
CREATE POLICY "team_view_department_tickets" ON "public"."tickets"
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."team_members"
        WHERE user_id = auth.uid()
        AND department_id = (
            SELECT id FROM "public"."departments"
            WHERE name = tickets.department::text
        )
    ));
```

## API Endpoints

### Departments

```
GET    /api/departments
GET    /api/departments/:id
GET    /api/departments/:id/stats
POST   /api/departments
PUT    /api/departments/:id
```

### Teams

```
GET    /api/teams
GET    /api/teams/:id
GET    /api/teams/:id/stats
GET    /api/teams/department/:departmentId
POST   /api/teams
PUT    /api/teams/:id
```

### Team Members

```
GET    /api/team-members
GET    /api/team-members/:id
GET    /api/team-members/team/:teamId
GET    /api/team-members/user/:userId
POST   /api/team-members
PUT    /api/team-members/:id
DELETE /api/team-members/:id
```

### Routing Rules

```
GET    /api/routing-rules
GET    /api/routing-rules/active
GET    /api/routing-rules/category/:categoryId
POST   /api/routing-rules
PUT    /api/routing-rules/:id
DELETE /api/routing-rules/:id
POST   /api/routing/find-target  # Find best assignment target
```

### Escalation

```
POST   /api/escalation/escalate-ticket
```

## Role-Based Access Control

### Permission Matrix

| Action | Admin | Manager | Team Lead | Support Staff |
|--------|-------|---------|-----------|---------------|
| View All Tickets | ✅ | ❌* | ❌* | ❌* |
| Create Tickets | ✅ | ✅ | ✅ | ✅ |
| Assign Tickets | ✅ | ✅* | ✅* | ❌ |
| Escalate Tickets | ✅ | ✅* | ✅ | ❌ |
| Manage Teams | ✅ | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅* | ❌ | ❌ |
| Manage Routing Rules | ✅ | ✅* | ❌ | ❌ |

*Only within their department/team

## Implementation Guide

### 1. Run Database Setup

```bash
# Execute SQL migrations
psql $DATABASE_URL < script/departments-teams-setup.sql

# Or use Drizzle migrations
npm run db:migrate
```

### 2. Seed Initial Data

```bash
# Run seeding script
npx ts-node script/seed-departments-teams.ts
```

### 3. Initialize Routes

Update your main server file:

```typescript
import departmentRoutes from './routes-departments';

app.use('/api', departmentRoutes);
```

### 4. Update Frontend

Import schema types:

```typescript
import type { Department, Team, TeamMember, RoutingRule } from '../shared/schema-departments-teams';
```

### 5. Create Management UI

- Department management dashboard
- Team configuration interface
- User assignment forms
- Routing rule builder
- Escalation rule manager

### 6. Integrate with Ticket Creation

When creating tickets:

```typescript
// Find best assignment target
const target = await fetch('/api/routing/find-target', {
  method: 'POST',
  body: JSON.stringify({
    categoryId: ticket.categoryId,
    priority: ticket.priority,
    departmentName: ticket.department,
  }),
});
```

## Examples

### Create a Department

```typescript
const newDept = await db.insert(departments).values({
  name: 'Customer Success',
  code: 'CS',
  description: 'Customer Success Team',
  managerId: managerId,
  email: 'cs@physique57.com',
  phone: '+91-xxx-xxx-xxxx',
  isActive: true,
});
```

### Add User to Team

```typescript
const member = await db.insert(teamMembers).values({
  userId: userId,
  teamId: teamId,
  departmentId: departmentId,
  roleInTeam: 'member',
  isPrimaryTeam: true,
  maxTickets: 10,
  skills: ['general_support', 'billing_support'],
  availabilityStatus: 'available',
});
```

### Create Routing Rule

```typescript
const rule = await db.insert(routingRules).values({
  name: 'Route Complaints to Training',
  code: 'ROUTE_COMPLAINT_TRN_001',
  priority: 5,
  categoryId: complaintCategoryId,
  departmentId: trainingDeptId,
  routeToTeamId: trainingTeamId,
  loadBalancingStrategy: 'least_loaded',
  autoEscalateAfterMinutes: 60,
  isActive: true,
});
```

## Database Functions

### get_best_assignment_target()

Finds the best team or user for ticket assignment.

```sql
SELECT * FROM get_best_assignment_target(
  'category-id',
  'high',
  'Training'
);
```

### get_available_team_member()

Gets available team members sorted by current workload.

```sql
SELECT * FROM get_available_team_member('team-id');
```

### escalate_ticket()

Handles ticket escalation with notifications.

```sql
SELECT escalate_ticket(
  'ticket-id',
  'SLA time exceeded'
);
```

## Monitoring and Analytics

### Department Statistics

```typescript
GET /api/departments/:id/stats
Response:
{
  departmentId: "...",
  departmentName: "Sales & Client Servicing",
  totalTeams: 3,
  totalMembers: 12,
  totalCapacity: 30,
  currentLoad: 18,
  utilizationPercentage: 60
}
```

### Team Statistics

```typescript
GET /api/teams/:id/stats
Response:
{
  teamId: "...",
  teamName: "Sales Team A",
  totalMembers: 5,
  maxCapacity: 15,
  currentLoad: 8,
  utilizationPercentage: 53.33,
  availableMembers: 4
}
```

## Troubleshooting

### Issue: Users not appearing in teams

**Solution**: Run seed script to assign users to departments and teams.

### Issue: Tickets not routing correctly

**Check**: 
1. Routing rules are active (`is_active = true`)
2. Priority levels match (case-sensitive)
3. Category is assigned correctly

### Issue: Escalation not working

**Check**:
1. Escalation rules are created and active
2. SLA deadline is set correctly on ticket
3. Database function `escalate_ticket` is callable

## Future Enhancements

1. **Performance Optimization**: Add caching for routing rules
2. **Advanced Analytics**: Track routing success rates
3. **ML-Based Routing**: Intelligent assignment based on historical data
4. **Skill-Based Matching**: Improved skill matching algorithms
5. **Workload Forecasting**: Predict ticket volume by department
6. **Auto-Scaling**: Dynamically adjust team capacity
7. **Integration**: Connect with external ticketing systems

## Support

For issues or questions, contact the development team or refer to the main README.
