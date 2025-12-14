/**
 * usePermissions Hook
 * Check user permissions and control UI rendering
 */

import React from 'react';
import { useAuth } from './useAuth';
import type { UserRole } from '@shared/permissions';
import { hasPermission, ROLE_PERMISSIONS } from '@shared/permissions';

interface UsePermissionsReturn {
  role: UserRole | null;
  hasPermission: (permission: keyof typeof ROLE_PERMISSIONS[UserRole]) => boolean;
  hasAllPermissions: (permissions: (keyof typeof ROLE_PERMISSIONS[UserRole])[]) => boolean;
  hasAnyPermission: (permissions: (keyof typeof ROLE_PERMISSIONS[UserRole])[]) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTeamMember: boolean;
  isSupportStaff: boolean;
  permissions: typeof ROLE_PERMISSIONS[UserRole] | null;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();

  const checkPermission = (permission: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role, permission);
  };

  const checkAllPermissions = (permissions: (keyof typeof ROLE_PERMISSIONS[UserRole])[]): boolean => {
    return permissions.every((permission) => checkPermission(permission));
  };

  const checkAnyPermission = (permissions: (keyof typeof ROLE_PERMISSIONS[UserRole])[]): boolean => {
    return permissions.some((permission) => checkPermission(permission));
  };

  return {
    role: user?.role || null,
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isTeamMember: user?.role === 'team_member',
    isSupportStaff: user?.role === 'support_staff',
    permissions: user?.role ? ROLE_PERMISSIONS[user.role] : null,
  };
};

/**
 * ProtectedElement Component
 * Conditionally render content based on permissions
 */
interface ProtectedElementProps {
  children: React.ReactNode;
  permission?: keyof typeof ROLE_PERMISSIONS[UserRole];
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedElement: React.FC<ProtectedElementProps> = ({
  children,
  permission,
  requiredRole,
  fallback = null,
}) => {
  const { hasPermission: checkPermission, role } = usePermissions();

  // Check role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !roles.includes(role)) {
      return React.createElement(React.Fragment, null, fallback);
    }
  }

  // Check permission
  if (permission) {
    if (!checkPermission(permission)) {
      return React.createElement(React.Fragment, null, fallback);
    }
  }

  return React.createElement(React.Fragment, null, children);
};

/**
 * AdminOnly Component - Show only to admins
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => {
  return React.createElement(
    ProtectedElement,
    { requiredRole: 'admin', fallback, children },
  );
};

/**
 * ManagerOrAdmin Component - Show to managers and admins
 */
export const ManagerOrAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => {
  return React.createElement(
    ProtectedElement,
    { requiredRole: ['admin', 'manager'], fallback, children },
  );
};

/**
 * Hook to check if user can perform action
 */
export const useCanPerform = (permission: keyof typeof ROLE_PERMISSIONS[UserRole]) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

/**
 * Hook to get current user's permission set
 */
export const useCurrentPermissions = () => {
  const { permissions, role } = usePermissions();
  return { permissions, role };
};
