# Smart Ticket Analytics - Database Schema

**Export Date:** December 14, 2025  
**Database:** Supabase PostgreSQL

---

## Tables Overview

| Table | Type | Primary Key | Purpose |
|-------|------|-------------|---------|
| users | Core | users_pkey | User accounts and authentication |
| teams | Core | teams_pkey | Team organization |
| locations | Core | locations_pkey | Physical locations/studios |
| categories | Tickets | categories_pkey | Ticket categories |
| subcategories | Tickets | subcategories_pkey | Sub-categories within categories |
| tickets | Tickets | tickets_pkey | Main ticket records |
| ticket_responses | Tickets | ticket_responses_pkey | Responses to tickets |
| ticket_comments | Tickets | ticket_comments_pkey | Comments on tickets |
| ticket_attachments | Tickets | ticket_attachments_pkey | File attachments on tickets |
| ticket_history | Tickets | ticket_history_pkey | Audit log of ticket changes |
| form_fields | Configuration | form_fields_pkey | Dynamic form field definitions |
| field_groups | Configuration | field_groups_pkey | Grouped form fields |
| notifications | Communications | notifications_pkey | User notifications |
| assignment_rules | Logic | assignment_rules_pkey | Rules for auto-assignment |
| escalation_rules | Logic | escalation_rules_pkey | Rules for escalation |
| saved_filters | User Data | saved_filters_pkey | Saved ticket filters |

---

## Foreign Key Relationships

```
users
  ├── teams.manager_id → users.id
  ├── tickets.assignee_id → users.id
  ├── tickets.reporter_id → users.id
  ├── ticket_responses.user_id → users.id
  ├── ticket_attachments.uploaded_by → users.id
  └── notifications.user_id → users.id

teams
  └── tickets.team_id → teams.id

locations
  └── (referenced by various tables)

categories
  ├── subcategories.category_id → categories.id
  └── form_fields.category_id → categories.id

subcategories
  └── (references categories)

tickets
  ├── ticket_responses.ticket_id → tickets.id
  ├── ticket_attachments.ticket_id → tickets.id
  ├── ticket_comments.ticket_id → tickets.id
  ├── ticket_history.ticket_id → tickets.id
  ├── notifications.ticket_id → tickets.id
  ├── assignee_id → users.id
  ├── reporter_id → users.id
  └── team_id → teams.id
```

---

## Unique Constraints

| Constraint | Table | Column(s) | Purpose |
|-----------|-------|-----------|---------|
| tickets_ticket_number_key | tickets | ticket_number | Unique ticket identifier |
| users_email_key | users | email | Unique email per user |
| categories_name_key | categories | name | Unique category name |
| form_fields_unique_id_key | form_fields | unique_id | Unique field identifier |

---

## Core Tables Schema

### users
- **id** (uuid, PRIMARY KEY)
- **email** (VARCHAR, UNIQUE)
- **full_name** (VARCHAR)
- **role** (VARCHAR) - admin, team_member, support_staff, etc.
- **department** (VARCHAR)
- **is_active** (BOOLEAN)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- Manages: teams, ticket assignments

### teams
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR)
- **manager_id** (uuid, FOREIGN KEY → users.id)
- **description** (TEXT)
- **is_active** (BOOLEAN)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **department_id** (uuid, FOREIGN KEY → departments.id) ⭐ NEW
- **team_code** (VARCHAR) ⭐ NEW
- **email** (VARCHAR) ⭐ NEW
- **phone** (VARCHAR) ⭐ NEW
- **max_capacity** (INTEGER) ⭐ NEW
- **current_load** (INTEGER) ⭐ NEW
- **is_active** (BOOLEAN) ⭐ NEW

### locations
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR)
- **address** (TEXT)
- **city** (VARCHAR)
- **state** (VARCHAR)
- **zipcode** (VARCHAR)

---

## Ticket Tables Schema

### categories
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR, UNIQUE)
- **description** (TEXT)
- **icon** (VARCHAR)
- **color** (VARCHAR)
- **is_active** (BOOLEAN)
- **created_at** (TIMESTAMP)

### subcategories
- **id** (uuid, PRIMARY KEY)
- **category_id** (uuid, FOREIGN KEY → categories.id)
- **name** (VARCHAR)
- **description** (TEXT)
- **is_active** (BOOLEAN)
- **created_at** (TIMESTAMP)

### tickets
- **id** (uuid, PRIMARY KEY)
- **ticket_number** (VARCHAR, UNIQUE)
- **title** (VARCHAR)
- **description** (TEXT)
- **status** (VARCHAR) - open, in_progress, resolved, closed
- **priority** (VARCHAR) - low, medium, high, critical
- **category_id** (uuid)
- **sub_category_id** (uuid)
- **assignee_id** (uuid, FOREIGN KEY → users.id)
- **reporter_id** (uuid, FOREIGN KEY → users.id)
- **team_id** (uuid, FOREIGN KEY → teams.id)
- **department** (VARCHAR)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **resolved_at** (TIMESTAMP)

