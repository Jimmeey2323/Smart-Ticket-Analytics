import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, categories, subcategories, locations } from './schema';

// Re-export schema tables for convenience
export { users, categories, subcategories, locations };

// ============================================================================
// ENUM DEFINITIONS
// ============================================================================

export const teamRoleInTeamEnum = pgEnum('team_role_in_team', ['member', 'lead', 'backup_lead']);
export const availabilityStatusEnum = pgEnum('availability_status', ['available', 'busy', 'away', 'offline']);
export const loadBalancingStrategyEnum = pgEnum('load_balancing_strategy', ['round_robin', 'least_loaded', 'random', 'skill_based']);

// ============================================================================
// DEPARTMENTS TABLE
// ============================================================================

export const departments: any = pgTable(
  "departments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull().unique(),
    code: varchar("code").notNull().unique(),
    description: text("description"),
    managerId: varchar("manager_id").references(() => users.id, { onDelete: 'set null' }),
    parentDepartmentId: varchar("parent_department_id").references((): any => departments.id, { onDelete: 'set null' }),
    email: varchar("email"),
    phone: varchar("phone"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_departments_manager_id").on(table.managerId),
    index("idx_departments_parent_id").on(table.parentDepartmentId),
  ]
);

// ============================================================================
// TEAMS TABLE ENHANCEMENTS
// ============================================================================

export const teamsEnhanced = pgTable(
  "teams",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull().unique(),
    departmentId: varchar("department_id").references(() => departments.id, { onDelete: 'set null' }),
    teamCode: varchar("team_code"),
    description: text("description"),
    managerId: varchar("manager_id").references(() => users.id, { onDelete: 'set null' }),
    email: varchar("email"),
    phone: varchar("phone"),
    maxCapacity: integer("max_capacity").default(10),
    currentLoad: integer("current_load").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_teams_department_id").on(table.departmentId),
    index("idx_teams_manager_id").on(table.managerId),
  ]
);

// ============================================================================
// TEAM MEMBERS TABLE
// ============================================================================

export const teamMembers = pgTable(
  "team_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    teamId: varchar("team_id").notNull().references(() => teamsEnhanced.id, { onDelete: 'cascade' }),
    departmentId: varchar("department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
    roleInTeam: teamRoleInTeamEnum("role_in_team").default('member').notNull(),
    isPrimaryTeam: boolean("is_primary_team").default(false).notNull(),
    maxTickets: integer("max_tickets").default(10),
    currentTicketCount: integer("current_ticket_count").default(0),
    availabilityStatus: availabilityStatusEnum("availability_status").default('available').notNull(),
    skills: jsonb("skills"), // Array of skills/expertise
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_team_members_user_id").on(table.userId),
    index("idx_team_members_team_id").on(table.teamId),
    index("idx_team_members_department_id").on(table.departmentId),
    index("idx_team_members_availability").on(table.availabilityStatus),
    uniqueIndex("unique_user_team").on(table.userId, table.teamId),
  ]
);

// ============================================================================
// ROUTING RULES TABLE
// ============================================================================

export const routingRules = pgTable(
  "routing_rules",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    code: varchar("code").notNull().unique(),
    description: text("description"),
    priority: integer("priority").default(100).notNull(),
    
    // Routing conditions
    categoryId: varchar("category_id").references(() => categories.id, { onDelete: 'cascade' }),
    subCategoryId: varchar("sub_category_id").references(() => subcategories.id, { onDelete: 'cascade' }),
    priorityLevel: varchar("priority_level"), // low, medium, high, critical
    departmentId: varchar("department_id").references(() => departments.id, { onDelete: 'cascade' }),
    
    // Routing targets
    routeToTeamId: varchar("route_to_team_id").references(() => teamsEnhanced.id, { onDelete: 'set null' }),
    routeToUserId: varchar("route_to_user_id").references(() => users.id, { onDelete: 'set null' }),
    
    // Routing logic
    loadBalancingStrategy: loadBalancingStrategyEnum("load_balancing_strategy").default('round_robin'),
    requiredSkills: jsonb("required_skills"), // Array of required skills
    
    // Conditions
    clientStatusFilter: jsonb("client_status_filter"), // Array of client statuses
    locationId: varchar("location_id").references(() => locations.id, { onDelete: 'set null' }),
    
    // Escalation settings
    autoEscalateAfterMinutes: integer("auto_escalate_after_minutes"),
    escalateToTeamId: varchar("escalate_to_team_id").references(() => teamsEnhanced.id, { onDelete: 'set null' }),
    escalateToUserId: varchar("escalate_to_user_id").references(() => users.id, { onDelete: 'set null' }),
    
    isActive: boolean("is_active").default(true).notNull(),
    createdById: varchar("created_by_id").references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_routing_rules_category").on(table.categoryId),
    index("idx_routing_rules_department").on(table.departmentId),
    index("idx_routing_rules_team").on(table.routeToTeamId),
    index("idx_routing_rules_priority").on(table.priority),
    index("idx_routing_rules_active").on(table.isActive, table.priority),
  ]
);

