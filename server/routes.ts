import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifySupabaseAuth, optionalSupabaseAuth, setupSupabaseAuth, authAdmin } from "./supabaseAuth";
import { seedDatabase } from "./seed";
import { momence } from "./momence";
import OpenAI from "openai";

// Initialize OpenAI only when an API key is provided. In development
// allow skipping by setting NODE_ENV=development or SKIP_OPENAI=1 so
// the server can run for UI work without an API key.
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else if (process.env.SKIP_OPENAI === "1" || process.env.NODE_ENV === "development") {
  console.warn("OpenAI API key not provided — AI endpoints will return fallback responses in development.");
} else {
  // In production, keep the strict requirement so missing secrets fail fast.
  throw new Error("OPENAI_API_KEY must be set in production. Set SKIP_OPENAI=1 to bypass in development.");
}

type TitleSuggestInput = {
  categoryName?: string | null;
  subCategoryName?: string | null;
  issueType?: string | null;
  clientName?: string | null;
  locationName?: string | null;
  incidentDateTime?: string | null;
  description?: string | null;
  formData?: Record<string, unknown> | null;
};

const compact = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim();

const getFormValueByLabel = (formData: Record<string, unknown> | null | undefined, label: string): string => {
  if (!formData) return '';
  const want = label.trim().toLowerCase();
  const key = Object.keys(formData).find((k) => k.trim().toLowerCase() === want);
  if (!key) return '';
  return compact((formData as any)[key]);
};

const fallbackTicketTitle = (input: TitleSuggestInput): string => {
  const issueType = compact(input.issueType) || getFormValueByLabel(input.formData ?? null, 'Issue Type');
  const client = compact(input.clientName);
  const location = compact(input.locationName);
  const category = compact(input.categoryName);
  const sub = compact(input.subCategoryName);

  const parts: string[] = [];
  parts.push(issueType || sub || category || 'Support Ticket');
  if (client) parts.push(client);
  if (location) parts.push(location);

  const title = parts.filter(Boolean).join(' — ');
  return title.length > 120 ? title.slice(0, 117) + '...' : title;
};

