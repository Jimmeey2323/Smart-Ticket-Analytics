import { Router } from 'express';
import { db } from './db';
import { 
  departments, 
  teamsEnhanced, 
  teamMembers, 
  routingRules,
  departmentHierarchy
} from '../shared/schema-departments-teams';
import { eq, and, or, desc, isNull } from 'drizzle-orm';

const router = Router();

// ============================================================================
// DEPARTMENTS ENDPOINTS
// ============================================================================

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const allDepartments = await db.query.departments.findMany({
      with: {
        manager: true,
        teams: true,
        teamMembers: true,
      },
      orderBy: (dept: any) => [dept.name],
    });
    res.json(allDepartments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID
router.get('/departments/:id', async (req, res) => {
  try {
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, req.params.id),
      with: {
        manager: true,
        teams: {
          with: {
            teamMembers: {
              with: { user: true },
            },
          },
        },
        teamMembers: {
          with: { user: true },
        },
      },
    });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create department
router.post('/departments', async (req, res) => {
  try {
    const { name, code, description, managerId, email, phone } = req.body;
    
    const newDept = await db.insert(departments).values({
      name,
      code,
      description,
      managerId,
      email,
      phone,
      isActive: true,
    }).returning();
    
    res.status(201).json(newDept[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/departments/:id', async (req, res) => {
  try {
    const { name, code, description, managerId, email, phone, isActive } = req.body;
    
    const updated = await db.update(departments)
      .set({
        name,
        code,
        description,
        managerId,
        email,
        phone,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, req.params.id))
      .returning();
    
    if (!updated.length) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update department' });
  }
});

// ============================================================================
// TEAMS ENDPOINTS
// ============================================================================

// Get all teams
router.get('/teams', async (req, res) => {
  try {
    const allTeams = await db.query.teamsEnhanced.findMany({
      with: {
        manager: true,
        department: true,
        teamMembers: {
          with: { user: true },
        },
      },
      orderBy: (team: any) => [team.name],
    });
    res.json(allTeams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID
router.get('/teams/:id', async (req, res) => {
  try {
    const team = await db.query.teamsEnhanced.findFirst({
      where: eq(teamsEnhanced.id, req.params.id),
      with: {
        manager: true,
        department: true,
        teamMembers: {
          with: { user: true },
        },
      },
    });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get team by department
router.get('/teams/department/:departmentId', async (req, res) => {
  try {
    const deptTeams = await db.query.teamsEnhanced.findMany({
      where: eq(teamsEnhanced.departmentId, req.params.departmentId),
      with: {
        manager: true,
        teamMembers: {
          with: { user: true },
        },
      },
    });
    res.json(deptTeams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department teams' });
  }
});

// Create team
router.post('/teams', async (req, res) => {
  try {
    const { name, teamCode, description, managerId, departmentId, maxCapacity, email, phone } = req.body;
    
    const newTeam = await db.insert(teamsEnhanced).values({
      name,
      teamCode,
      description,
      managerId,
      departmentId,
      maxCapacity,
      email,
      phone,
      isActive: true,
      currentLoad: 0,
    }).returning();
    
    res.status(201).json(newTeam[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create team' });
  }
});

// Update team
router.put('/teams/:id', async (req, res) => {
  try {
    const { name, description, managerId, maxCapacity, email, phone, isActive, currentLoad } = req.body;
    
    const updated = await db.update(teamsEnhanced)
      .set({
        name,
        description,
        managerId,
        maxCapacity,
        email,
        phone,
        isActive,
        currentLoad,
        updatedAt: new Date(),
      })
      .where(eq(teamsEnhanced.id, req.params.id))
      .returning();
    
    if (!updated.length) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update team' });
  }
});

// ============================================================================
// TEAM MEMBERS ENDPOINTS
// ============================================================================

// Get team members
router.get('/team-members', async (req, res) => {
  try {
    const members = await db.query.teamMembers.findMany({
      with: {
        user: true,
        team: true,
        department: true,
      },
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get team members by team
router.get('/team-members/team/:teamId', async (req, res) => {
  try {
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, req.params.teamId),
      with: {
        user: true,
      },
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get user's teams
router.get('/team-members/user/:userId', async (req, res) => {
  try {
    const userTeams = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, req.params.userId),
      with: {
        team: {
          with: { department: true },
        },
        department: true,
      },
    });
    res.json(userTeams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user teams' });
  }
});

// Add user to team
router.post('/team-members', async (req, res) => {
  try {
    const { userId, teamId, departmentId, roleInTeam = 'member', isPrimaryTeam = false, maxTickets = 10, skills } = req.body;
    
    // Check if already exists
    const existing = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.teamId, teamId)
      ),
    });
    
    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }
    
    const newMember = await db.insert(teamMembers).values({
      userId,
      teamId,
      departmentId,
      roleInTeam,
      isPrimaryTeam,
      maxTickets,
      skills,
      currentTicketCount: 0,
      availabilityStatus: 'available',
    }).returning();
    
    res.status(201).json(newMember[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add team member' });
  }
});

// Update team member
router.put('/team-members/:id', async (req, res) => {
  try {
    const { roleInTeam, availabilityStatus, maxTickets, currentTicketCount, skills } = req.body;
    
    const updated = await db.update(teamMembers)
      .set({
        roleInTeam,
        availabilityStatus,
        maxTickets,
        currentTicketCount,
        skills,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, req.params.id))
      .returning();
    
    if (!updated.length) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update team member' });
  }
});

// Remove user from team
router.delete('/team-members/:id', async (req, res) => {
  try {
    await db.delete(teamMembers).where(eq(teamMembers.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to remove team member' });
  }
});

// ============================================================================
// ROUTING RULES ENDPOINTS
// ============================================================================

// Get all routing rules
router.get('/routing-rules', async (req, res) => {
  try {
    const rules = await db.query.routingRules.findMany({
      with: {
        category: true,
        department: true,
        routeToTeam: true,
        routeToUser: true,
        escalateToTeam: true,
        escalateToUser: true,
      },
      orderBy: (rule: any) => [rule.priority],
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routing rules' });
  }
});

// Get active routing rules
router.get('/routing-rules/active', async (req, res) => {
  try {
    const rules = await db.query.routingRules.findMany({
      where: eq(routingRules.isActive, true),
      with: {
        category: true,
        department: true,
        routeToTeam: true,
        routeToUser: true,
      },
      orderBy: (rule: any) => [rule.priority],
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active routing rules' });
  }
});

// Get routing rules by category
router.get('/routing-rules/category/:categoryId', async (req, res) => {
  try {
    const rules = await db.query.routingRules.findMany({
      where: eq(routingRules.categoryId, req.params.categoryId),
      with: {
        department: true,
        routeToTeam: true,
        routeToUser: true,
      },
      orderBy: (rule: any) => [rule.priority],
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routing rules' });
  }
});

// Create routing rule
router.post('/routing-rules', async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      priority = 100,
      categoryId,
      priorityLevel,
      departmentId,
      routeToTeamId,
      routeToUserId,
      loadBalancingStrategy = 'round_robin',
      requiredSkills,
      autoEscalateAfterMinutes,
      escalateToTeamId,
      escalateToUserId,
      createdById,
    } = req.body;
    
    const newRule = await db.insert(routingRules).values({
      name,
      code,
      description,
      priority,
      categoryId,
      priorityLevel,
      departmentId,
      routeToTeamId,
      routeToUserId,
      loadBalancingStrategy,
      requiredSkills,
      autoEscalateAfterMinutes,
      escalateToTeamId,
      escalateToUserId,
      createdById,
      isActive: true,
    }).returning();
    
    res.status(201).json(newRule[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create routing rule' });
  }
});

// Update routing rule
router.put('/routing-rules/:id', async (req, res) => {
  try {
    const updated = await db.update(routingRules)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(routingRules.id, req.params.id))
      .returning();
    
    if (!updated.length) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update routing rule' });
  }
});

// Delete routing rule
router.delete('/routing-rules/:id', async (req, res) => {
  try {
    await db.delete(routingRules).where(eq(routingRules.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete routing rule' });
  }
});

// ============================================================================
// ASSIGNMENT ENDPOINT - Find best team/user for ticket routing
// ============================================================================

router.post('/routing/find-target', async (req, res) => {
  try {
    const { categoryId, priority, departmentName } = req.body;
    
    // Find matching routing rule
    let target: any = null;
    
    const rule = await db.query.routingRules.findFirst({
      where: and(
        eq(routingRules.isActive, true),
        eq(routingRules.categoryId, categoryId),
        or(
          eq(routingRules.priorityLevel, priority),
          isNull(routingRules.priorityLevel)
        )
      ),
      orderBy: (r: any) => [r.priority],
      with: {
        routeToTeam: true,
        routeToUser: true,
      },
    });
    
    if (rule) {
      target = {
        ruleId: rule.id,
        type: rule.routeToTeamId ? 'team' : 'user',
        teamId: rule.routeToTeamId,
        userId: rule.routeToUserId,
      };
    } else {
      // Fallback: Find department's team with least load
      const dept = await db.query.departments.findFirst({
        where: eq(departments.name, departmentName),
        with: {
          teams: true,
        },
      });
      
      if (dept && dept.teams.length > 0) {
        const leastLoadedTeam = dept.teams.sort((a: any, b: any) => a.currentLoad - b.currentLoad)[0];
        target = {
          type: 'team',
          teamId: leastLoadedTeam.id,
        };
      }
    }
    
    if (target) {
      res.json(target);
    } else {
      res.status(404).json({ error: 'No available assignment target' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to find assignment target' });
  }
});

// ============================================================================
// ESCALATION ENDPOINTS
// ============================================================================

router.post('/escalation/escalate-ticket', async (req, res) => {
  try {
    const { ticketId, reason } = req.body;
    
    // This would call a database function or service to handle escalation
    // For now, just return success
    res.json({ message: 'Ticket escalation initiated', ticketId, reason });
  } catch (error) {
    res.status(400).json({ error: 'Failed to escalate ticket' });
  }
});

// ============================================================================
// DEPARTMENT STATISTICS ENDPOINTS
// ============================================================================

router.get('/departments/:id/stats', async (req, res) => {
  try {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, req.params.id),
      with: {
        teams: true,
        teamMembers: true,
      },
    });
    
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const stats = {
      departmentId: dept.id,
      departmentName: dept.name,
      totalTeams: dept.teams?.length || 0,
      totalMembers: dept.teamMembers?.length || 0,
      totalCapacity: (dept.teams || []).reduce((sum: any, t: any) => sum + (t.maxCapacity || 0), 0),
      currentLoad: (dept.teams || []).reduce((sum: any, t: any) => sum + (t.currentLoad || 0), 0),
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department stats' });
  }
});

router.get('/teams/:id/stats', async (req, res) => {
  try {
    const team = await db.query.teamsEnhanced.findFirst({
      where: eq(teamsEnhanced.id, req.params.id),
      with: {
        teamMembers: true,
      },
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const stats = {
      teamId: team.id,
      teamName: team.name,
      totalMembers: team.teamMembers?.length || 0,
      maxCapacity: team.maxCapacity,
      currentLoad: team.currentLoad,
      utilizationPercentage: team.maxCapacity ? ((team.currentLoad / team.maxCapacity) * 100).toFixed(2) : 0,
      availableMembers: team.teamMembers?.filter((tm: any) => tm.availabilityStatus === 'available').length || 0,
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team stats' });
  }
});

export default router;
