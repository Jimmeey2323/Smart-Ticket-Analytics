# Departments, Teams & Routing System - Quick Reference

> A comprehensive organizational management and intelligent ticket routing system for Smart Ticket Analytics

## 🚀 Quick Start (5 minutes)

### 1. Run Database Setup
```bash
psql $DATABASE_URL < script/departments-teams-setup.sql
```

### 2. Seed Data
```bash
npx ts-node script/seed-departments-teams.ts
```

### 3. Add Routes to Server
```typescript
// In server/index.ts
import departmentRoutes from './routes-departments';
app.use('/api', departmentRoutes);
```

### 4. Test API
```bash
curl http://localhost:5003/api/departments
curl http://localhost:5003/api/teams
curl http://localhost:5003/api/team-members
curl http://localhost:5003/api/routing-rules/active
```

---

## 📁 File Structure

```
├── script/
│   ├── departments-teams-setup.sql          (500 lines)
│   ├── seed-departments-teams.ts            (300 lines)
│   └── setup-departments-teams.sh           (Auto-setup)
├── server/
│   └── routes-departments.ts                (600 lines)
├── shared/
│   └── schema-departments-teams.ts          (400 lines)
├── DEPARTMENTS_TEAMS_ROUTING.md             (Comprehensive guide)
├── INTEGRATION_GUIDE.md                     (Setup instructions)
├── SETUP_SUMMARY.md                         (Overview)
├── IMPLEMENTATION_CHECKLIST.md              (Verification steps)
├── COMMON_QUERIES.sql                       (40+ queries)
└── TEST_DATA.sql                            (Test fixtures)
```

---

## 🏗️ Architecture

### Database Schema
- **departments** - 7 organizational units
- **teams** - Sub-groups within departments
- **team_members** - User assignments to teams
- **routing_rules** - Intelligent ticket routing
- **escalation_rules** - Auto-escalation rules
- **department_hierarchy** - Parent-child relationships

### Key Features
✅ **Intelligent Routing** - Route tickets to right team/user
✅ **Load Balancing** - Distribute work fairly
✅ **Escalation** - Automatic priority escalation
✅ **RLS Security** - Role-based access control
✅ **Multi-Strategy** - Round-robin, least-loaded, skill-based
✅ **Auto-Assignment** - Tickets auto-assigned on creation

---

## 📊 Departments Included

| Department | Code | Users | Purpose |
|------------|------|-------|---------|
| Training | TRN | 3 | Staff training |
| Sales & Client Servicing | SCS | 2 | Client support |
| Marketing | MKT | 2 | Marketing campaigns |
| Studio Operations & Amenities | SOA | 2 | Facility management |
| Brand & Policies | BRP | 1 | Brand management |
| Accounts | ACC | 1 | Finance |
| Studio Operations | SOP | 1 | Operations |

---

## 🔌 API Endpoints

### Departments
```
GET    /api/departments              List all
GET    /api/departments/:id          Get one
GET    /api/departments/:id/stats    Stats
POST   /api/departments              Create
PUT    /api/departments/:id          Update
```

### Teams
```
GET    /api/teams                    List all
GET    /api/teams/:id                Get one
GET    /api/teams/:id/stats          Stats
GET    /api/teams/department/:deptId By department
POST   /api/teams                    Create
PUT    /api/teams/:id                Update
```

### Team Members
```
GET    /api/team-members             List all
GET    /api/team-members/team/:id    By team
GET    /api/team-members/user/:id    User's teams
POST   /api/team-members             Add member
PUT    /api/team-members/:id         Update
DELETE /api/team-members/:id         Remove
```

### Routing
```
GET    /api/routing-rules            All rules
GET    /api/routing-rules/active     Active only
POST   /api/routing/find-target      Find target
POST   /api/escalation/escalate-ticket   Escalate
```

---

## 💻 Integration Example

```typescript
// 1. Get routing target
const target = await fetch('/api/routing/find-target', {
  method: 'POST',
  body: JSON.stringify({
    categoryId: ticket.categoryId,
    priority: ticket.priority,
    departmentName: ticket.department,
  }),
});

// 2. Create ticket with assignment
const ticket = await db.insert(tickets).values({
  ...ticketData,
  assigneeId: target.userId,
});

// 3. Update team load
await db.update(teams).set({
  currentLoad: (team.currentLoad || 0) + 1,
}).where(eq(teams.id, target.teamId));
```

---

## 🔐 Access Control

| Role | Can View | Can Manage |
|------|----------|-----------|
| Admin | All data | Everything |
| Manager | Department data | Department resources |
| Team Lead | Team data | Team members |
| Member | Own data | Nothing |

---

## 🧪 Testing

