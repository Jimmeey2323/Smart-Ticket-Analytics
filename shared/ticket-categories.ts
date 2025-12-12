import { Category, SubCategory, FieldDefinition } from './ticket-schema';

// Main Categories
export const CATEGORIES: Category[] = [
  {
    id: 'global',
    name: 'Global',
    description: 'Universal fields applicable to all tickets',
    color: '#64748b',
    icon: 'Globe'
  },
  {
    id: 'booking-technology',
    name: 'Booking & Technology',
    description: 'App, website, and booking system issues',
    color: '#3b82f6',
    icon: 'Smartphone'
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    description: 'Service quality and communication issues',
    color: '#10b981',
    icon: 'Users'
  },
  {
    id: 'facilities-equipment',
    name: 'Facilities & Equipment',
    description: 'Physical space, equipment, and infrastructure issues',
    color: '#f59e0b',
    icon: 'Building'
  },
  {
    id: 'class-instruction',
    name: 'Class & Instruction',
    description: 'Instructor performance and class-related issues',
    color: '#8b5cf6',
    icon: 'GraduationCap'
  },
  {
    id: 'membership-billing',
    name: 'Membership & Billing',
    description: 'Account, payment, and membership issues',
    color: '#ef4444',
    icon: 'CreditCard'
  },
  {
    id: 'health-safety',
    name: 'Health & Safety',
    description: 'Safety incidents and health-related concerns',
    color: '#dc2626',
    icon: 'Shield'
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    description: 'Other issues not covered by main categories',
    color: '#6b7280',
    icon: 'MoreHorizontal'
  }
];