// ============================================================================
// DEPARTMENT HIERARCHY TABLE
// ============================================================================

export const departmentHierarchy = pgTable(
  "department_hierarchy",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    parentDepartmentId: varchar("parent_department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
    childDepartmentId: varchar("child_department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
    escalationOrder: integer("escalation_order").default(1),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_dept_hierarchy").on(table.parentDepartmentId, table.childDepartmentId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(users, { fields: [departments.managerId], references: [users.id] }),
  parentDepartment: one(departments, { fields: [departments.parentDepartmentId], references: [departments.id], relationName: 'childDepartments' }),
  childDepartments: many(departments, { relationName: 'childDepartments' }),
  teams: many(teamsEnhanced),
  teamMembers: many(teamMembers),
  routingRules: many(routingRules),
  parentHierarchies: many(departmentHierarchy, { relationName: 'parentDepartmentHierarchy' }),
  childHierarchies: many(departmentHierarchy, { relationName: 'childDepartmentHierarchy' }),
}));

export const teamsRelationsEnhanced = relations(teamsEnhanced, ({ one, many }) => ({
  manager: one(users, { fields: [teamsEnhanced.managerId], references: [users.id] }),
  department: one(departments, { fields: [teamsEnhanced.departmentId], references: [departments.id] }),
  teamMembers: many(teamMembers),
  routingRulesAsTarget: many(routingRules, { relationName: 'teamRoutingTarget' }),
  routingRulesAsEscalation: many(routingRules, { relationName: 'teamEscalationTarget' }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
  team: one(teamsEnhanced, { fields: [teamMembers.teamId], references: [teamsEnhanced.id] }),
  department: one(departments, { fields: [teamMembers.departmentId], references: [departments.id] }),
}));

export const routingRulesRelations = relations(routingRules, ({ one, many }) => ({
  category: one(categories, { fields: [routingRules.categoryId], references: [categories.id] }),
  subCategory: one(subcategories, { fields: [routingRules.subCategoryId], references: [subcategories.id] }),
  department: one(departments, { fields: [routingRules.departmentId], references: [departments.id] }),
  routeToTeam: one(teamsEnhanced, { fields: [routingRules.routeToTeamId], references: [teamsEnhanced.id], relationName: 'teamRoutingTarget' }),
  routeToUser: one(users, { fields: [routingRules.routeToUserId], references: [users.id], relationName: 'userRoutingTarget' }),
  escalateToTeam: one(teamsEnhanced, { fields: [routingRules.escalateToTeamId], references: [teamsEnhanced.id], relationName: 'teamEscalationTarget' }),
  escalateToUser: one(users, { fields: [routingRules.escalateToUserId], references: [users.id], relationName: 'userEscalationTarget' }),
  location: one(locations, { fields: [routingRules.locationId], references: [locations.id] }),
  createdBy: one(users, { fields: [routingRules.createdById], references: [users.id] }),
}));

export const departmentHierarchyRelations = relations(departmentHierarchy, ({ one }) => ({
  parentDepartment: one(departments, { fields: [departmentHierarchy.parentDepartmentId], references: [departments.id], relationName: 'parentDepartmentHierarchy' }),
  childDepartment: one(departments, { fields: [departmentHierarchy.childDepartmentId], references: [departments.id], relationName: 'childDepartmentHierarchy' }),
}));

// ============================================================================
// INSERT SCHEMAS
// ============================================================================

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamEnhancedSchema = createInsertSchema(teamsEnhanced).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDepartmentHierarchySchema = createInsertSchema(departmentHierarchy).omit({ id: true, createdAt: true });

// ============================================================================
// TYPES
// ============================================================================

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type TeamEnhanced = typeof teamsEnhanced.$inferSelect;
export type InsertTeamEnhanced = z.infer<typeof insertTeamEnhancedSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;

export type DepartmentHierarchy = typeof departmentHierarchy.$inferSelect;
export type InsertDepartmentHierarchy = z.infer<typeof insertDepartmentHierarchySchema>;

// Extended types for API responses
export type DepartmentWithRelations = Department & {
  manager?: typeof users.$inferSelect;
  teams?: TeamEnhanced[];
  teamMembers?: TeamMember[];
};

export type TeamWithMembers = TeamEnhanced & {
  manager?: typeof users.$inferSelect;
  department?: Department;
  teamMembers?: (TeamMember & { user?: typeof users.$inferSelect })[];
};

export type RoutingRuleWithRelations = RoutingRule & {
  category?: typeof categories.$inferSelect;
  subCategory?: typeof subcategories.$inferSelect;
  department?: Department;
  routeToTeam?: TeamEnhanced;
  routeToUser?: typeof users.$inferSelect;
  escalateToTeam?: TeamEnhanced;
  escalateToUser?: typeof users.$inferSelect;
};
