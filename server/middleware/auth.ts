/**
 * Authentication & Authorization Middleware
 * Protects routes and verifies user permissions
 */

import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../shared/permissions';
import { ROLE_PERMISSIONS, hasPermission } from '../../shared/permissions';

// Extend Express Request to include user info
// Override Passport's user type with our custom user interface
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      departmentId?: string;
      teamId?: string;
      fullName: string;
    }
  }
}

/**
 * Require specific role(s)
 * Usage: app.get('/admin', requireRole(['admin']), handler)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

/**
 * Require specific permission
 * Usage: app.get('/users', requirePermission('canViewAllUsers'), handler)
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hasAccess = hasPermission(
      req.user.role,
      permission as keyof typeof ROLE_PERMISSIONS[UserRole]
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Permission denied',
        required: permission,
        role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Require multiple permissions (AND logic - all must be true)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const missingPermissions = permissions.filter(
      (permission) =>
        !hasPermission(
          req.user!.role,
          permission as keyof typeof ROLE_PERMISSIONS[UserRole]
        )
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        error: 'Missing required permissions',
        missing: missingPermissions,
        role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Require at least one permission (OR logic)
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hasAny = permissions.some(
      (permission) =>
        hasPermission(
          req.user!.role,
          permission as keyof typeof ROLE_PERMISSIONS[UserRole]
        )
    );

    if (!hasAny) {
      return res.status(403).json({
        error: 'No required permissions found',
        required: permissions,
        role: req.user.role,
      });
    }

    next();
  };
};

/**
 * Admin-only access
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Admin or Manager access
 */
export const requireAdminOrManager = requireRole(['admin', 'manager']);

/**
 * Any authenticated user (already logged in)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

/**
 * Check if user can access department
 * Only admin can access all, managers can only access their own
 */
export const canAccessDepartment = (userRole: UserRole, userDeptId?: string, targetDeptId?: string): boolean => {
  if (userRole === 'admin') return true;
  if (userRole === 'manager' && userDeptId === targetDeptId) return true;
  return false;
};

/**
 * Check if user can access team
 * Only admin can access all, managers can only access their own team
 */
export const canAccessTeam = (userRole: UserRole, userTeamId?: string, targetTeamId?: string): boolean => {
  if (userRole === 'admin') return true;
  if (userRole === 'manager' && userTeamId === targetTeamId) return true;
  return false;
};

/**
 * Check if user can view another user's profile
 */
export const canViewUserProfile = (
  viewerRole: UserRole,
  viewerId: string,
  targetUserId: string,
  viewerDeptId?: string,
  targetDeptId?: string
): boolean => {
  // Can always view own profile
  if (viewerId === targetUserId) return true;

  // Admin can view all
  if (viewerRole === 'admin') return true;

  // Manager can view team members in same department
  if (viewerRole === 'manager' && viewerDeptId === targetDeptId) return true;

  return false;
};