const suggestTicketTitle = async (input: TitleSuggestInput): Promise<string> => {
  if (!openai) return fallbackTicketTitle(input);

  const payload = {
    category: compact(input.categoryName),
    subCategory: compact(input.subCategoryName),
    issueType: compact(input.issueType) || getFormValueByLabel(input.formData ?? null, 'Issue Type'),
    clientName: compact(input.clientName),
    location: compact(input.locationName),
    incidentDateTime: compact(input.incidentDateTime),
    description: compact(input.description),
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You write concise customer support ticket titles. Return ONLY the title text (no quotes). Keep it <= 90 characters. Make it specific and operational.',
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    });

    const title = compact(response.choices?.[0]?.message?.content);
    return title || fallbackTicketTitle(input);
  } catch (err) {
    console.error('OpenAI title suggestion failed, using fallback:', err);
    return fallbackTicketTitle(input);
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const requireAdminOrManager = async (req: Request, res: Response): Promise<boolean> => {
    const userId = (req as any).supabaseUser?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return false;
    }
    const actor = await storage.getUser(userId);
    const ok = actor?.role === 'admin' || actor?.role === 'manager';
    if (!ok) {
      res.status(403).json({ message: "Forbidden" });
      return false;
    }
    return true;
  };

  const requireAdmin = async (req: Request, res: Response): Promise<boolean> => {
    const userId = (req as any).supabaseUser?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return false;
    }
    const actor = await storage.getUser(userId);
    const ok = actor?.role === 'admin';
    if (!ok) {
      res.status(403).json({ message: "Forbidden" });
      return false;
    }
    return true;
  };

  // Setup Supabase authentication routes
  setupSupabaseAuth(app);

  // Database seeding endpoint (development only)
  app.post("/api/seed", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ message: "Seeding only allowed in development" });
    }
    
    try {
      const result = await seedDatabase();
      res.json(result);
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ 
        success: false, 
        message: "Seeding failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getTicketStats();
      res.json({
        ...stats,
        avgResolutionHours: 0,
        slaCompliancePercent: 0,
        ticketsTrend: 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Momence proxy endpoints (authenticated). Keeps Momence secrets server-side.
  app.get('/api/momence/customers/search', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!momence.isConfigured()) {
        return res.json({ enabled: false, results: [] });
      }

      const q = String(req.query.query || '').trim();
      if (q.length < 2) return res.json({ enabled: true, results: [] });

      const results = await momence.searchCustomers(q);
      res.json({ enabled: true, results });
    } catch (error) {
      console.error('Momence customer search error:', error);
      res.status(500).json({ enabled: true, message: 'Momence search failed' });
    }
  });

  app.get('/api/momence/customers/:id', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!momence.isConfigured()) {
        return res.status(503).json({ enabled: false, message: 'Momence is not configured' });
      }

      const customer = await momence.getCustomerById(req.params.id);
      if (!customer) return res.status(404).json({ enabled: true, message: 'Customer not found' });
      res.json({ enabled: true, customer });
    } catch (error) {
      console.error('Momence get customer error:', error);
      res.status(500).json({ enabled: true, message: 'Momence customer fetch failed' });
    }
  });

  app.get('/api/momence/sessions/search', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!momence.isConfigured()) {
        return res.json({ enabled: false, results: [] });
      }
      const q = String(req.query.query || '').trim();
      if (q.length < 2) return res.json({ enabled: true, results: [] });

      const results = await momence.searchSessionsByName(q, 2);
      res.json({ enabled: true, results });
    } catch (error) {
      console.error('Momence session search error:', error);
      res.status(500).json({ enabled: true, message: 'Momence session search failed' });
    }
  });

  app.get('/api/momence/sessions/:id', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!momence.isConfigured()) {
        return res.status(503).json({ enabled: false, message: 'Momence is not configured' });
      }

      const session = await momence.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ enabled: true, message: 'Session not found' });
      res.json({ enabled: true, session });
    } catch (error) {
      console.error('Momence get session error:', error);
      res.status(500).json({ enabled: true, message: 'Momence session fetch failed' });
    }
  });

  // Tickets CRUD
  app.get("/api/tickets/next-number", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const ticketNumber = await storage.getNextTicketNumber();
      res.json({ ticketNumber });
    } catch (error) {
      console.error("Error generating next ticket number:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tickets", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const { status, priority, categoryId, assigneeId, department, search, limit, offset } = req.query;
      const tickets = await storage.getTickets({
        status: status as string,
        priority: priority as string,
        categoryId: categoryId as string,
        assigneeId: assigneeId as string,
        department: department as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tickets/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tickets", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Sanitize and prepare ticket data - only include actual ticket fields
      const ticketData: any = {
        categoryId: req.body.categoryId,
        subcategoryId: req.body.subcategoryId,
        clientName: req.body.clientName,
        clientEmail: req.body.clientEmail,
        clientPhone: req.body.clientPhone,
        clientStatus: req.body.clientStatus,
        clientMood: req.body.clientMood,
        title: req.body.title,
        description: req.body.description,
        actionTakenImmediately: req.body.actionTakenImmediately,
        locationId: req.body.locationId,
        // Convert ISO string timestamps to Date objects if provided
        incidentDateTime: req.body.incidentDateTime ? new Date(req.body.incidentDateTime) : undefined,
        status: req.body.status,
        priority: req.body.priority,
        department: req.body.department,
        assigneeId: req.body.assigneeId,
        reportedById: userId,
        reportedDateTime: new Date(),
        isEscalated: req.body.isEscalated === true || req.body.isEscalated === 'true',
        escalatedAt: req.body.escalatedAt ? new Date(req.body.escalatedAt) : undefined,
        escalatedToId: req.body.escalatedToId,
        escalationReason: req.body.escalationReason,
        followUpRequired: req.body.followUpRequired === true || req.body.followUpRequired === 'true',
        followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined,
        attachmentsCount: req.body.attachmentsCount || 0,
        formData: req.body.formData || {},
      };

      // Auto-generate a better title when the client sends a generic one.
      const incomingTitle = compact(ticketData.title);
      const incomingDescription = compact(ticketData.description);
      const isGenericTitle =
        !incomingTitle ||
        incomingTitle.toLowerCase() === 'new ticket' ||
        (incomingDescription && incomingTitle === incomingDescription);

      if (isGenericTitle) {
        const categories = await storage.getCategories();
        const categoryName = categories.find((c) => c.id === ticketData.categoryId)?.name ?? null;

        let subCategoryName: string | null = null;
        if (ticketData.categoryId && ticketData.subcategoryId) {
          const subs = await storage.getSubcategories(String(ticketData.categoryId));
          subCategoryName = subs.find((s) => s.id === ticketData.subcategoryId)?.name ?? null;
        }

        const formData = (ticketData.formData ?? {}) as Record<string, unknown>;
        const issueType = getFormValueByLabel(formData, 'Issue Type');

        ticketData.title = await suggestTicketTitle({
          categoryName,
          subCategoryName,
          issueType,
          clientName: compact(ticketData.clientName || formData['GLB-006']),
          locationName: compact(formData['GLB-004']),
          incidentDateTime: compact(ticketData.incidentDateTime || formData['GLB-003']),
          description: incomingDescription || compact(formData['GLB-012']),
          formData,
        });
      }

      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const ticket = await storage.updateTicket(req.params.id, req.body);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id/status", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const { status } = req.body;
      
      const existingTicket = await storage.getTicket(req.params.id);
      if (!existingTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Only the assigned agent should update status.
      // Allow admins/managers, and allow the original reporter as a fallback when unassigned.
      const actor = await storage.getUser(userId);
      const isPrivileged = actor?.role === 'admin' || actor?.role === 'manager';
      const isAssignee = !!existingTicket.assigneeId && existingTicket.assigneeId === userId;
      const isReporter = existingTicket.reportedById === userId;

      if (!isPrivileged && !isAssignee && !isReporter) {
        return res.status(403).json({ message: "Only the assigned agent can change status" });
      }

      const updates: any = { status };
      if (status === 'resolved' && !existingTicket.resolvedAt) {
        updates.resolvedAt = new Date();
      }
      if (status === 'closed' && !existingTicket.closedAt) {
        updates.closedAt = new Date();
      }

      const ticket = await storage.updateTicket(req.params.id, updates);

      // Create history entry
      await storage.createTicketHistory({
        ticketId: req.params.id,
        userId,
        action: 'status_change',
        previousValue: existingTicket.status,
        newValue: status,
        description: `Status changed from ${existingTicket.status} to ${status}`,
      });

      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id/priority", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const { priority } = req.body;
      
      const existingTicket = await storage.getTicket(req.params.id);
      if (!existingTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const ticket = await storage.updateTicket(req.params.id, { priority });

      // Create history entry
      await storage.createTicketHistory({
        ticketId: req.params.id,
        userId,
        action: 'priority_change',
        previousValue: existingTicket.priority,
        newValue: priority,
        description: `Priority changed from ${existingTicket.priority} to ${priority}`,
      });

      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tickets/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTicket(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ticket comments
  app.get("/api/tickets/:id/comments", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getTicketComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tickets/:id/comments", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const comment = await storage.createTicketComment({
        ticketId: req.params.id,
        userId,
        content: req.body.content,
        isInternal: req.body.isInternal || false,
      });

      // Create history entry
      await storage.createTicketHistory({
        ticketId: req.params.id,
        userId,
        action: 'comment_added',
        description: req.body.isInternal ? 'Internal note added' : 'Comment added',
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications
  app.get("/api/notifications", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications/unread", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const notifications = await storage.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const marked = await storage.markNotificationRead(req.params.id);
      if (!marked) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Categories and Locations
  app.get("/api/categories", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/categories/:id/subcategories", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const subcategories = await storage.getSubcategories(req.params.id);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/locations", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users
  app.get("/api/users", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Field groups for dynamic form section headers
  app.get("/api/field-groups", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const { categoryId, subcategoryId } = req.query;
      const groups = await storage.getFieldGroups({
        categoryId: (categoryId as string) || undefined,
        subcategoryId: (subcategoryId as string) || undefined,
      });
      res.json(groups);
    } catch (error) {
      console.error("Error fetching field groups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Form builder settings (global + persistent)
  app.get('/api/admin/users', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/users', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdmin(req, res))) return;

      const email = String(req.body?.email ?? '').trim();
      const password = String(req.body?.password ?? '').trim();
      const firstName = String(req.body?.firstName ?? '').trim();
      const lastName = String(req.body?.lastName ?? '').trim();
      const role = String(req.body?.role ?? 'support_staff').trim();
      const department = (req.body?.department ?? null) as any;
      const isActive = req.body?.isActive === undefined ? true : Boolean(req.body?.isActive);

      if (!email) return res.status(400).json({ message: 'Email is required' });

      const fullName = String(`${firstName} ${lastName}`).trim() || email;

      // If this email already exists in our DB, update that record instead of
      // attempting to insert a duplicate (users.email is unique).
      const existingByEmail = await storage.getUserByEmail(email);

      // Create the Supabase Auth user if possible; otherwise fail loudly because they asked for true user creation.
      const metadata = { first_name: firstName, last_name: lastName, full_name: fullName };

      let createdUserId: string | null = null;
      try {
        if (password) {
          const data = await authAdmin.createUser(email, password, metadata);
          createdUserId = (data as any)?.user?.id ?? null;
        } else {
          const data = await authAdmin.inviteUserByEmail(email, metadata);
          createdUserId = (data as any)?.user?.id ?? null;
        }
      } catch (e: any) {
        return res.status(400).json({ message: String(e?.message || e) });
      }

      if (!createdUserId) return res.status(500).json({ message: 'Failed to create auth user' });

      const saved = existingByEmail && existingByEmail.id !== createdUserId
        ? await storage.ensureUserIdForEmail({
            id: createdUserId,
            email,
            firstName,
            lastName,
            fullName,
            profileImageUrl: null,
            role: role as any,
            department,
            isActive,
          })
        : await storage.upsertUser({
            id: createdUserId,
            email,
            firstName,
            lastName,
            fullName,
            profileImageUrl: existingByEmail?.profileImageUrl ?? null,
            role: role as any,
            department,
            isActive,
          } as any);

      res.status(201).json(saved);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/admin/users/:id', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Missing user id' });

      const existing = await storage.getUser(id);
      if (!existing) return res.status(404).json({ message: 'User not found' });

      const nextFirstName = req.body?.firstName !== undefined ? String(req.body.firstName ?? '').trim() : existing.firstName;
      const nextLastName = req.body?.lastName !== undefined ? String(req.body.lastName ?? '').trim() : existing.lastName;
      const nextEmail = req.body?.email !== undefined ? String(req.body.email ?? '').trim() : existing.email;
      const nextFullName = String(`${nextFirstName || ''} ${nextLastName || ''}`).trim() || existing.fullName || nextEmail || '';

      const nextRole = req.body?.role !== undefined ? String(req.body.role ?? existing.role) : existing.role;
      const nextDepartment = req.body?.department !== undefined ? (req.body.department ?? null) : existing.department;
      const nextIsActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : existing.isActive;

      // Update Supabase auth metadata when service-role is configured.
      try {
        await authAdmin.updateUser(id, {
          email: nextEmail,
          user_metadata: { first_name: nextFirstName, last_name: nextLastName, full_name: nextFullName },
        });
      } catch {
        // Ignore if service role isn't configured; DB updates still apply.
      }

      const saved = await storage.upsertUser({
        ...existing,
        email: nextEmail,
        firstName: nextFirstName,
        lastName: nextLastName,
        fullName: nextFullName,
        role: nextRole as any,
        department: nextDepartment as any,
        isActive: nextIsActive,
      } as any);

      res.json(saved);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/admin/subcategories/:id', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Missing subcategory id' });

      const formFields = req.body?.formFields;
      if (formFields === undefined) return res.status(400).json({ message: 'formFields is required' });

      const saved = await storage.updateSubcategoryFormFields(id, formFields);
      if (!saved) return res.status(404).json({ message: 'Subcategory not found' });
      res.json(saved);
    } catch (error) {
      console.error('Error updating subcategory form fields:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin: Categories + Subcategories
  app.post('/api/admin/categories', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;

      const name = String(req.body?.name ?? '').trim();
      if (!name) return res.status(400).json({ message: 'name is required' });

      const payload: any = {
        name,
        description: req.body?.description ?? null,
        icon: req.body?.icon ?? null,
        color: req.body?.color ?? null,
        defaultDepartment: req.body?.defaultDepartment ?? null,
        isActive: req.body?.isActive === undefined ? true : Boolean(req.body?.isActive),
      };

      const created = await storage.createCategory(payload);
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating category:', error);
      // Likely uniqueness violation; surface as 400 to keep UX simple.
      res.status(400).json({ message: String(error?.message || 'Failed to create category') });
    }
  });

  app.patch('/api/admin/categories/:id', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Missing category id' });

      const updates: any = {};
      if (req.body?.name !== undefined) {
        const nextName = String(req.body?.name ?? '').trim();
        if (!nextName) return res.status(400).json({ message: 'name cannot be empty' });
        updates.name = nextName;
      }
      if (req.body?.description !== undefined) updates.description = req.body?.description ?? null;
      if (req.body?.icon !== undefined) updates.icon = req.body?.icon ?? null;
      if (req.body?.color !== undefined) updates.color = req.body?.color ?? null;
      if (req.body?.defaultDepartment !== undefined) updates.defaultDepartment = req.body?.defaultDepartment ?? null;
      if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body?.isActive);

      const saved = await storage.updateCategory(id, updates);
      if (!saved) return res.status(404).json({ message: 'Category not found' });
      res.json(saved);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(400).json({ message: String(error?.message || 'Failed to update category') });
    }
  });

  app.post('/api/admin/categories/:id/subcategories', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const categoryId = String(req.params.id || '').trim();
      if (!categoryId) return res.status(400).json({ message: 'Missing category id' });

      const name = String(req.body?.name ?? '').trim();
      if (!name) return res.status(400).json({ message: 'name is required' });

      const created = await storage.createSubcategory({
        categoryId,
        name,
        description: req.body?.description ?? null,
        defaultDepartment: req.body?.defaultDepartment ?? null,
        isActive: req.body?.isActive === undefined ? true : Boolean(req.body?.isActive),
        formFields: req.body?.formFields ?? { fields: [] },
      } as any);

      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating subcategory:', error);
      res.status(400).json({ message: String(error?.message || 'Failed to create subcategory') });
    }
  });

  app.patch('/api/admin/subcategories/:id/meta', verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Missing subcategory id' });

      const updates: any = {};
      if (req.body?.name !== undefined) {
        const nextName = String(req.body?.name ?? '').trim();
        if (!nextName) return res.status(400).json({ message: 'name cannot be empty' });
        updates.name = nextName;
      }
      if (req.body?.description !== undefined) updates.description = req.body?.description ?? null;
      if (req.body?.defaultDepartment !== undefined) updates.defaultDepartment = req.body?.defaultDepartment ?? null;
      if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body?.isActive);

      const saved = await storage.updateSubcategory(id, updates);
      if (!saved) return res.status(404).json({ message: 'Subcategory not found' });
      res.json(saved);
    } catch (error: any) {
      console.error('Error updating subcategory meta:', error);
      res.status(400).json({ message: String(error?.message || 'Failed to update subcategory') });
    }
  });

  app.get("/api/admin/form-fields", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const fields = await storage.getFormFields();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching form fields:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/form-fields", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const saved = await storage.upsertFormField(req.body);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error creating form field:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/form-fields/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const saved = await storage.upsertFormField({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (error) {
      console.error("Error updating form field:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/form-fields/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const ok = await storage.deleteFormField(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting form field:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/field-groups", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const groups = await storage.getFieldGroups({
        categoryId: (req.query.categoryId as string) || undefined,
        subcategoryId: (req.query.subcategoryId as string) || undefined,
      });
      res.json(groups);
    } catch (error) {
      console.error("Error fetching field groups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/field-groups", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const saved = await storage.upsertFieldGroup(req.body);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error creating field group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/field-groups/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const saved = await storage.upsertFieldGroup({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (error) {
      console.error("Error updating field group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/field-groups/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const ok = await storage.deleteFieldGroup(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting field group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/assignment-rules", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const rules = await storage.getAssignmentRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching assignment rules:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/assignment-rules", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const saved = await storage.upsertAssignmentRule(req.body);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error creating assignment rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/assignment-rules/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const saved = await storage.upsertAssignmentRule({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (error) {
      console.error("Error updating assignment rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/assignment-rules/:id", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      if (!(await requireAdminOrManager(req, res))) return;
      const ok = await storage.deleteAssignmentRule(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting assignment rule:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Analysis endpoint
  app.post("/api/ai/analyze", verifySupabaseAuth, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || text.length < 10) {
        return res.status(400).json({ message: "Text must be at least 10 characters" });
      }

      const prompt = `Analyze the following customer feedback for a fitness studio (Physique 57 India) and extract:
1. Suggested category (one of: class-experience, instructor-related, facility-amenities, membership-billing, booking-technology, customer-service, sales-marketing, health-safety, community-culture, retail-merchandise, special-programs, miscellaneous)
2. Suggested priority (critical, high, medium, low) based on urgency and severity
3. Suggested department for routing (operations, facilities, training, sales, client_success, marketing, finance, management)
4. Sentiment analysis (positive, neutral, negative)
5. Sentiment score (0-100, where 100 is most positive)
6. Key tags/keywords (up to 5)
7. A suggested brief title (max 100 characters)

Customer feedback:
"${text}"

Respond in JSON format only:
{
  "suggestedCategory": "category-id",
  "suggestedPriority": "priority",
  "suggestedDepartment": "department",
  "sentiment": "sentiment",
  "sentimentScore": number,
  "tags": ["tag1", "tag2"],
  "suggestedTitle": "brief title"
}`;

      if (!openai) {
        // Return a sensible fallback when OpenAI isn't configured (development preview).
        return res.json({
          suggestedCategory: "miscellaneous",
          suggestedPriority: "medium",
          suggestedDepartment: "operations",
          sentiment: "neutral",
          sentimentScore: 50,
          tags: [],
          suggestedTitle: "",
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an AI assistant that analyzes customer feedback for a fitness studio. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const analysis = JSON.parse(content);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing with AI:", error);
      res.status(500).json({ 
        message: "AI analysis failed",
        suggestedCategory: "miscellaneous",
        suggestedPriority: "medium",
        suggestedDepartment: "operations",
        sentiment: "neutral",
        sentimentScore: 50,
        tags: [],
        suggestedTitle: ""
      });
    }
  });

  return httpServer;
}
