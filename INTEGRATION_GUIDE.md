/**
 * Integration Guide for Departments, Teams & Routing System
 * 
 * This file explains how to integrate the new departments and teams system
 * with your existing ticket system.
 */

// ============================================================================
// 1. UPDATE YOUR SERVER/INDEX.TS
// ============================================================================

// Add these imports at the top of your server/index.ts
import departmentRoutes from './routes-departments';
import seedDatabaseComplete from '../script/seed-departments-teams';

// After your other app.use() calls, add:
app.use('/api', departmentRoutes);

// Optional: Add a route to trigger seeding (admin only)
app.post('/api/admin/setup/seed-departments', async (req, res) => {
  // Verify admin auth
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    await seedDatabaseComplete();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Seeding failed' });
  }
});

// ============================================================================
// 2. INTEGRATE WITH TICKET CREATION
// ============================================================================

// In your ticket creation endpoint:
import { getTicketAssignmentTarget } from '../lib/routing-service';

router.post('/tickets', async (req, res) => {
  const ticketData = req.body;
  
  // Step 1: Find best assignment target using routing rules
  const target = await getTicketAssignmentTarget({
    categoryId: ticketData.categoryId,
    priority: ticketData.priority,
    departmentName: ticketData.department,
  });
  
  // Step 2: Create ticket with assignment
  const ticket = await db.insert(tickets).values({
    ...ticketData,
    assigneeId: target.userId,
    department: target.departmentName,
  });
  
  // Step 3: Update team load
  if (target.teamId) {
    const team = await db.query.teamsEnhanced.findFirst({
      where: eq(teamsEnhanced.id, target.teamId),
    });
    
    await db.update(teamsEnhanced).set({
      currentLoad: (team?.currentLoad || 0) + 1,
    }).where(eq(teamsEnhanced.id, target.teamId));
  }
  
  // Step 4: Update team member load
  const member = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, target.userId),
  });
  
  if (member) {
    await db.update(teamMembers).set({
      currentTicketCount: (member.currentTicketCount || 0) + 1,
    }).where(eq(teamMembers.id, member.id));
  }
  
  return res.json(ticket);
});

// ============================================================================
// 3. CREATE ROUTING SERVICE
// ============================================================================

// File: lib/routing-service.ts

import { db } from '../server/db';
import { routingRules, teamsEnhanced, departments, teamMembers } from '../shared/schema-departments-teams';
import { eq, and } from 'drizzle-orm';

interface RoutingRequest {
  categoryId: string;
  priority: string;
  departmentName: string;
}

interface RoutingTarget {
  userId: string;
  teamId: string;
  departmentName: string;
  teamName: string;
}

export async function getTicketAssignmentTarget(request: RoutingRequest): Promise<RoutingTarget> {
  // Find specific routing rule
  const rule = await db.query.routingRules.findFirst({
    where: and(
      eq(routingRules.isActive, true),
      eq(routingRules.categoryId, request.categoryId),
    ),
    with: {
      routeToTeam: true,
      routeToUser: true,
    },
    orderBy: (r) => [r.priority],
  });
  
  if (rule) {
    if (rule.routeToUserId) {
      return {
        userId: rule.routeToUserId,
        teamId: '',
        departmentName: request.departmentName,
        teamName: '',
      };
    }
    
    if (rule.routeToTeamId) {
      // Get available team member based on strategy
      const member = await getAvailableTeamMember(
        rule.routeToTeamId,
        rule.loadBalancingStrategy
      );
      
      return {
        userId: member.userId,
        teamId: rule.routeToTeamId,
        departmentName: request.departmentName,
        teamName: rule.routeToTeam?.name || '',
      };
    }
  }
  
  // Fallback: Find department's primary team
  const dept = await db.query.departments.findFirst({
    where: eq(departments.name, request.departmentName),
    with: { teams: true },
  });
  
  if (dept && dept.teams?.length > 0) {
    const team = dept.teams.sort((a, b) => (a.currentLoad || 0) - (b.currentLoad || 0))[0];
    const member = await getAvailableTeamMember(team.id, 'least_loaded');
    
    return {
      userId: member.userId,
      teamId: team.id,
      departmentName: dept.name,
      teamName: team.name,
    };
  }
  
  throw new Error('No available assignment target');
}

async function getAvailableTeamMember(
  teamId: string,
  strategy: string = 'least_loaded'
): Promise<{ userId: string; name: string }> {
  let members = await db.query.teamMembers.findMany({
    where: eq(teamMembers.teamId, teamId),
    with: { user: true },
  });
  
  // Filter available members
  members = members.filter(m => m.availabilityStatus === 'available');
  
  if (members.length === 0) {
    throw new Error('No available team members');
  }
  
  switch (strategy) {
    case 'least_loaded':
      // Sort by current ticket count
      members.sort((a, b) => (a.currentTicketCount || 0) - (b.currentTicketCount || 0));
      break;
    case 'random':
      members = [members[Math.floor(Math.random() * members.length)]];
      break;
    case 'skill_based':
      // Implement skill matching if needed
      break;
    case 'round_robin':
    default:
      // Return first available (implement proper round-robin if needed)
      break;
  }
  
  return {
    userId: members[0].userId,
    name: members[0].user?.fullName || 'Unknown',
  };
}