### ticket_responses
- **id** (uuid, PRIMARY KEY)
- **ticket_id** (uuid, FOREIGN KEY → tickets.id)
- **user_id** (uuid, FOREIGN KEY → users.id)
- **response_text** (TEXT)
- **created_at** (TIMESTAMP)

### ticket_comments
- **id** (uuid, PRIMARY KEY)
- **ticket_id** (uuid, FOREIGN KEY → tickets.id)
- **user_id** (uuid, FOREIGN KEY → users.id)
- **comment_text** (TEXT)
- **created_at** (TIMESTAMP)

### ticket_attachments
- **id** (uuid, PRIMARY KEY)
- **ticket_id** (uuid, FOREIGN KEY → tickets.id)
- **file_url** (VARCHAR)
- **file_name** (VARCHAR)
- **file_size** (INTEGER)
- **uploaded_by** (uuid, FOREIGN KEY → users.id)
- **uploaded_at** (TIMESTAMP)

### ticket_history
- **id** (uuid, PRIMARY KEY)
- **ticket_id** (uuid, FOREIGN KEY → tickets.id)
- **change_type** (VARCHAR)
- **old_value** (TEXT)
- **new_value** (TEXT)
- **changed_by** (uuid)
- **changed_at** (TIMESTAMP)

---

## Configuration Tables Schema

### form_fields
- **id** (uuid, PRIMARY KEY)
- **unique_id** (VARCHAR, UNIQUE)
- **category_id** (uuid, FOREIGN KEY → categories.id)
- **sub_category_id** (uuid)
- **field_name** (VARCHAR)
- **field_type** (VARCHAR) - text, dropdown, checkbox, date, etc.
- **is_required** (BOOLEAN)
- **options** (JSONB)
- **placeholder** (VARCHAR)
- **description** (TEXT)
- **order** (INTEGER)
- **created_at** (TIMESTAMP)

### field_groups
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR)
- **description** (TEXT)
- **category_id** (uuid)
- **fields** (JSONB)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)

---

## Logic & Automation Tables Schema

### assignment_rules
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR)
- **category_id** (uuid)
- **priority_level** (VARCHAR)
- **assign_to_team_id** (uuid)
- **assign_to_user_id** (uuid)
- **created_at** (TIMESTAMP)

### escalation_rules
- **id** (uuid, PRIMARY KEY)
- **priority** (VARCHAR)
- **escalate_after_minutes** (INTEGER)
- **escalate_to_user_id** (uuid)
- **is_active** (BOOLEAN)
- **created_at** (TIMESTAMP)
- **escalation_level** (INTEGER) ⭐ NEW
- **category_id** (uuid) ⭐ NEW
- **department_id** (uuid) ⭐ NEW
- **escalate_to_team_id** (uuid) ⭐ NEW
- **escalate_to_department_id** (uuid) ⭐ NEW
- **notify_department_manager** (BOOLEAN) ⭐ NEW
- **requires_approval** (BOOLEAN) ⭐ NEW

---

## User Data Tables Schema

### notifications
- **id** (uuid, PRIMARY KEY)
- **user_id** (uuid, FOREIGN KEY → users.id)
- **ticket_id** (uuid, FOREIGN KEY → tickets.id)
- **type** (VARCHAR)
- **title** (VARCHAR)
- **message** (TEXT)
- **is_read** (BOOLEAN)
- **created_at** (TIMESTAMP)

### saved_filters
- **id** (uuid, PRIMARY KEY)
- **user_id** (uuid, FOREIGN KEY → users.id)
- **filter_name** (VARCHAR)
- **filter_criteria** (JSONB)
- **created_at** (TIMESTAMP)

---

## New Tables (Added by departments-teams-setup.sql)

### departments ⭐ NEW
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR, UNIQUE)
- **code** (VARCHAR, UNIQUE)
- **description** (TEXT)
- **manager_id** (uuid, FOREIGN KEY → users.id)
- **parent_department_id** (uuid, FOREIGN KEY → departments.id)
- **email** (VARCHAR)
- **phone** (VARCHAR)
- **is_active** (BOOLEAN)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)

### team_members ⭐ NEW
- **id** (uuid, PRIMARY KEY)
- **user_id** (uuid, FOREIGN KEY → users.id)
- **team_id** (uuid, FOREIGN KEY → teams.id)
- **department_id** (uuid, FOREIGN KEY → departments.id)
- **role_in_team** (VARCHAR) - member, lead, backup_lead
- **is_primary_team** (BOOLEAN)
- **max_tickets** (INTEGER)
- **current_ticket_count** (INTEGER)
- **availability_status** (VARCHAR) - available, busy, away, offline
- **skills** (JSONB)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **UNIQUE(user_id, team_id)**

