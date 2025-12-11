import { 
  users, tickets, ticketComments, ticketHistory, notifications, categories, subcategories, locations, teams, ticketAttachments, savedFilters, assignmentRules, escalationRules,
  type User, type UpsertUser, type Ticket, type InsertTicket, type TicketComment, type InsertTicketComment, type TicketHistory, type InsertTicketHistory, type Notification, type InsertNotification, type Category, type InsertCategory, type Subcategory, type InsertSubcategory, type Location, type InsertLocation, type Team, type InsertTeam, type TicketWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, inArray, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
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
  getSubcategories(categoryId: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  
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

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

    const [comments, history, attachments, assignee, reportedBy] = await Promise.all([
      db.select().from(ticketComments).where(eq(ticketComments.ticketId, id)).orderBy(desc(ticketComments.createdAt)),
      db.select().from(ticketHistory).where(eq(ticketHistory.ticketId, id)).orderBy(desc(ticketHistory.createdAt)),
      db.select().from(ticketAttachments).where(eq(ticketAttachments.ticketId, id)),
      ticket.assigneeId ? db.select().from(users).where(eq(users.id, ticket.assigneeId)).then(r => r[0]) : undefined,
      db.select().from(users).where(eq(users.id, ticket.reportedById)).then(r => r[0]),
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
    const ticketNumber = await this.generateTicketNumber();
    
    // Calculate SLA deadline based on priority
    let slaDeadline: Date | undefined;
    const now = new Date();
    switch (ticketData.priority) {
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
        ...ticketData,
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
    const allTickets = await db.select().from(tickets);
    return {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      inProgress: allTickets.filter(t => t.status === 'in_progress').length,
      pending: allTickets.filter(t => t.status === 'pending').length,
      resolved: allTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      escalated: allTickets.filter(t => t.isEscalated).length,
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

  async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    return db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId)).orderBy(subcategories.name);
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [newSubcategory] = await db.insert(subcategories).values(subcategory).returning();
    return newSubcategory;
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
