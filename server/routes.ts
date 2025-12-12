import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifySupabaseToken } from "./supabase";
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

// Supabase auth middleware
const requireAuth = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifySupabaseToken(token);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Attach user to request
    (req as any).supabaseUser = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth routes
  app.get("/api/auth/user", requireAuth, async (req: Request, res: Response) => {
    try {
      const supabaseUser = (req as any).supabaseUser;
      if (!supabaseUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Sync Supabase user to our database
      let user = await storage.getUser(supabaseUser.id);
      if (!user) {
        // Create user from Supabase data
        await storage.upsertUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.first_name || supabaseUser.email?.split('@')[0] || 'User',
          lastName: supabaseUser.user_metadata?.last_name || '',
          profileImageUrl: supabaseUser.user_metadata?.avatar_url || null,
        });
        user = await storage.getUser(supabaseUser.id);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
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

  // Tickets CRUD
  app.get("/api/tickets", requireAuth, async (req: Request, res: Response) => {
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

  app.get("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.post("/api/tickets", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const ticketData = {
        ...req.body,
        reportedById: userId,
        reportedDateTime: new Date(),
      };

      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.patch("/api/tickets/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const { status } = req.body;
      
      const existingTicket = await storage.getTicket(req.params.id);
      if (!existingTicket) {
        return res.status(404).json({ message: "Ticket not found" });
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

  app.patch("/api/tickets/:id/priority", requireAuth, async (req: Request, res: Response) => {
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

  app.delete("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/tickets/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getTicketComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tickets/:id/comments", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications/unread", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser.id;
      const notifications = await storage.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/locations", requireAuth, async (req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users
  app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Analysis endpoint
  app.post("/api/ai/analyze", requireAuth, async (req: Request, res: Response) => {
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