### routing_rules ⭐ NEW
- **id** (uuid, PRIMARY KEY)
- **name** (VARCHAR)
- **code** (VARCHAR, UNIQUE)
- **description** (TEXT)
- **priority** (INTEGER)
- **category_id** (uuid, FOREIGN KEY → categories.id)
- **sub_category_id** (uuid, FOREIGN KEY → subcategories.id)
- **priority_level** (VARCHAR)
- **department_id** (uuid, FOREIGN KEY → departments.id)
- **route_to_team_id** (uuid, FOREIGN KEY → teams.id)
- **route_to_user_id** (uuid, FOREIGN KEY → users.id)
- **load_balancing_strategy** (VARCHAR) - round_robin, least_loaded, random, skill_based
- **required_skills** (JSONB)
- **client_status_filter** (JSONB)
- **location_id** (uuid, FOREIGN KEY → locations.id)
- **auto_escalate_after_minutes** (INTEGER)
- **escalate_to_team_id** (uuid, FOREIGN KEY → teams.id)
- **escalate_to_user_id** (uuid, FOREIGN KEY → users.id)
- **is_active** (BOOLEAN)
- **created_by_id** (uuid, FOREIGN KEY → users.id)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)

### department_hierarchy ⭐ NEW
- **id** (uuid, PRIMARY KEY)
- **parent_department_id** (uuid, FOREIGN KEY → departments.id)
- **child_department_id** (uuid, FOREIGN KEY → departments.id)
- **escalation_order** (INTEGER)
- **created_at** (TIMESTAMP)
- **UNIQUE(parent_department_id, child_department_id)**

---

## Database Functions ⭐ NEW

### get_best_assignment_target()
Returns optimal team/user for ticket routing based on category, priority, and department.

**Parameters:**
- `p_category_id` (uuid)
- `p_priority` (varchar)
- `p_department_name` (varchar)

**Returns:**
- `target_type` (varchar) - 'team' or 'user'
- `target_id` (uuid)
- `target_name` (varchar)

### get_available_team_member()
Returns least-loaded available team member.

**Parameters:**
- `p_team_id` (uuid)

**Returns:**
- `user_id` (uuid)
- `user_name` (varchar)
- `current_ticket_count` (integer)

### escalate_ticket()
Handles automatic ticket escalation logic.

**Parameters:**
- `p_ticket_id` (uuid)
- `p_reason` (text)

---

## Row Level Security (RLS) Policies

### departments (Enabled)
- **admin_all_departments**: Admins have full access
- **manager_own_department**: Managers see their department
- **all_users_view_active_departments**: All users view active depts

### team_members (Enabled)
- **admin_all_team_members**: Admins manage all
- **team_lead_manage_members**: Leads manage their team
- **user_view_own_memberships**: Users see their memberships

### routing_rules (Enabled)
- **admin_all_routing_rules**: Admins manage all
- **user_view_active_routing_rules**: Users view active rules
- **dept_manager_manage_routing_rules**: Managers control dept rules

---

## Indexes

### Performance Indexes
- `idx_departments_manager_id` on departments(manager_id)
- `idx_departments_parent_id` on departments(parent_department_id)
- `idx_teams_department_id` on teams(department_id)
- `idx_team_members_user_id` on team_members(user_id)
- `idx_team_members_team_id` on team_members(team_id)
- `idx_team_members_department_id` on team_members(department_id)
- `idx_team_members_availability` on team_members(availability_status)
- `idx_routing_rules_category` on routing_rules(category_id)
- `idx_routing_rules_department` on routing_rules(department_id)
- `idx_routing_rules_team` on routing_rules(route_to_team_id)
- `idx_routing_rules_priority` on routing_rules(priority)
- `idx_routing_rules_active` on routing_rules(is_active, priority)
- `idx_tickets_department_status` on tickets(department, status)
- `idx_tickets_assignee_status` on tickets(assignee_id, status)

---

## Statistics

- **Total Tables:** 20 (16 existing + 4 new)
- **New Columns Added:** 9 (teams + escalation_rules)
- **New Tables Created:** 4 (departments, team_members, routing_rules, department_hierarchy)
- **New Functions:** 3 (get_best_assignment_target, get_available_team_member, escalate_ticket)
- **Foreign Keys:** 20+
- **Unique Constraints:** 4
- **RLS Policies:** 9 (new tables only)

---

## Migration Status

✅ **Ready for Production**
- All tables created
- All indexes in place
- RLS policies enabled on new tables
- Functions deployed
- No breaking changes to existing tables

