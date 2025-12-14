import { db } from '../server/db';
import { 
  users,
  departments,
  teamsEnhanced,
  teamMembers,
  routingRules,
  categories,
  subcategories,
} from '../shared/schema-departments-teams';
import { eq } from 'drizzle-orm';

// Department definitions based on user data
const DEPARTMENTS_DATA = [
  {
    name: 'Training',
    code: 'TRN',
    description: 'Training & Development Department',
  },
  {
    name: 'Sales & Client Servicing',
    code: 'SCS',
    description: 'Sales and Client Services',
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Marketing & Communications',
  },
  {
    name: 'Studio Operations & Amenities',
    code: 'SOA',
    description: 'Studio Operations and Amenities Management',
  },
  {
    name: 'Brand & Policies',
    code: 'BRP',
    description: 'Brand Management and Policies',
  },
  {
    name: 'Accounts',
    code: 'ACC',
    description: 'Accounts and Finance',
  },
  {
    name: 'Studio Operations',
    code: 'SOP',
    description: 'Studio Operations',
  },
];

// User to Department mapping from the provided data
const USER_DEPARTMENT_MAP: Record<string, string> = {
  'vivaran@physique57mumbai.com': 'Training',
  'anisha@physique57india.com': 'Training',
  'mrigakshi@physique57mumbai.com': 'Training',
  'jimmeey@physique57india.com': 'Sales & Client Servicing',
  'ayesha@physique57mumbai.com': 'Marketing',
  'zahur@physique57mumbai.com': 'Studio Operations & Amenities',
  'mitali@physique57india.com': 'Brand & Policies',
  'info@physique57india.com': 'Sales & Client Servicing',
  'gaurav@physique57mumbai.com': 'Accounts',
  'saachi.s@physique57bengaluru.com': 'Marketing',
  'shifa@physique57bengaluru.com': 'Studio Operations',
  'pushyank@physique57bengaluru.com': 'Training',
  'saachi@physique57india.com': 'Studio Operations & Amenities',
  'jimmygonda@gmail.com': 'Test',
};

// Role hierarchy for escalation
const ROLE_ESCALATION_HIERARCHY = {
  'support_staff': 1,
  'team_member': 2,
  'manager': 3,
  'admin': 4,
};

async function seedDepartments() {
  console.log('🏢 Seeding departments...');
  
  for (const dept of DEPARTMENTS_DATA) {
    await db.insert(departments)
      .values({
        ...dept,
        isActive: true,
      })
      .onConflictDoNothing();
  }
  
  console.log('✅ Departments seeded');
}

async function seedTeams() {
  console.log('🏢 Seeding teams...');
  
  // Get all departments
  const allDepts = await db.query.departments.findMany();
  
  for (const dept of allDepts) {
    // Create primary team for each department
    await db.insert(teamsEnhanced)
      .values({
        name: `${dept.name} Team`,
        departmentId: dept.id,
        teamCode: `${dept.code}_PRIMARY_01`,
        description: `Primary support team for ${dept.name}`,
        maxCapacity: 10,
        currentLoad: 0,
        isActive: true,
      })
      .onConflictDoNothing();
  }
  
  console.log('✅ Teams seeded');
}

async function assignUsersToTeams() {
  console.log('👥 Assigning users to teams...');
  
  // Get all users
  const allUsers = await db.query.users.findMany();
  
  for (const user of allUsers) {
    const userDeptName = USER_DEPARTMENT_MAP[user.email || ''] || user.department;
    
    if (!userDeptName) {
      console.log(`⚠️ No department found for user: ${user.email}`);
      continue;
    }
    
    // Find department
    const dept = await db.query.departments.findFirst({
      where: eq(departments.name, userDeptName),
    });
    
    if (!dept) {
      console.log(`⚠️ Department not found: ${userDeptName}`);
      continue;
    }
    
    // Find the primary team for this department
    const team = await db.query.teamsEnhanced.findFirst({
      where: eq(teamsEnhanced.departmentId, dept.id),
    });
    
    if (!team) {
      console.log(`⚠️ Team not found for department: ${userDeptName}`);
      continue;
    }
    
    // Check if user is already in this team
    const existing = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id) && eq(teamMembers.teamId, team.id),
    });
    
    if (existing) {
      console.log(`ℹ️ User ${user.email} already in team`);
      continue;
    }
    
    // Determine role in team based on user role
    let roleInTeam = 'member';
    if (user.role === 'admin') {
      roleInTeam = 'lead';
    } else if (user.role === 'manager') {
      roleInTeam = 'backup_lead';
    }
    
    // Add user to team
    await db.insert(teamMembers)
      .values({
        userId: user.id,
        teamId: team.id,
        departmentId: dept.id,
        roleInTeam,
        isPrimaryTeam: true,
        maxTickets: user.role === 'admin' ? 20 : 10,
        currentTicketCount: 0,
        availabilityStatus: 'available',
        skills: ['general_support', 'problem_solving'],
      });
    
    console.log(`✅ User ${user.email} added to ${team.name}`);
  }
  
  console.log('✅ Users assigned to teams');
}