// Sub Categories
export const SUB_CATEGORIES: SubCategory[] = [
  // Global
  {
    id: 'global-global',
    name: 'Global',
    categoryId: 'global',
    description: 'Universal fields for all tickets',
    fields: [
      'GLB-001', 'GLB-002', 'GLB-003', 'GLB-004', 'GLB-005',
      'GLB-006', 'GLB-007', 'GLB-008', 'GLB-009', 'GLB-010',
      'GLB-011', 'GLB-012', 'GLB-013', 'GLB-014', 'GLB-015', 'GLB-016'
    ]
  },
  
  // Booking & Technology
  {
    id: 'bt-app-website',
    name: 'App/Website Issues',
    categoryId: 'booking-technology',
    description: 'Technical problems with mobile app or website',
    fields: [
      'BT-APP-001', 'BT-APP-002', 'BT-APP-003', 'BT-APP-004',
      'BT-APP-005', 'BT-APP-006', 'BT-APP-007', 'BT-APP-008'
    ]
  },
  {
    id: 'bt-booking-failures',
    name: 'Booking Failures',
    categoryId: 'booking-technology',
    description: 'Issues with class booking process',
    fields: [
      'BT-BOOK-001', 'BT-BOOK-002', 'BT-BOOK-003', 'BT-BOOK-004',
      'BT-BOOK-005', 'BT-BOOK-006', 'BT-BOOK-007', 'BT-BOOK-008'
    ]
  },
  {
    id: 'bt-waitlist',
    name: 'Waitlist Issues',
    categoryId: 'booking-technology',
    description: 'Problems with waitlist functionality',
    fields: [
      'BT-WAIT-001', 'BT-WAIT-002', 'BT-WAIT-003', 'BT-WAIT-004',
      'BT-WAIT-005', 'BT-WAIT-006', 'BT-WAIT-007', 'BT-WAIT-008'
    ]
  },
  {
    id: 'bt-cancellation',
    name: 'Cancellation Problems',
    categoryId: 'booking-technology',
    description: 'Issues with cancelling bookings',
    fields: [
      'BT-CANC-001', 'BT-CANC-002', 'BT-CANC-003', 'BT-CANC-004',
      'BT-CANC-005', 'BT-CANC-006', 'BT-CANC-007', 'BT-CANC-008', 'BT-CANC-009'
    ]
  },
  {
    id: 'bt-checkin',
    name: 'Class Check-in',
    categoryId: 'booking-technology',
    description: 'Check-in process problems',
    fields: [
      'BT-CHKIN-001', 'BT-CHKIN-002', 'BT-CHKIN-003', 'BT-CHKIN-004',
      'BT-CHKIN-005', 'BT-CHKIN-006', 'BT-CHKIN-007', 'BT-CHKIN-008'
    ]
  },
  {
    id: 'bt-notifications',
    name: 'Notifications',
    categoryId: 'booking-technology',
    description: 'Email, SMS, and push notification issues',
    fields: [
      'BT-NOTIF-001', 'BT-NOTIF-002', 'BT-NOTIF-003', 'BT-NOTIF-004',
      'BT-NOTIF-005', 'BT-NOTIF-006', 'BT-NOTIF-007'
    ]
  },
  {
    id: 'bt-profile',
    name: 'Profile Management',
    categoryId: 'booking-technology',
    description: 'User profile and account settings issues',
    fields: [
      'BT-PROF-001', 'BT-PROF-002', 'BT-PROF-003', 'BT-PROF-004', 'BT-PROF-005'
    ]
  },
  {
    id: 'bt-visibility',
    name: 'Class Visibility',
    categoryId: 'booking-technology',
    description: 'Issues with class display and schedule visibility',
    fields: [
      'BT-VIS-001', 'BT-VIS-002', 'BT-VIS-003', 'BT-VIS-004',
      'BT-VIS-005', 'BT-VIS-006', 'BT-VIS-007'
    ]
  },
  {
    id: 'bt-payment',
    name: 'Payment Gateway',
    categoryId: 'booking-technology',
    description: 'Payment processing and transaction issues',
    fields: [
      'BT-PAY-001', 'BT-PAY-002', 'BT-PAY-003', 'BT-PAY-004', 'BT-PAY-005',
      'BT-PAY-006', 'BT-PAY-007', 'BT-PAY-008', 'BT-PAY-009', 'BT-PAY-010'
    ]
  },
  {
    id: 'bt-tech-support',
    name: 'Technical Support',
    categoryId: 'booking-technology',
    description: 'Support quality and response issues',
    fields: [
      'BT-TECH-001', 'BT-TECH-002', 'BT-TECH-003', 'BT-TECH-004',
      'BT-TECH-005', 'BT-TECH-006', 'BT-TECH-007'
    ]
  },

  // Customer Service
  {
    id: 'cs-front-desk',
    name: 'Front Desk Service',
    categoryId: 'customer-service',
    description: 'Front desk staff service quality issues',
    fields: [
      'CS-DESK-001', 'CS-DESK-002', 'CS-DESK-003', 'CS-DESK-004',
      'CS-DESK-005', 'CS-DESK-006', 'CS-DESK-007', 'CS-DESK-008'
    ]
  },
  {
    id: 'cs-response-time',
    name: 'Response Time',
    categoryId: 'customer-service',
    description: 'Communication and follow-up timing issues',
    fields: [
      'CS-RESP-001', 'CS-RESP-002', 'CS-RESP-003', 'CS-RESP-004',
      'CS-RESP-005', 'CS-RESP-006', 'CS-RESP-007', 'CS-RESP-008'
    ]
  },
  {
    id: 'cs-resolution',
    name: 'Issue Resolution',
    categoryId: 'customer-service',
    description: 'Problem resolution quality and effectiveness',
    fields: [
      'CS-RESOL-001', 'CS-RESOL-002', 'CS-RESOL-003', 'CS-RESOL-004',
      'CS-RESOL-005', 'CS-RESOL-006', 'CS-RESOL-007', 'CS-RESOL-008'
    ]
  }
];

// Helper functions
export const getCategoriesByType = () => {
  return CATEGORIES;
};

export const getSubCategoriesByCategory = (categoryId: string) => {
  return SUB_CATEGORIES.filter(sub => sub.categoryId === categoryId);
};

export const getCategoryById = (categoryId: string) => {
  return CATEGORIES.find(cat => cat.id === categoryId);
};

export const getSubCategoryById = (subCategoryId: string) => {
  return SUB_CATEGORIES.find(sub => sub.id === subCategoryId);
};