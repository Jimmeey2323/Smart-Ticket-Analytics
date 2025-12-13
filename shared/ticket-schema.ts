// Ticket Schema - Field types, categories, and validation rules
export interface FieldDefinition {
  id: string;
  label: string;
  fieldType: FieldType;
  options?: string[];
  subCategory: string;
  category: string;
  uniqueId: string;
  description: string;
  isRequired: boolean;
  isHidden: boolean;
  validation?: ValidationRule[];
}

export type FieldType = 
  | 'Auto-generated'
  | 'DateTime'
  | 'Date'
  | 'Dropdown'
  | 'Text'
  | 'Email'
  | 'Phone'
  | 'Long Text'
  | 'Checkbox'
  | 'File Upload'
  | 'Number';

export interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'pattern' | 'required' | 'min' | 'max';
  value: string | number;
  message: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  fields: string[]; // Field IDs
}

export interface TicketFormData {
  [fieldId: string]: any;
}

export interface TicketData {
  id: string;
  category: string;
  subCategory: string;
  formData: TicketFormData;
  status: TicketStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  reportedBy: string;
  clientInfo?: ClientInfo;
}

export type TicketStatus = 
  | 'open'
  | 'in-progress' 
  | 'pending'
  | 'resolved'
  | 'escalated'
  | 'closed';

export type Priority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface ClientInfo {
  name: string;
  email?: string;
  phone?: string;
  status: 'existing-active' | 'existing-inactive' | 'new-prospect' | 'trial-client' | 'guest';
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  type: 'studio' | 'popup' | 'partner';
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
}

// Constants
export const LOCATIONS: Location[] = [
  { id: 'kwality-kemps', name: 'Kwality House Kemps Corner', type: 'studio' },
  { id: 'kenkre-house', name: 'Kenkre House', type: 'studio' },
  { id: 'south-united', name: 'South United Football Club', type: 'partner' },
  { id: 'supreme-bandra', name: 'Supreme HQ Bandra', type: 'studio' },
  { id: 'wework-prestige', name: 'WeWork Prestige Central', type: 'partner' },
  { id: 'wework-galaxy', name: 'WeWork Galaxy', type: 'partner' },
  { id: 'copper-cloves', name: 'The Studio by Copper + Cloves', type: 'partner' },
  { id: 'popup', name: 'Pop-up', type: 'popup' }
];

export const DEPARTMENTS = [
  'Operations',
  'Facilities', 
  'Training',
  'Sales',
  'Client Success',
  'Marketing',
  'Finance',
  'Management'
];

export const CLIENT_MOODS = [
  'Calm',
  'Frustrated',
  'Angry', 
  'Disappointed',
  'Understanding'
];

export const PRIORITY_OPTIONS: { value: Priority; label: string; description: string }[] = [
  { value: 'low', label: 'Low (log only)', description: 'Non-urgent, documentation purposes' },
  { value: 'medium', label: 'Medium (48hrs)', description: 'Response required within 48 hours' },
  { value: 'high', label: 'High (24hrs)', description: 'Response required within 24 hours' },
  { value: 'critical', label: 'Critical (immediate)', description: 'Immediate attention required' }
];