### Test Routing
```sql
-- Find routing target for category
SELECT * FROM routing_rules 
WHERE is_active = true 
AND category_id = '...' 
ORDER BY priority LIMIT 1;
```

### Test Load
```sql
-- Check team utilization
SELECT name, current_load, max_capacity,
  ROUND(100.0 * current_load / max_capacity, 1) as utilization
FROM teams;
```

### Test Assignment
```sql
-- Check ticket assignment
SELECT ticket_number, category_id, assignee_id, 
  (SELECT full_name FROM users WHERE id = assignee_id)
FROM tickets 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `DEPARTMENTS_TEAMS_ROUTING.md` | Complete guide (600+ lines) |
| `INTEGRATION_GUIDE.md` | Step-by-step integration |
| `IMPLEMENTATION_CHECKLIST.md` | Verification steps |
| `COMMON_QUERIES.sql` | 40+ useful queries |
| `TEST_DATA.sql` | Test fixtures |
| `SETUP_SUMMARY.md` | Overview |

---

## 🐛 Common Issues

### "No routing rule found"
```bash
# Check routing rules exist
SELECT COUNT(*) FROM routing_rules WHERE is_active = true;
# If empty, create routing rules
```

### "User not in team"
```bash
# Check user team assignment
SELECT * FROM team_members WHERE user_id = '...';
# If empty, run seed script or manually add
```

### "RLS policy blocking"
```bash
# Check user role
SELECT role FROM users WHERE id = '...';
# Verify RLS policy allows access
```

---

## 📈 Monitoring

### Dashboard Query
```sql
SELECT 
    d.name as Department,
    COUNT(DISTINCT t.id) as Teams,
    COUNT(DISTINCT tm.user_id) as Members,
    SUM(t.current_load) as Load,
    SUM(t.max_capacity) as Capacity
FROM departments d
LEFT JOIN teams t ON d.id = t.department_id
LEFT JOIN team_members tm ON d.id = tm.department_id
GROUP BY d.id, d.name;
```

### Team Load Query
```sql
SELECT name, current_load, max_capacity,
  ROUND(100.0 * current_load / max_capacity, 1) as utilization
FROM teams
ORDER BY utilization DESC;
```

---

## 🎯 Load Balancing Strategies

**Round Robin**
- Fair distribution across team members
- Best for: Homogeneous teams

**Least Loaded**
- Assign to member with fewest tickets
- Best for: Variable skill teams

**Skill Based**
- Match skills with requirements
- Best for: Specialized support

**Random**
- Random selection
- Best for: Testing only

---

## 🔄 Escalation Chain

```
Issue occurs
    ↓
Level 1: Assigned team member (15-60 mins based on priority)
    ↓
Not resolved? Escalate to supervisor
    ↓
Level 2: Team lead/Manager (30-120 mins)
    ↓
Still not resolved? Escalate to executive
    ↓
Level 3: Department head/Admin (manual review)
```

---

## ✅ Verification Checklist

Quick verification after setup:

```bash
# 1. Check departments
curl http://localhost:5003/api/departments | jq 'length'
# Should return 7

# 2. Check teams
curl http://localhost:5003/api/teams | jq 'length'
# Should return >= 7

# 3. Check team members
curl http://localhost:5003/api/team-members | jq 'length'
# Should return >= 12 (all users)

# 4. Check routing rules
curl http://localhost:5003/api/routing-rules/active | jq 'length'
# Should return > 0
```

---

## 🚀 Deployment

### Development
```bash
npm run dev
# API available at http://localhost:5003
```

### Production
```bash
npm run build
npm run start
# Monitor logs for errors
```

---

## 📞 Support

1. Check documentation in `DEPARTMENTS_TEAMS_ROUTING.md`
2. Review integration steps in `INTEGRATION_GUIDE.md`
3. Run diagnostic queries from `COMMON_QUERIES.sql`
4. Check logs for error messages

---

## 🎉 Summary

You now have a **production-ready** system that:

✅ Organizes 12+ users into 7 departments and 10+ teams
✅ Automatically routes tickets to the right team
✅ Balances workload across team members
✅ Escalates tickets based on priority and time
✅ Enforces role-based access control
✅ Provides comprehensive REST API (20+ endpoints)
✅ Includes extensive documentation

---

## 📝 Version Info

- **Created**: December 2025
- **Schema Version**: 1.0
- **API Version**: 1.0
- **Database**: PostgreSQL 13+
- **ORM**: Drizzle ORM

---

## 🔗 Related Files

- Main application: `/Smart-Ticket-Analytics/`
- Database schema: `shared/schema-departments-teams.ts`
- Backend routes: `server/routes-departments.ts`
- Setup script: `script/departments-teams-setup.sql`
- Seed script: `script/seed-departments-teams.ts`

---

**Ready to deploy? Start with the 5-minute Quick Start above!**