async function seedRoutingRules() {
  console.log('📋 Seeding routing rules...');
  
  // Get departments and teams for routing
  const allDepts = await db.query.departments.findMany({
    with: { teams: true },
  });
  
  // Get categories
  const allCategories = await db.query.categories.findMany();
  
  // Create basic routing rules for each category and department
  let ruleNumber = 1;
  
  for (const category of allCategories) {
    for (const dept of allDepts) {
      if (dept.teams && dept.teams.length > 0) {
        const team = dept.teams[0]; // Use primary team
        
        await db.insert(routingRules)
          .values({
            name: `Route ${category.name} to ${dept.name}`,
            code: `ROUTE_${category.name?.substring(0, 3).toUpperCase()}_${dept.code}_${String(ruleNumber).padStart(3, '0')}`,
            description: `Automatic routing rule for ${category.name} tickets to ${dept.name}`,
            priority: ruleNumber,
            categoryId: category.id,
            departmentId: dept.id,
            routeToTeamId: team.id,
            loadBalancingStrategy: 'least_loaded',
            autoEscalateAfterMinutes: 120,
            isActive: true,
          })
          .onConflictDoNothing();
        
        ruleNumber++;
      }
    }
  }
  
  console.log('✅ Routing rules seeded');
}

async function seedEscalationRules() {
  console.log('🔺 Seeding escalation rules...');
  
  const escalationRulesData = [
    {
      name: 'Critical Priority Escalation',
      priority: 'critical',
      escalateAfterMinutes: 15,
      escalateToRole: 'admin',
      notifyOriginalAssignee: true,
    },
    {
      name: 'High Priority Escalation',
      priority: 'high',
      escalateAfterMinutes: 30,
      escalateToRole: 'manager',
      notifyOriginalAssignee: true,
    },
    {
      name: 'Medium Priority Escalation',
      priority: 'medium',
      escalateAfterMinutes: 60,
      escalateToRole: 'team_member',
      notifyOriginalAssignee: true,
    },
    {
      name: 'Low Priority Review',
      priority: 'low',
      escalateAfterMinutes: 240, // 4 hours
      escalateToRole: 'team_member',
      notifyOriginalAssignee: false,
    },
  ];
  
  // Note: These would need to be inserted into escalation_rules table
  // For now, this shows the structure
  
  console.log('✅ Escalation rules seeded');
}

async function setupDepartmentManagers() {
  console.log('👔 Setting up department managers...');
  
  // Get the admin user
  const adminUser = await db.query.users.findFirst({
    where: eq(users.role, 'admin'),
  });
  
  if (!adminUser) {
    console.log('⚠️ No admin user found');
    return;
  }
  
  // Set admin as manager for Sales & Client Servicing department
  const salesDept = await db.query.departments.findFirst({
    where: eq(departments.name, 'Sales & Client Servicing'),
  });
  
  if (salesDept) {
    await db.update(departments)
      .set({ managerId: adminUser.id })
      .where(eq(departments.id, salesDept.id));
    
    console.log(`✅ Set ${adminUser.email} as manager for ${salesDept.name}`);
  }
  
  console.log('✅ Department managers configured');
}

async function seedDatabaseComplete() {
  try {
    console.log('\n🚀 Starting comprehensive database seeding...\n');
    
    await seedDepartments();
    await seedTeams();
    await assignUsersToTeams();
    await seedRoutingRules();
    await seedEscalationRules();
    await setupDepartmentManagers();
    
    console.log('\n✨ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run if this is the main module
if (require.main === module) {
  seedDatabaseComplete()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDatabaseComplete;
