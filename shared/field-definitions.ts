import { FieldDefinition, FieldType } from './ticket-schema';

// Parse CSV row into field definition
const parseField = (row: any): FieldDefinition => {
  const options = row['Options/Other Details'] 
    ? row['Options/Other Details'].split(' | ').filter((opt: string) => opt.trim() !== '')
    : undefined;

  return {
    id: row['Unique ID'],
    label: row['Label'],
    fieldType: row['Field Type'] as FieldType,
    options,
    subCategory: row['Sub Category'],
    category: row['Category'],
    uniqueId: row['Unique ID'],
    description: row['Description'],
    isRequired: row['Is Required'] === 'Yes',
    isHidden: row['Is Hidden'] === 'Yes'
  };
};

// All field definitions extracted from CSV
export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // Global Fields
  {
    id: 'GLB-001',
    label: 'Ticket ID',
    fieldType: 'Auto-generated',
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-001',
    description: 'Unique identifier for each ticket',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-002',
    label: 'Date & Time Reported',
    fieldType: 'DateTime',
    options: ['Auto-populated'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-002',
    description: 'When the issue was reported to staff',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-003',
    label: 'Date & Time of Incident',
    fieldType: 'DateTime',
    options: ['Manual entry'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-003',
    description: 'When the issue actually occurred',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-004',
    label: 'Location',
    fieldType: 'Dropdown',
    options: [
      'Kwality House Kemps Corner',
      'Kenkre House',
      'South United Football Club',
      'Supreme HQ Bandra',
      'WeWork Prestige Central',
      'WeWork Galaxy',
      'The Studio by Copper + Cloves',
      'Pop-up'
    ],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-004',
    description: 'Studio location where issue occurred',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-005',
    label: 'Reported By (Staff)',
    fieldType: 'Dropdown',
    options: ['Associates list'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-005',
    description: 'Staff member logging the ticket',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-006',
    label: 'Client Name',
    fieldType: 'Text',
    options: ['Free text entry'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-006',
    description: 'Name of the client reporting issue',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-007',
    label: 'Client Email',
    fieldType: 'Email',
    options: ['Email format'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-007',
    description: 'Client\'s email address',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'GLB-008',
    label: 'Client Phone',
    fieldType: 'Phone',
    options: ['Phone number format'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-008',
    description: 'Client\'s contact number',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'GLB-009',
    label: 'Client Status',
    fieldType: 'Dropdown',
    options: [
      'Existing Active',
      'Existing Inactive',
      'New Prospect',
      'Trial Client',
      'Guest (Hosted Class)'
    ],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-009',
    description: 'Client\'s membership status',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-010',
    label: 'Priority',
    fieldType: 'Dropdown',
    options: [
      'Low (log only)',
      'Medium (48hrs)',
      'High (24hrs)',
      'Critical (immediate)'
    ],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-010',
    description: 'Urgency level of the issue',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-011',
    label: 'Department Routing',
    fieldType: 'Dropdown',
    options: [
      'Operations',
      'Facilities',
      'Training',
      'Sales',
      'Client Success',
      'Marketing',
      'Finance',
      'Management'
    ],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-011',
    description: 'Which department should handle this',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-012',
    label: 'Issue Description',
    fieldType: 'Long Text',
    options: ['Free text area, min 50 characters'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-012',
    description: 'Detailed description of the issue',
    isRequired: true,
    isHidden: false,
    validation: [
      { type: 'minLength', value: 50, message: 'Description must be at least 50 characters' }
    ]
  },
  {
    id: 'GLB-013',
    label: 'Action Taken Immediately',
    fieldType: 'Long Text',
    options: ['Free text area'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-013',
    description: 'What was done on the spot',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'GLB-014',
    label: 'Client Mood/Sentiment',
    fieldType: 'Dropdown',
    options: [
      'Calm',
      'Frustrated',
      'Angry',
      'Disappointed',
      'Understanding'
    ],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-014',
    description: 'Client\'s emotional state',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'GLB-015',
    label: 'Follow-up Required',
    fieldType: 'Checkbox',
    options: ['Yes/No'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-015',
    description: 'Does this need additional follow-up',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'GLB-016',
    label: 'Attachments',
    fieldType: 'File Upload',
    options: ['Images, PDFs, screenshots'],
    subCategory: 'Global',
    category: 'Global',
    uniqueId: 'GLB-016',
    description: 'Supporting documentation',
    isRequired: false,
    isHidden: false
  },

  // Booking & Technology - App/Website Issues
  {
    id: 'BT-APP-001',
    label: 'Issue Type',
    fieldType: 'Dropdown',
    options: [
      'App Crash',
      'Slow Loading',
      'Login Problems',
      'Feature Not Working',
      'UI/UX Confusion',
      'Other'
    ],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-001',
    description: 'Specific type of technical issue',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'BT-APP-002',
    label: 'Platform',
    fieldType: 'Dropdown',
    options: [
      'iOS App',
      'Android App',
      'Website (Desktop)',
      'Website (Mobile)'
    ],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-002',
    description: 'Which platform had the issue',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'BT-APP-003',
    label: 'Device/Browser',
    fieldType: 'Text',
    options: ['Free text'],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-003',
    description: 'Device model or browser used',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'BT-APP-004',
    label: 'App Version',
    fieldType: 'Text',
    options: ['Auto-detect if possible'],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-004',
    description: 'Version number of the app',
    isRequired: false,
    isHidden: true
  },
  {
    id: 'BT-APP-005',
    label: 'Error Message',
    fieldType: 'Text',
    options: ['Free text'],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-005',
    description: 'Exact error message shown',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'BT-APP-006',
    label: 'Steps to Reproduce',
    fieldType: 'Long Text',
    options: ['Free text area'],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-006',
    description: 'What the client was trying to do',
    isRequired: true,
    isHidden: false
  },
  {
    id: 'BT-APP-007',
    label: 'Screenshot Available',
    fieldType: 'Checkbox',
    options: ['Yes/No'],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-007',
    description: 'Did client provide screenshot',
    isRequired: false,
    isHidden: false
  },
  {
    id: 'BT-APP-008',
    label: 'Workaround Provided',
    fieldType: 'Long Text',
    options: ['Free text'],
    subCategory: 'App/Website Issues',
    category: 'Booking & Technology',
    uniqueId: 'BT-APP-008',
    description: 'Alternative solution offered',
    isRequired: false,
    isHidden: false
  }
];

// Helper functions
export const getFieldsByCategory = (categoryId: string): FieldDefinition[] => {
  return FIELD_DEFINITIONS.filter(field => field.category === categoryId);
};

export const getFieldsBySubCategory = (subCategoryId: string): FieldDefinition[] => {
  return FIELD_DEFINITIONS.filter(field => field.subCategory === subCategoryId);
};

export const getFieldById = (fieldId: string): FieldDefinition | undefined => {
  return FIELD_DEFINITIONS.find(field => field.id === fieldId);
};

export const getRequiredFields = (categoryId: string, subCategoryId?: string): FieldDefinition[] => {
  let fields = FIELD_DEFINITIONS.filter(field => field.isRequired);
  
  if (categoryId) {
    fields = fields.filter(field => field.category === categoryId);
  }
  
  if (subCategoryId) {
    fields = fields.filter(field => field.subCategory === subCategoryId);
  }
  
  return fields;
};

export const getVisibleFields = (categoryId: string, subCategoryId?: string): FieldDefinition[] => {
  let fields = FIELD_DEFINITIONS.filter(field => !field.isHidden);
  
  if (categoryId) {
    fields = fields.filter(field => field.category === categoryId);
  }
  
  if (subCategoryId) {
    fields = fields.filter(field => field.subCategory === subCategoryId);
  }
  
  return fields;
};