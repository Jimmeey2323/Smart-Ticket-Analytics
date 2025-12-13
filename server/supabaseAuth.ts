import { createClient } from '@supabase/supabase-js';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Please set SUPABASE_URL (or VITE_SUPABASE_URL) and one of SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.',
  );
}

// Default server Supabase client (non-admin key is sufficient for auth.getUser)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client (only available when service role is configured)
const supabaseAdmin = supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

// Middleware to verify Supabase JWT token
export function verifySupabaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  // Verify the JWT token with Supabase
  supabase.auth.getUser(token)
    .then(async ({ data: { user }, error }) => {
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Store user info in request for downstream handlers
      (req as any).supabaseUser = user;
      
      // Try to get or create user in our database
      try {
        const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
        const fullName = String(user.user_metadata?.full_name || `${firstName} ${lastName}`.trim() || user.email || '').trim();
        const email = user.email ?? null;

        // Always ensure the DB user id matches the Supabase user id.
        // This is critical for role checks (requireAdmin/requireManager) which
        // look up by Supabase id.
        let dbUser = await storage.getUser(user.id);
        if (!dbUser) {
          if (email) {
            dbUser = await storage.ensureUserIdForEmail({
              id: user.id,
              email,
              firstName,
              lastName,
              fullName,
              profileImageUrl: user.user_metadata?.avatar_url || null,
              isActive: true,
            });
          } else {
            dbUser = await storage.upsertUser({
              id: user.id,
              email,
              firstName,
              lastName,
              fullName,
              profileImageUrl: user.user_metadata?.avatar_url || null,
              role: 'support_staff',
              department: null,
              isActive: true,
            });
          }
        } else if (email) {
          // Keep profile fields reasonably fresh without overwriting role.
          // Use ensureUserIdForEmail to safely handle existing users
          dbUser = await storage.ensureUserIdForEmail({
            id: dbUser.id,
            email: email,
            firstName: dbUser.firstName ?? firstName,
            lastName: dbUser.lastName ?? lastName,
            fullName: dbUser.fullName || fullName || dbUser.email || '',
            profileImageUrl: user.user_metadata?.avatar_url || dbUser.profileImageUrl || null,
            role: dbUser.role ?? 'support_staff',
            department: dbUser.department ?? null,
            isActive: true,
          });
        } else {
          // Fallback if no email - just update existing user directly
          const updated = { ...dbUser } as any;
          updated.firstName = dbUser.firstName ?? firstName;
          updated.lastName = dbUser.lastName ?? lastName;
          updated.fullName = dbUser.fullName || fullName || dbUser.email || '';
          updated.profileImageUrl = user.user_metadata?.avatar_url || dbUser.profileImageUrl || null;
          updated.isActive = true;
          updated.updatedAt = new Date();
          dbUser = updated;
        }
        
        (req as any).user = dbUser;
        next();
      } catch (dbError) {
        console.error('Error handling user data:', dbError);
        return res.status(500).json({ error: 'Internal server error' });
      }
    })
    .catch(error => {
      console.error('Supabase auth error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    });
}

// Optional middleware for routes that work with or without auth
export function optionalSupabaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without user context
    return next();
  }

  const token = authHeader.substring(7);

  supabase.auth.getUser(token)
    .then(async ({ data: { user }, error }) => {
      if (!error && user) {
        (req as any).supabaseUser = user;
        
        try {
          const dbUser = await storage.getUser(user.id);
          if (dbUser) {
            (req as any).user = dbUser;
          }
        } catch (dbError) {
          console.error('Error fetching user data:', dbError);
        }
      }
      
      next();
    })
    .catch(() => {
      // Authentication failed, but continue without user context
      next();
    });
}

// Helper function to create Supabase client for client-side operations
export function createSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase client configuration');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Admin helper to manage users
export const authAdmin = {
  async createUser(email: string, password: string, userData?: any) {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin user management');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userData
    });

    if (error) throw error;
    return data;
  },

  async inviteUserByEmail(email: string, userData?: any) {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin user management');
    // Supabase Admin API supports inviting users by email (sends an invite link).
    const adminAny = supabaseAdmin.auth.admin as any;
    if (typeof adminAny.inviteUserByEmail !== 'function') {
      throw new Error('Supabase inviteUserByEmail is not available in this Supabase client version');
    }

    const { data, error } = await adminAny.inviteUserByEmail(email, {
      data: userData,
    });
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, attributes: any) {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin user management');
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, attributes);
    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin user management');
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return data;
  },

  async listUsers() {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin user management');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    return data;
  }
};

// Initialize auth routes
export function setupSupabaseAuth(app: Express) {
  // Auth status endpoint
  app.get('/api/auth/user', verifySupabaseAuth, (req, res) => {
    const user = (req as any).user;
    const supabaseUser = (req as any).supabaseUser;
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      supabaseMetadata: {
        createdAt: supabaseUser.created_at,
        lastSignIn: supabaseUser.last_sign_in_at,
        emailVerified: supabaseUser.email_confirmed_at
      }
    });
  });

  // Logout endpoint
  app.post('/api/auth/logout', verifySupabaseAuth, async (req, res) => {
    try {
      // Note: With Supabase, logout is typically handled client-side
      // Server-side logout would require token blacklisting or short-lived tokens
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Profile update endpoint
  app.put('/api/auth/profile', verifySupabaseAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { firstName, lastName, department } = req.body;

      const nextFirst = firstName || user.firstName;
      const nextLast = lastName || user.lastName;
      const nextFull = String(`${nextFirst || ''} ${nextLast || ''}`).trim() || user.fullName || user.email || '';

      const updatedUser = await storage.upsertUser({
        ...user,
        firstName: nextFirst,
        lastName: nextLast,
        fullName: nextFull,
        department: department || user.department
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  console.log('🔐 Supabase authentication routes configured');
}