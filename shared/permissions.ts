/**
 * Role-Based Access Control Permissions
 * Define what each role can do in the system
 */

export type UserRole = 'admin' | 'manager' | 'team_member' | 'support_staff';

export interface RolePermissions {
  // User Management
  canViewAllUsers: boolean;
  canEditAllUsers: boolean;
  canDeleteUsers: boolean;
  canViewSalaryData: boolean;
  canViewUserProfiles: boolean;

  // Department Management
  canViewAllDepartments: boolean;
  canEditAllDepartments: boolean;
  canCreateDepartments: boolean;
  canDeleteDepartments: boolean;

  // Team Management
  canViewAllTeams: boolean;
  canEditAllTeams: boolean;
  canCreateTeams: boolean;
  canDeleteTeams: boolean;
  canManageTeamMembers: boolean;

  // Ticket Management
  canViewAllTickets: boolean;
  canEditAllTickets: boolean;
  canDeleteTickets: boolean;
  canAssignTickets: boolean;
  canEscalateTickets: boolean;
  canViewTicketReports: boolean;

  // Reports & Analytics
  canViewAnalytics: boolean;
  canViewTeamAnalytics: boolean;
  canExportReports: boolean;

  // Settings
  canAccessSettings: boolean;
  canManageRoles: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  // Admin - Full access to everything
  admin: {
    canViewAllUsers: true,
    canEditAllUsers: true,
    canDeleteUsers: true,
    canViewSalaryData: true,
    canViewUserProfiles: true,

    canViewAllDepartments: true,
    canEditAllDepartments: true,
    canCreateDepartments: true,
    canDeleteDepartments: true,

    canViewAllTeams: true,
    canEditAllTeams: true,
    canCreateTeams: true,
    canDeleteTeams: true,
    canManageTeamMembers: true,

    canViewAllTickets: true,
    canEditAllTickets: true,
    canDeleteTickets: true,
    canAssignTickets: true,
    canEscalateTickets: true,
    canViewTicketReports: true,

    canViewAnalytics: true,
    canViewTeamAnalytics: true,
    canExportReports: true,

    canAccessSettings: true,
    canManageRoles: true,
  },

  // Manager - Can manage own department/team
  manager: {
    canViewAllUsers: false,
    canEditAllUsers: false,
    canDeleteUsers: false,
    canViewSalaryData: false,
    canViewUserProfiles: true,

    canViewAllDepartments: true,
    canEditAllDepartments: false,
    canCreateDepartments: false,
    canDeleteDepartments: false,

    canViewAllTeams: false, // Only own teams
    canEditAllTeams: false,
    canCreateTeams: false,
    canDeleteTeams: false,
    canManageTeamMembers: true, // Only own team members

    canViewAllTickets: false, // Only own department
    canEditAllTickets: false,
    canDeleteTickets: false,
    canAssignTickets: true, // Within own team
    canEscalateTickets: true,
    canViewTicketReports: true, // Only own team reports

    canViewAnalytics: false,
    canViewTeamAnalytics: true, // Own team only
    canExportReports: false,

    canAccessSettings: false,
    canManageRoles: false,
  },

  // Team Member - Limited access
  team_member: {
    canViewAllUsers: false,
    canEditAllUsers: false,
    canDeleteUsers: false,
    canViewSalaryData: false,
    canViewUserProfiles: false, // Only own profile

    canViewAllDepartments: true, // View only
    canEditAllDepartments: false,
    canCreateDepartments: false,
    canDeleteDepartments: false,

    canViewAllTeams: false,
    canEditAllTeams: false,
    canCreateTeams: false,
    canDeleteTeams: false,
    canManageTeamMembers: false,

    canViewAllTickets: false, // Only assigned tickets
    canEditAllTickets: false, // Only own tickets
    canDeleteTickets: false,
    canAssignTickets: false,
    canEscalateTickets: false,
    canViewTicketReports: false,

    canViewAnalytics: false,
    canViewTeamAnalytics: false,
    canExportReports: false,

    canAccessSettings: false,
    canManageRoles: false,
  },

  // Support Staff - Minimal access
  support_staff: {
    canViewAllUsers: false,
    canEditAllUsers: false,
    canDeleteUsers: false,
    canViewSalaryData: false,
    canViewUserProfiles: false,

    canViewAllDepartments: false,
    canEditAllDepartments: false,
    canCreateDepartments: false,
    canDeleteDepartments: false,

    canViewAllTeams: false,
    canEditAllTeams: false,
    canCreateTeams: false,
    canDeleteTeams: false,
    canManageTeamMembers: false,

    canViewAllTickets: false,
    canEditAllTickets: false,
    canDeleteTickets: false,
    canAssignTickets: false,
    canEscalateTickets: false,
    canViewTicketReports: false,

    canViewAnalytics: false,
    canViewTeamAnalytics: false,
    canExportReports: false,

    canAccessSettings: false,
    canManageRoles: false,
  },
};

/**
 * Check if a user role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: keyof RolePermissions): boolean => {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
};

/**
 * Sensitive fields that should be hidden from non-admin users
 */
export const SENSITIVE_USER_FIELDS = [
  'password',
  'passwordHash',
  'email', // Only self or admin
  'salary',
  'ssn',
  'bankAccount',
  'personalNotes',
  'background',
];

/**
 * Field visibility rules based on role
 */
export const FIELD_VISIBILITY: Record<UserRole, string[]> = {
  admin: ['all'], // Admins see everything

  manager: [
    'id',
    'fullName',
    'profileImageUrl',
    'department',
    'role',
    'isActive',
    'createdAt',
    'email', // Own team members' emails
  ],

  team_member: [
    'id',
    'fullName',
    'profileImageUrl',
    'department',
  ],

  support_staff: [
    'id',
    'fullName',
    'profileImageUrl',
  ],
};
