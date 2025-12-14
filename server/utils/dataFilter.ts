/**
 * Data Filtering Utilities
 * Filter and sanitize data based on user role
 */

import type { UserRole } from '../../shared/permissions';
import { SENSITIVE_USER_FIELDS, FIELD_VISIBILITY } from '../../shared/permissions';

/**
 * Filter user object based on role
 * Removes sensitive fields that shouldn't be exposed
 */
export const filterUserData = (
  user: any,
  viewerRole: UserRole,
  viewerId: string,
  targetUserId: string,
  sameTeam: boolean = false
): Record<string, any> => {
  // User viewing their own profile sees everything
  if (viewerId === targetUserId) {
    return sanitizeUser(user);
  }

  const visibleFields = FIELD_VISIBILITY[viewerRole];

  // Admin sees all fields
  if (visibleFields.includes('all')) {
    return sanitizeUser(user);
  }

  // Filter based on role's visible fields
  const filtered: Record<string, any> = {};

  Object.keys(user).forEach((key) => {
    if (visibleFields.includes(key)) {
      filtered[key] = user[key];
    }
  });

  // Manager can see team members' emails if same team
  if (viewerRole === 'manager' && sameTeam && user.email) {
    filtered.email = user.email;
  }

  return filtered;
};

/**
 * Filter multiple users
 */
export const filterUsersData = (
  users: any[],
  viewerRole: UserRole,
  viewerId: string,
  getTeamInfo?: (userId: string) => { teamId: string; deptId: string } | null
): Record<string, any>[] => {
  return users.map((user) => {
    const teamInfo = getTeamInfo?.(user.id);
    const sameTeam = !!(teamInfo?.teamId && user.teamId === teamInfo.teamId);

    return filterUserData(user, viewerRole, viewerId, user.id, sameTeam || false);
  });
};

/**
 * Remove sensitive fields from user object
 */
export const sanitizeUser = (user: any): Record<string, any> => {
  const sanitized = { ...user };

  // Remove dangerous fields
  SENSITIVE_USER_FIELDS.forEach((field: string) => {
    delete sanitized[field];
  });

  return sanitized;
};

/**
 * Filter ticket data based on role
 */
export const filterTicketData = (
  ticket: any,
  viewerRole: UserRole,
  viewerId: string,
  viewerDeptId?: string
): Record<string, any> => {
  const filtered = { ...ticket };

  // Everyone can see basic ticket info
  const baseFields = ['id', 'title', 'description', 'status', 'priority', 'createdAt', 'updatedAt'];

  // Team member can only see their assigned tickets
  if (viewerRole === 'team_member') {
    if (ticket.assignedToId !== viewerId) {
      // Filter to only basic info if not assigned
      const limited: Record<string, any> = {};
      baseFields.forEach((field) => {
        limited[field] = filtered[field];
      });
      return limited;
    }
  }

  // Manager can see all tickets in their department
  if (viewerRole === 'manager') {
    if (ticket.departmentId !== viewerDeptId) {
      // Hide sensitive fields if not in their dept
      delete filtered.notes;
      delete filtered.internalComments;
    }
  }

  return filtered;
};

/**
 * Filter multiple tickets
 */
export const filterTicketsData = (
  tickets: any[],
  viewerRole: UserRole,
  viewerId: string,
  viewerDeptId?: string
): Record<string, any>[] => {
  return tickets
    .map((ticket) => filterTicketData(ticket, viewerRole, viewerId, viewerDeptId))
    .filter((ticket) => Object.keys(ticket).length > 0); // Remove completely hidden tickets
};

/**
 * Filter department data
 */
export const filterDepartmentData = (
  department: any,
  viewerRole: UserRole,
  viewerId: string
): Record<string, any> => {
  const filtered = { ...department };

  // Non-admins shouldn't see sensitive dept info
  if (viewerRole !== 'admin') {
    delete filtered.budget;
    delete filtered.financialData;
    delete filtered.internalNotes;
  }

  return filtered;
};

/**
 * Filter multiple departments
 */
export const filterDepartmentsData = (
  departments: any[],
  viewerRole: UserRole,
  viewerId: string
): Record<string, any>[] => {
  return departments.map((dept) => filterDepartmentData(dept, viewerRole, viewerId));
};

/**
 * Check if ticket is visible to user
 */
export const isTicketVisible = (
  ticket: any,
  viewerRole: UserRole,
  viewerId: string,
  viewerDeptId?: string
): boolean => {
  switch (viewerRole) {
    case 'admin':
      return true;

    case 'manager':
      // Manager can see tickets in their department
      return ticket.departmentId === viewerDeptId;

    case 'team_member':
      // Team member can only see their own tickets
      return ticket.assignedToId === viewerId;

    case 'support_staff':
      // Support staff can only see tickets assigned to them
      return ticket.assignedToId === viewerId;

    default:
      return false;
  }
};

/**
 * Build query filter based on user role
 * Use this in database queries to filter at the database level
 */
export const getTicketQueryFilter = (
  viewerRole: UserRole,
  viewerId: string,
  viewerDeptId?: string
): Record<string, any> => {
  switch (viewerRole) {
    case 'admin':
      return {}; // No filter, see all

    case 'manager':
      return { departmentId: viewerDeptId };

    case 'team_member':
    case 'support_staff':
      return { assignedToId: viewerId };

    default:
      return { id: 'impossible-match' }; // Don't match anything
  }
};

/**
 * Get analytics based on user role
 */
export const filterAnalyticsData = (
  analytics: any,
  viewerRole: UserRole,
  viewerId: string,
  viewerDeptId?: string
): Record<string, any> => {
  const filtered = { ...analytics };

  if (viewerRole === 'admin') {
    return filtered; // Admins see all analytics
  }

  if (viewerRole === 'manager') {
    // Managers only see their department's analytics
    filtered.departmentId = viewerDeptId;
    return filtered;
  }

  // Team members and support staff see limited analytics
  if (viewerRole === 'team_member' || viewerRole === 'support_staff') {
    // Only their own stats
    delete filtered.teamStats;
    delete filtered.departmentStats;
    return filtered;
  }

  return filtered;
};

/**
 * Redact sensitive information from logs/export
 */
export const redactSensitiveData = (data: any, role: UserRole): any => {
  const redacted = { ...data };

  if (role !== 'admin') {
    SENSITIVE_USER_FIELDS.forEach((field: string) => {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    });
  }

  return redacted;
};
