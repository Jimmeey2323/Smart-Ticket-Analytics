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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for ticket management
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'team_member', 'support_staff']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'pending', 'resolved', 'closed', 'escalated']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'critical']);
export const departmentEnum = pgEnum('department', ['operations', 'facilities', 'training', 'sales', 'client_success', 'marketing', 'finance', 'management']);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('support_staff').notNull(),
  department: departmentEnum("department"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table for department organization
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  department: departmentEnum("department").notNull(),
  description: text("description"),
  managerId: varchar("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table for feedback types
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  color: varchar("color"),
  defaultDepartment: departmentEnum("default_department"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subcategories table
export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  formFields: jsonb("form_fields"), // Dynamic form field configuration
  defaultDepartment: departmentEnum("default_department"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations/Studios table
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Main tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number").notNull().unique(),
  
  // Category/Subcategory
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  
  // Client information
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  clientStatus: varchar("client_status"), // Existing Active, Inactive, New Prospect, etc.
  clientMood: varchar("client_mood"), // Calm, Frustrated, Angry, etc.
  
  // Issue details
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  actionTakenImmediately: text("action_taken_immediately"),
  
  // Location and timing
  locationId: varchar("location_id").references(() => locations.id),
  incidentDateTime: timestamp("incident_datetime"),
  reportedDateTime: timestamp("reported_datetime").defaultNow().notNull(),
  
  // Status and priority
  status: ticketStatusEnum("status").default('open').notNull(),
  priority: ticketPriorityEnum("priority").default('medium').notNull(),
  
  // Assignment
  department: departmentEnum("department"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  reportedById: varchar("reported_by_id").references(() => users.id).notNull(),
  
  // SLA tracking
  slaDeadline: timestamp("sla_deadline"),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  
  // AI-generated tags and analysis
  aiTags: text("ai_tags").array(),
  aiSentiment: varchar("ai_sentiment"),
  aiSentimentScore: integer("ai_sentiment_score"),
  aiSuggestedCategory: varchar("ai_suggested_category"),
  aiKeywords: text("ai_keywords").array(),
  
  // Dynamic form data storage
  formData: jsonb("form_data"),
  
  // Escalation
  isEscalated: boolean("is_escalated").default(false).notNull(),
  escalatedAt: timestamp("escalated_at"),
  escalatedToId: varchar("escalated_to_id").references(() => users.id),
  escalationReason: text("escalation_reason"),
  
  // Follow-up
  followUpRequired: boolean("follow_up_required").default(false).notNull(),
  followUpDate: timestamp("follow_up_date"),
  
  // Attachments count (actual files stored separately)
  attachmentsCount: integer("attachments_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_ticket_status").on(table.status),
  index("IDX_ticket_priority").on(table.priority),
  index("IDX_ticket_assignee").on(table.assigneeId),
  index("IDX_ticket_category").on(table.categoryId),
  index("IDX_ticket_department").on(table.department),
  index("IDX_ticket_sla").on(table.slaDeadline),
]);

// Ticket comments/responses
export const ticketComments = pgTable("ticket_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(), // Internal notes vs client-facing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket attachments
export const ticketAttachments = pgTable("ticket_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: varchar("file_url").notNull(),
  uploadedById: varchar("uploaded_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket history/audit trail
export const ticketHistory = pgTable("ticket_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // status_change, assignment_change, priority_change, etc.
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  type: varchar("type").notNull(), // assignment, status_change, escalation, reminder, etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved filters for users
export const savedFilters = pgTable("saved_filters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  filters: jsonb("filters").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auto-assignment rules
export const assignmentRules = pgTable("assignment_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  department: departmentEnum("department"),
  priority: ticketPriorityEnum("priority"),
  assignToUserId: varchar("assign_to_user_id").references(() => users.id),
  assignToTeamId: varchar("assign_to_team_id").references(() => teams.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Escalation rules
export const escalationRules = pgTable("escalation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  escalateAfterMinutes: integer("escalate_after_minutes").notNull(),
  escalateToRole: userRoleEnum("escalate_to_role").notNull(),
  notifyOriginalAssignee: boolean("notify_original_assignee").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  assignedTickets: many(tickets, { relationName: 'assignedTickets' }),
  reportedTickets: many(tickets, { relationName: 'reportedTickets' }),
  comments: many(ticketComments),
  notifications: many(notifications),
  managedTeam: one(teams, { fields: [users.id], references: [teams.managerId] }),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
  manager: one(users, { fields: [teams.managerId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  tickets: many(tickets),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, { fields: [subcategories.categoryId], references: [categories.id] }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  category: one(categories, { fields: [tickets.categoryId], references: [categories.id] }),
  subcategory: one(subcategories, { fields: [tickets.subcategoryId], references: [subcategories.id] }),
  location: one(locations, { fields: [tickets.locationId], references: [locations.id] }),
  assignee: one(users, { fields: [tickets.assigneeId], references: [users.id], relationName: 'assignedTickets' }),
  reportedBy: one(users, { fields: [tickets.reportedById], references: [users.id], relationName: 'reportedTickets' }),
  escalatedTo: one(users, { fields: [tickets.escalatedToId], references: [users.id] }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
  history: many(ticketHistory),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketComments.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketComments.userId], references: [users.id] }),
}));

export const ticketAttachmentsRelations = relations(ticketAttachments, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketAttachments.ticketId], references: [tickets.id] }),
  uploadedBy: one(users, { fields: [ticketAttachments.uploadedById], references: [users.id] }),
}));

export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketHistory.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketHistory.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  ticket: one(tickets, { fields: [notifications.ticketId], references: [tickets.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertSubcategorySchema = createInsertSchema(subcategories).omit({ id: true, createdAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, ticketNumber: true, createdAt: true, updatedAt: true });
export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTicketAttachmentSchema = createInsertSchema(ticketAttachments).omit({ id: true, createdAt: true });
export const insertTicketHistorySchema = createInsertSchema(ticketHistory).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertSavedFilterSchema = createInsertSchema(savedFilters).omit({ id: true, createdAt: true });
export const insertAssignmentRuleSchema = createInsertSchema(assignmentRules).omit({ id: true, createdAt: true });
export const insertEscalationRuleSchema = createInsertSchema(escalationRules).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = z.infer<typeof insertTicketAttachmentSchema>;
export type TicketHistory = typeof ticketHistory.$inferSelect;
export type InsertTicketHistory = z.infer<typeof insertTicketHistorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SavedFilter = typeof savedFilters.$inferSelect;
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;
export type AssignmentRule = typeof assignmentRules.$inferSelect;
export type InsertAssignmentRule = z.infer<typeof insertAssignmentRuleSchema>;
export type EscalationRule = typeof escalationRules.$inferSelect;
export type InsertEscalationRule = z.infer<typeof insertEscalationRuleSchema>;

// Extended types for API responses
export type TicketWithRelations = Ticket & {
  category?: Category;
  subcategory?: Subcategory;
  location?: Location;
  assignee?: User;
  reportedBy?: User;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
  history?: TicketHistory[];
};

export type CategoryWithSubcategories = Category & {
  subcategories: Subcategory[];
};