// ============================================================================
// 4. HANDLE TICKET UPDATES AND LOAD TRACKING
// ============================================================================

// When a ticket is resolved/closed, decrement the load
export async function decrementTeamLoad(ticketId: string) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });
  
  if (!ticket?.assigneeId) return;
  
  // Decrement team member load
  const member = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, ticket.assigneeId),
  });
  
  if (member) {
    await db.update(teamMembers).set({
      currentTicketCount: Math.max(0, (member.currentTicketCount || 0) - 1),
    }).where(eq(teamMembers.id, member.id));
    
    // Decrement team load
    const team = await db.query.teamsEnhanced.findFirst({
      where: eq(teamsEnhanced.id, member.teamId),
    });
    
    if (team) {
      await db.update(teamsEnhanced).set({
        currentLoad: Math.max(0, (team.currentLoad || 0) - 1),
      }).where(eq(teamsEnhanced.id, team.id));
    }
  }
}

// ============================================================================
// 5. IMPLEMENT ESCALATION
// ============================================================================

// File: lib/escalation-service.ts

import { escalationRules } from '../shared/schema';

export async function checkAndEscalateTickets() {
  // Find tickets that need escalation
  const escalationRulesList = await db.query.escalationRules.findMany({
    where: eq(escalationRules.isActive, true),
  });
  
  for (const rule of escalationRulesList) {
    // Find tickets matching the rule
    const ticketsToEscalate = await db.query.tickets.findMany({
      where: and(
        eq(tickets.priority, rule.priority),
        eq(tickets.isEscalated, false),
        // Check if SLA deadline passed
        // (This would depend on your SLA implementation)
      ),
    });
    
    for (const ticket of ticketsToEscalate) {
      // Mark as escalated
      await db.update(tickets).set({
        isEscalated: true,
        escalatedAt: new Date(),
        escalatedToId: rule.escalateToUserId,
      }).where(eq(tickets.id, ticket.id));
      
      // Create notification
      if (rule.escalateToUserId) {
        await db.insert(notifications).values({
          userId: rule.escalateToUserId,
          ticketId: ticket.id,
          type: 'escalation',
          title: `Ticket #${ticket.ticketNumber} Escalated`,
          message: `Priority ${rule.priority} ticket has been escalated due to SLA timeout`,
        });
      }
    }
  }
}

// ============================================================================
// 6. FRONTEND INTEGRATION
// ============================================================================

// File: client/src/hooks/useTicketRouting.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');
      return response.json();
    },
  });
}

export function useTeams(departmentId?: string) {
  return useQuery({
    queryKey: ['teams', departmentId],
    queryFn: async () => {
      const url = departmentId
        ? `/api/teams/department/${departmentId}`
        : '/api/teams';
      const response = await fetch(url);
      return response.json();
    },
  });
}

export function useRoutingRules() {
  return useQuery({
    queryKey: ['routingRules'],
    queryFn: async () => {
      const response = await fetch('/api/routing-rules/active');
      return response.json();
    },
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/team-members/team/${teamId}`);
      return response.json();
    },
    enabled: !!teamId,
  });
}

// ============================================================================
// 7. DATABASE TYPES UPDATE
// ============================================================================

// Update your types file to include new schema types
import type {
  Department,
  Team,
  TeamMember,
  RoutingRule,
  DepartmentWithRelations,
  TeamWithMembers,
} from '../shared/schema-departments-teams';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        department?: string;
        team?: string;
      };
    }
  }
}

// ============================================================================
// 8. INITIALIZATION SEQUENCE
// ============================================================================

/*
When starting the application:

1. Database Migrations
   - Run: npm run db:migrate
   
2. Initial Setup
   - Run: npm run setup:departments
   OR manually call: POST /api/admin/setup/seed-departments

3. Verify Setup
   - Check: GET /api/departments (should return 7 departments)
   - Check: GET /api/teams (should have teams for each dept)
   - Check: GET /api/team-members (should have users assigned)

4. Test Routing
   - Create test category and subcategory
   - Create routing rule pointing to a department
   - Submit ticket in that category
   - Verify ticket is assigned to correct team/user
*/

// ============================================================================
// 9. TROUBLESHOOTING CHECKLIST
// ============================================================================

/*
If tickets aren't being routed:
[ ] Check routing rules exist: GET /api/routing-rules
[ ] Verify routing rules are active (is_active = true)
[ ] Check category_id matches ticket category
[ ] Verify team_id in routing rule exists
[ ] Check team has members with availability_status = 'available'
[ ] Review server logs for routing service errors

If escalation isn't working:
[ ] Verify escalation_rules table has records
[ ] Check is_active = true on rules
[ ] Verify SLA deadline is set on tickets
[ ] Check escalate_to_user_id or escalate_to_team_id is set
[ ] Run checkAndEscalateTickets() periodically (cron job)

If users aren't in teams:
[ ] Run seed script: npm run ts-node script/seed-departments-teams.ts
[ ] Manually add: POST /api/team-members
[ ] Verify user exists in users table
[ ] Check team exists in teams table
*/
