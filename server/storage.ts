import { 
  users, tickets, ticketComments, ticketHistory, notifications, categories, subcategories, locations, teams, ticketAttachments, savedFilters, assignmentRules, escalationRules, fieldGroups, formFields,
  type User, type UpsertUser, type Ticket, type InsertTicket, type TicketComment, type InsertTicketComment, type TicketHistory, type InsertTicketHistory, type Notification, type InsertNotification, type Category, type InsertCategory, type Subcategory, type InsertSubcategory, type Location, type InsertLocation, type Team, type InsertTeam, type TicketWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, inArray, sql, count, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  ensureUserIdForEmail(input: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    profileImageUrl?: string | null;
    role?: User['role'] | null;
    department?: User['department'] | null;
    isActive?: boolean | null;
  }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Tickets
  getTicket(id: string): Promise<TicketWithRelations | undefined>;
  getTickets(filters?: { status?: string; priority?: string; categoryId?: string; assigneeId?: string; department?: string; search?: string; limit?: number; offset?: number }): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined>;
  deleteTicket(id: string): Promise<boolean>;
  getTicketCount(): Promise<number>;
  getTicketStats(): Promise<{ total: number; open: number; inProgress: number; pending: number; resolved: number; escalated: number }>;

  // Helpers
  getNextTicketNumber(): Promise<string>;

  // Field groups
  getFieldGroups(filters?: { categoryId?: string; subcategoryId?: string }): Promise<any[]>;

  // Form fields (admin/settings)
  getFormFields(): Promise<any[]>;
  upsertFormField(field: any): Promise<any>;
  deleteFormField(id: string): Promise<boolean>;

  // Field groups (admin/settings)
  upsertFieldGroup(group: any): Promise<any>;
  deleteFieldGroup(id: string): Promise<boolean>;

  // Assignment rules (admin/settings)
  getAssignmentRules(): Promise<any[]>;
  upsertAssignmentRule(rule: any): Promise<any>;
  deleteAssignmentRule(id: string): Promise<boolean>;
  
  // Ticket Comments
  getTicketComments(ticketId: string): Promise<TicketComment[]>;
  createTicketComment(comment: InsertTicketComment): Promise<TicketComment>;
  
  // Ticket History
  getTicketHistory(ticketId: string): Promise<TicketHistory[]>;
  createTicketHistory(history: InsertTicketHistory): Promise<TicketHistory>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;
  
  // Categories & Subcategories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined>;
  getSubcategories(categoryId: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(id: string, updates: Partial<Subcategory>): Promise<Subcategory | undefined>;
  updateSubcategoryFormFields(id: string, formFields: any): Promise<Subcategory | undefined>;
  
  // Locations
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
}

export class DatabaseStorage implements IStorage {
  // Generate ticket number
  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const prefix = `P57-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await db.select({ count: count() }).from(tickets);
    const num = (result?.count || 0) + 1;
    return `${prefix}-${String(num).padStart(5, '0')}`;
  }

  async getNextTicketNumber(): Promise<string> {
    return this.generateTicketNumber();
  }

  async getFieldGroups(filters?: { categoryId?: string; subcategoryId?: string }): Promise<any[]> {
    let q = db.select().from(fieldGroups);
    const conditions: any[] = [];
    if (filters?.categoryId) conditions.push(or(eq(fieldGroups.categoryId, filters.categoryId), isNull(fieldGroups.categoryId)));
    if (filters?.subcategoryId) conditions.push(or(eq(fieldGroups.subCategoryId, filters.subcategoryId), isNull(fieldGroups.subCategoryId)));
    if (conditions.length > 0) {
      q = (q as any).where(and(...conditions));
    }
    const groups = await q;
    return groups.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }

  async getFormFields(): Promise<any[]> {
    return db
      .select()
      .from(formFields)
      .orderBy(formFields.orderIndex, formFields.label);
  }

  async upsertFormField(field: any): Promise<any> {
    const [saved] = await db
      .insert(formFields)
      .values({
        ...field,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: formFields.id,
        set: {
          ...field,
          updatedAt: new Date(),
        },
      })
      .returning();
    return saved;
  }

  async deleteFormField(id: string): Promise<boolean> {
    const deleted = await db.delete(formFields).where(eq(formFields.id, id)).returning();
    return deleted.length > 0;
  }

  async upsertFieldGroup(group: any): Promise<any> {
    const [saved] = await db
      .insert(fieldGroups)
      .values({
        ...group,
      })
      .onConflictDoUpdate({
        target: fieldGroups.id,
        set: {
          ...group,
        },
      })
      .returning();
    return saved;
  }

  async deleteFieldGroup(id: string): Promise<boolean> {
    const deleted = await db.delete(fieldGroups).where(eq(fieldGroups.id, id)).returning();
    return deleted.length > 0;
  }

  async getAssignmentRules(): Promise<any[]> {
    return db.select().from(assignmentRules).orderBy(assignmentRules.name);
  }

  async upsertAssignmentRule(rule: any): Promise<any> {
    const [saved] = await db
      .insert(assignmentRules)
      .values({
        ...rule,
      })
      .onConflictDoUpdate({
        target: assignmentRules.id,
        set: {
          ...rule,
        },
      })
      .returning();
    return saved;
  }

  async deleteAssignmentRule(id: string): Promise<boolean> {
    const deleted = await db.delete(assignmentRules).where(eq(assignmentRules.id, id)).returning();
    return deleted.length > 0;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async ensureUserIdForEmail(input: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    profileImageUrl?: string | null;
    role?: User['role'] | null;
    department?: User['department'] | null;
    isActive?: boolean | null;
  }): Promise<User> {
    const desiredId = String(input.id || '').trim();
    const desiredEmail = String(input.email || '').trim().toLowerCase();
    if (!desiredId) throw new Error('ensureUserIdForEmail: missing id');
    if (!desiredEmail) throw new Error('ensureUserIdForEmail: missing email');

    const mergedUser = await db.transaction(async (tx: any) => {
      const [byId] = await tx.select().from(users).where(eq(users.id, desiredId));
      const [byEmail] = await tx.select().from(users).where(eq(users.email, desiredEmail));

      const applyUpdates = (base: User): Partial<User> => {
        const nextFirst = input.firstName !== undefined ? input.firstName : base.firstName;
        const nextLast = input.lastName !== undefined ? input.lastName : base.lastName;
        const nextFull =
          (input.fullName !== undefined ? input.fullName : base.fullName) ||
          String(`${nextFirst || ''} ${nextLast || ''}`).trim() ||
          base.fullName ||
          desiredEmail;

        return {
          email: desiredEmail,
          firstName: nextFirst ?? null,
          lastName: nextLast ?? null,
          fullName: String(nextFull).trim() || desiredEmail,
          profileImageUrl:
            input.profileImageUrl !== undefined ? input.profileImageUrl : (base.profileImageUrl ?? null),
          role: (input.role !== undefined && input.role !== null ? input.role : base.role) as any,
          department: input.department !== undefined ? (input.department as any) : (base.department as any),
          isActive: input.isActive !== undefined && input.isActive !== null ? Boolean(input.isActive) : base.isActive,
          updatedAt: new Date(),
        };
      };

      const repointUserId = async (fromId: string, toId: string) => {
        if (!fromId || !toId || fromId === toId) return;

        await tx.update(teams).set({ managerId: toId }).where(eq(teams.managerId, fromId));

        await tx.update(tickets).set({ reportedById: toId }).where(eq(tickets.reportedById, fromId));
        await tx.update(tickets).set({ assigneeId: toId }).where(eq(tickets.assigneeId, fromId));
        await tx.update(tickets).set({ escalatedToId: toId }).where(eq(tickets.escalatedToId, fromId));

        await tx.update(ticketComments).set({ userId: toId }).where(eq(ticketComments.userId, fromId));
        await tx.update(ticketHistory).set({ userId: toId }).where(eq(ticketHistory.userId, fromId));
        await tx.update(ticketAttachments).set({ uploadedById: toId }).where(eq(ticketAttachments.uploadedById, fromId));
        await tx.update(notifications).set({ userId: toId }).where(eq(notifications.userId, fromId));
        await tx.update(savedFilters).set({ userId: toId }).where(eq(savedFilters.userId, fromId));
      };

      // If both exist but are different rows, merge email-row into id-row.
      if (byId && byEmail && byEmail.id !== byId.id) {
        await repointUserId(byEmail.id, byId.id);
        await tx.delete(users).where(eq(users.id, byEmail.id));

        const updates = applyUpdates(byId);
        const [updated] = await tx.update(users).set(updates as any).where(eq(users.id, byId.id)).returning();
        return updated as User;
      }

      // If id-row exists (and either no email-row exists, or it's the same row), just update.
      if (byId) {
        const updates = applyUpdates(byId);
        const [updated] = await tx.update(users).set(updates as any).where(eq(users.id, byId.id)).returning();
        return updated as User;
      }

      // If only email-row exists, repoint old row to new id, then delete old.
      if (byEmail) {
        const base: User = byEmail as any;
        const nextRole = (input.role !== undefined && input.role !== null ? input.role : base.role) as any;

        const nextFirst = input.firstName !== undefined ? input.firstName : base.firstName;
        const nextLast = input.lastName !== undefined ? input.lastName : base.lastName;
        const nextFull =
          (input.fullName !== undefined ? input.fullName : base.fullName) ||
          String(`${nextFirst || ''} ${nextLast || ''}`).trim() ||
          base.fullName ||
          desiredEmail;

        // First repoint all foreign keys from old id to desired id
        await repointUserId(byEmail.id, desiredId);
        
        // Then delete the old user row
        await tx.delete(users).where(eq(users.id, byEmail.id));

        // Now insert with the new desired id and email (which is now safe)
        const [inserted] = await tx
          .insert(users)
          .values({
            id: desiredId,
            email: desiredEmail,
            firstName: nextFirst ?? null,
            lastName: nextLast ?? null,
            fullName: String(nextFull).trim() || desiredEmail,
            profileImageUrl: input.profileImageUrl !== undefined ? input.profileImageUrl : (base.profileImageUrl ?? null),
            role: nextRole,
            department: input.department !== undefined ? (input.department as any) : (base.department as any),
            isActive: input.isActive !== undefined && input.isActive !== null ? Boolean(input.isActive) : base.isActive,
            createdAt: base.createdAt ?? new Date(),
            updatedAt: new Date(),
          } as any)
          .returning();

        return inserted as User;
      }

      // No existing row: create fresh.
      const fullName =
        String(input.fullName ?? '').trim() ||
        String(`${input.firstName ?? ''} ${input.lastName ?? ''}`).trim() ||
        desiredEmail;

      const [created] = await tx
        .insert(users)
        .values({
          id: desiredId,
          email: desiredEmail,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          fullName: fullName,
          profileImageUrl: input.profileImageUrl ?? null,
          role: (input.role ?? 'support_staff') as any,
          department: (input.department ?? null) as any,
          isActive: input.isActive === undefined || input.isActive === null ? true : Boolean(input.isActive),
          updatedAt: new Date(),
        } as any)
        .returning();

      return created as User;
    });

    return mergedUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (e: any) {
      const code = e?.code ?? e?.cause?.code;
      // If we collided on unique email, reconcile to the Supabase id.
      if (code === '23505' && userData?.id && userData?.email) {
        return this.ensureUserIdForEmail({
          id: String(userData.id),
          email: String(userData.email),
          firstName: (userData as any).firstName ?? null,
          lastName: (userData as any).lastName ?? null,
          fullName: (userData as any).fullName ?? null,
          profileImageUrl: (userData as any).profileImageUrl ?? null,
          role: (userData as any).role ?? null,
          department: (userData as any).department ?? null,
          isActive: (userData as any).isActive ?? null,
        });
      }
      throw e;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.firstName);
  }

  // Tickets
  async getTicket(id: string): Promise<TicketWithRelations | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return undefined;

    const assigneePromise: Promise<User | undefined> = ticket.assigneeId
      ? db
          .select()
          .from(users)
          .where(eq(users.id, ticket.assigneeId))
          .then((rows: User[]) => rows[0])
      : Promise.resolve(undefined);

    const reportedByPromise: Promise<User | undefined> = db
      .select()
      .from(users)
      .where(eq(users.id, ticket.reportedById))
      .then((rows: User[]) => rows[0]);

    const [comments, history, attachments, assignee, reportedBy] = await Promise.all([
      db.select().from(ticketComments).where(eq(ticketComments.ticketId, id)).orderBy(desc(ticketComments.createdAt)),
      db.select().from(ticketHistory).where(eq(ticketHistory.ticketId, id)).orderBy(desc(ticketHistory.createdAt)),
      db.select().from(ticketAttachments).where(eq(ticketAttachments.ticketId, id)),
      assigneePromise,
      reportedByPromise,
    ]);

    return {
      ...ticket,
      comments,
      history,
      attachments,
      assignee,
      reportedBy,
    };
  }

  async getTickets(filters?: { status?: string; priority?: string; categoryId?: string; assigneeId?: string; department?: string; search?: string; limit?: number; offset?: number }): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    const conditions = [];

    if (filters?.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      conditions.push(inArray(tickets.status, statuses as any));
    }
    if (filters?.priority && filters.priority !== 'all') {
      const priorities = filters.priority.split(',');
      conditions.push(inArray(tickets.priority, priorities as any));
    }
    if (filters?.categoryId) {
      conditions.push(eq(tickets.categoryId, filters.categoryId));
    }
    if (filters?.assigneeId) {
      conditions.push(eq(tickets.assigneeId, filters.assigneeId));
    }
    if (filters?.department) {
      conditions.push(eq(tickets.department, filters.department as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(tickets.title, `%${filters.search}%`),
          ilike(tickets.ticketNumber, `%${filters.search}%`),
          ilike(tickets.clientName, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(tickets.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return query;
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    // Apply preset auto-assignment rules (department, priority, assignee)
    const applyAutoAssignment = async (data: InsertTicket): Promise<InsertTicket> => {
      const categoryId = (data as any).categoryId as string;
      const subcategoryId = (data as any).subcategoryId as string | undefined;

      // 1) Assignment rules table (most explicit)
      const ruleCandidates = await db
        .select()
        .from(assignmentRules)
        .where(
          and(
            eq(assignmentRules.isActive, true),
            or(eq(assignmentRules.categoryId, categoryId), isNull(assignmentRules.categoryId)),
            subcategoryId
              ? or(eq(assignmentRules.subcategoryId, subcategoryId), isNull(assignmentRules.subcategoryId))
              : isNull(assignmentRules.subcategoryId)
          )
        );

      const scoreRule = (r: any): number => {
        let score = 0;
        if (subcategoryId && r.subcategoryId === subcategoryId) score += 4;
        if (r.categoryId === categoryId) score += 2;
        if (r.assignToUserId) score += 1;
        if (r.department) score += 1;
        if (r.priority) score += 1;
        return score;
      };

      const bestRule = ruleCandidates.sort((a: any, b: any) => scoreRule(b) - scoreRule(a))[0];

      const next: any = { ...data };

      // 2) Department default: rule -> subcategory.defaultDepartment -> category.defaultDepartment
      if (!next.department) {
        if (bestRule?.department) {
          next.department = bestRule.department;
        } else if (subcategoryId) {
          const [sc] = await db.select({ defaultDepartment: subcategories.defaultDepartment }).from(subcategories).where(eq(subcategories.id, subcategoryId));
          if (sc?.defaultDepartment) next.department = sc.defaultDepartment;
        }

        if (!next.department) {
          const [c] = await db.select({ defaultDepartment: categories.defaultDepartment }).from(categories).where(eq(categories.id, categoryId));
          if (c?.defaultDepartment) next.department = c.defaultDepartment;
        }
      }

      // 3) Priority default: rule priority (DB default handles otherwise)
      if (!next.priority && bestRule?.priority) {
        next.priority = bestRule.priority;
      }

      // 4) Assignee default: rule assignToUserId
      if (!next.assigneeId && bestRule?.assignToUserId) {
        next.assigneeId = bestRule.assignToUserId;
      }

      return next as InsertTicket;
    };

    const ticketDataWithRules = await applyAutoAssignment(ticketData);
    const ticketNumber = await this.generateTicketNumber();
    
    // Calculate SLA deadline based on priority
    let slaDeadline: Date | undefined;
    const now = new Date();
    switch (ticketDataWithRules.priority) {
      case 'critical':
        slaDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        break;
      case 'high':
        slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'medium':
        slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
        break;
      case 'low':
        slaDeadline = undefined; // No SLA for low priority
        break;
    }

    const [ticket] = await db
      .insert(tickets)
      .values({
        ...ticketDataWithRules,
        ticketNumber,
        slaDeadline,
      })
      .returning();

    // Create initial history entry
    await this.createTicketHistory({
      ticketId: ticket.id,
      userId: ticket.reportedById,
      action: 'ticket_created',
      description: 'Ticket was created',
    });

    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async deleteTicket(id: string): Promise<boolean> {
    // Delete related records first
    await db.delete(ticketComments).where(eq(ticketComments.ticketId, id));
    await db.delete(ticketHistory).where(eq(ticketHistory.ticketId, id));
    await db.delete(ticketAttachments).where(eq(ticketAttachments.ticketId, id));
    await db.delete(notifications).where(eq(notifications.ticketId, id));
    
    const result = await db.delete(tickets).where(eq(tickets.id, id)).returning();
    return result.length > 0;
  }

  async getTicketCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(tickets);
    return result?.count || 0;
  }

  async getTicketStats(): Promise<{ total: number; open: number; inProgress: number; pending: number; resolved: number; escalated: number }> {
    const allTickets = (await db.select().from(tickets)) as Ticket[];
    return {
      total: allTickets.length,
      open: allTickets.filter((t: Ticket) => t.status === 'open').length,
      inProgress: allTickets.filter((t: Ticket) => t.status === 'in_progress').length,
      pending: allTickets.filter((t: Ticket) => t.status === 'pending').length,
      resolved: allTickets.filter((t: Ticket) => t.status === 'resolved' || t.status === 'closed').length,
      escalated: allTickets.filter((t: Ticket) => t.isEscalated).length,
    };
  }

  // Ticket Comments
  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return db.select().from(ticketComments).where(eq(ticketComments.ticketId, ticketId)).orderBy(desc(ticketComments.createdAt));
  }

  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const [newComment] = await db.insert(ticketComments).values(comment).returning();
    
    // Update first response time if this is the first comment
    const ticket = await this.getTicket(comment.ticketId);
    if (ticket && !ticket.firstResponseAt) {
      await this.updateTicket(comment.ticketId, { firstResponseAt: new Date() });
    }
    
    return newComment;
  }

  // Ticket History
  async getTicketHistory(ticketId: string): Promise<TicketHistory[]> {
    return db.select().from(ticketHistory).where(eq(ticketHistory.ticketId, ticketId)).orderBy(desc(ticketHistory.createdAt));
  }

  async createTicketHistory(history: InsertTicketHistory): Promise<TicketHistory> {
    const [newHistory] = await db.insert(ticketHistory).values(history).returning();
    return newHistory;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }

  // Categories & Subcategories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set({
        ...updates,
      } as any)
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    return db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId)).orderBy(subcategories.name);
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [newSubcategory] = await db.insert(subcategories).values(subcategory).returning();
    return newSubcategory;
  }

  async updateSubcategory(id: string, updates: Partial<Subcategory>): Promise<Subcategory | undefined> {
    const [updated] = await db
      .update(subcategories)
      .set({
        ...updates,
      } as any)
      .where(eq(subcategories.id, id))
      .returning();
    return updated || undefined;
  }

  async updateSubcategoryFormFields(id: string, formFields: any): Promise<Subcategory | undefined> {
    const [updated] = await db
      .update(subcategories)
      .set({
        formFields: formFields as any,
      })
      .where(eq(subcategories.id, id))
      .returning();
    return updated || undefined;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return db.select().from(locations).orderBy(locations.name);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }
}

export const storage = new DatabaseStorage();
