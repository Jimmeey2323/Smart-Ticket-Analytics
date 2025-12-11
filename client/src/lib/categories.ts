// Categories and subcategories data for Physique 57 ticket management
// Based on the comprehensive category structure from requirements

export interface FormField {
  id: string;
  label: string;
  fieldType: 'text' | 'email' | 'phone' | 'number' | 'dropdown' | 'multi-select' | 'textarea' | 'checkbox' | 'datetime' | 'date' | 'file';
  options?: string[];
  isRequired: boolean;
  isHidden?: boolean;
  description?: string;
  placeholder?: string;
}

export interface SubcategoryData {
  id: string;
  name: string;
  description?: string;
  formFields: FormField[];
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultDepartment: string;
  subcategories: SubcategoryData[];
}

// Global fields that apply to all tickets
export const globalFields: FormField[] = [
  { id: 'incidentDateTime', label: 'Date & Time of Incident', fieldType: 'datetime', isRequired: true, description: 'When the issue actually occurred' },
  { id: 'location', label: 'Location', fieldType: 'dropdown', options: ['Kwality House Kemps Corner', 'Kenkre House', 'South United Football Club', 'Supreme HQ Bandra', 'WeWork Prestige Central', 'WeWork Galaxy', 'The Studio by Copper + Cloves', 'Pop-up'], isRequired: true, description: 'Studio location where issue occurred' },
  { id: 'clientName', label: 'Client Name', fieldType: 'text', isRequired: true, description: 'Name of the client reporting issue' },
  { id: 'clientEmail', label: 'Client Email', fieldType: 'email', isRequired: false, description: "Client's email address" },
  { id: 'clientPhone', label: 'Client Phone', fieldType: 'phone', isRequired: false, description: "Client's contact number" },
  { id: 'clientStatus', label: 'Client Status', fieldType: 'dropdown', options: ['Existing Active', 'Existing Inactive', 'New Prospect', 'Trial Client', 'Guest (Hosted Class)'], isRequired: true, description: "Client's membership status" },
  { id: 'priority', label: 'Priority', fieldType: 'dropdown', options: ['Low (log only)', 'Medium (48hrs)', 'High (24hrs)', 'Critical (immediate)'], isRequired: true, description: 'Urgency level of the issue' },
  { id: 'department', label: 'Department Routing', fieldType: 'dropdown', options: ['Operations', 'Facilities', 'Training', 'Sales', 'Client Success', 'Marketing', 'Finance', 'Management'], isRequired: true, description: 'Which department should handle this' },
  { id: 'description', label: 'Issue Description', fieldType: 'textarea', isRequired: true, description: 'Detailed description of the issue', placeholder: 'Please provide at least 50 characters describing the issue...' },
  { id: 'actionTakenImmediately', label: 'Action Taken Immediately', fieldType: 'textarea', isRequired: false, description: 'What was done on the spot' },
  { id: 'clientMood', label: 'Client Mood/Sentiment', fieldType: 'dropdown', options: ['Calm', 'Frustrated', 'Angry', 'Disappointed', 'Understanding'], isRequired: false, description: "Client's emotional state" },
  { id: 'followUpRequired', label: 'Follow-up Required', fieldType: 'checkbox', isRequired: true, description: 'Does this need additional follow-up' },
];

export const categories: CategoryData[] = [
  {
    id: 'class-experience',
    name: 'Class Experience',
    icon: 'Dumbbell',
    color: '#3B82F6',
    defaultDepartment: 'training',
    subcategories: [
      {
        id: 'class-quality',
        name: 'Class Quality',
        description: 'Instructor technique, workout effectiveness, music quality, energy levels, choreography flow',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Instructor Technique', 'Workout Effectiveness', 'Music Quality', 'Energy Levels', 'Choreography Flow', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'dropdown', options: ['Physique 57 Signature', 'Physique 57 Express', 'Physique 57 Arms & Abs', 'Physique 57 Stretch', 'Other'], isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'specificFeedback', label: 'Specific Feedback', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'class-scheduling',
        name: 'Class Scheduling',
        description: 'Timing conflicts, insufficient class slots, peak hour congestion, cancellations, schedule changes',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Timing Conflicts', 'Insufficient Class Slots', 'Peak Hour Congestion', 'Class Cancellations', 'Schedule Changes', 'Holiday Schedules', 'Other'], isRequired: true },
          { id: 'preferredTiming', label: 'Preferred Timing', fieldType: 'text', isRequired: false },
          { id: 'affectedDates', label: 'Affected Dates', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'class-overcrowding',
        name: 'Class Overcrowding',
        description: 'Too many participants, inadequate space per person, equipment shortage',
        formFields: [
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'estimatedParticipants', label: 'Estimated Number of Participants', fieldType: 'number', isRequired: false },
          { id: 'specificConcern', label: 'Specific Concern', fieldType: 'dropdown', options: ['Too Many Participants', 'Inadequate Space', 'Equipment Shortage', 'Uncomfortable Proximity', 'Other'], isRequired: true },
        ]
      },
      {
        id: 'class-level',
        name: 'Class Level Appropriateness',
        description: 'Difficulty level mismatch, lack of beginner/advanced options',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Too Difficult', 'Too Easy', 'Lack of Beginner Options', 'Lack of Advanced Options', 'Progression Gaps', 'Other'], isRequired: true },
          { id: 'clientFitnessLevel', label: 'Client Fitness Level', fieldType: 'dropdown', options: ['Beginner', 'Intermediate', 'Advanced'], isRequired: false },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
        ]
      },
      {
        id: 'class-variety',
        name: 'Class Variety',
        description: 'Limited class formats, repetitive routines, new format requests',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Limited Class Formats', 'Repetitive Routines', 'New Format Request', 'Theme Class Request', 'Other'], isRequired: true },
          { id: 'suggestedFormat', label: 'Suggested Format/Class', fieldType: 'textarea', isRequired: false },
        ]
      },
      {
        id: 'class-duration',
        name: 'Class Duration',
        description: 'Too short/long, rushed transitions, inadequate warm-up/cool-down',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Too Short', 'Too Long', 'Rushed Transitions', 'Inadequate Warm-up', 'Inadequate Cool-down', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'preferredDuration', label: 'Preferred Duration (minutes)', fieldType: 'number', isRequired: false },
        ]
      },
      {
        id: 'music-playlist',
        name: 'Music & Playlist',
        description: 'Volume issues, music choice, outdated playlists',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Volume Too High', 'Volume Too Low', 'Poor Music Choice', 'Outdated Playlists', 'Explicit Content', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'class-pacing',
        name: 'Class Pacing',
        description: 'Too fast/slow, insufficient rest periods, unbalanced muscle targeting',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Too Fast', 'Too Slow', 'Insufficient Rest Periods', 'Unbalanced Muscle Targeting', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'warmup-cooldown',
        name: 'Warm-up/Cool-down',
        description: 'Inadequate stretching, missing proper warm-up, rushed cool-down',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Inadequate Stretching', 'Missing Proper Warm-up', 'Rushed Cool-down', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
        ]
      },
      {
        id: 'modifications',
        name: 'Modifications Offered',
        description: 'Lack of injury modifications, pregnancy options, beginner alternatives',
        formFields: [
          { id: 'modificationType', label: 'Modification Type Needed', fieldType: 'dropdown', options: ['Injury Modification', 'Pregnancy Option', 'Beginner Alternative', 'Senior Modification', 'Other'], isRequired: true },
          { id: 'specificCondition', label: 'Specific Condition/Need', fieldType: 'textarea', isRequired: false },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'instructor-related',
    name: 'Instructor Related',
    icon: 'UserCircle',
    color: '#8B5CF6',
    defaultDepartment: 'training',
    subcategories: [
      {
        id: 'teaching-quality',
        name: 'Teaching Quality',
        description: 'Poor instruction, lack of modifications, unclear cues',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Instruction', 'Lack of Modifications', 'Unclear Cues', 'Inconsistent Technique', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
        ]
      },
      {
        id: 'professionalism',
        name: 'Professionalism',
        description: 'Late arrivals, unprepared, inappropriate behavior',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Late Arrival', 'Unprepared', 'Inappropriate Behavior', 'Inappropriate Comments', 'Dress Code Violation', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'attention-correction',
        name: 'Attention & Correction',
        description: 'Lack of individual attention, no form corrections, favoritism',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Lack of Individual Attention', 'No Form Corrections', 'Favoritism', 'Ignoring Raised Hands', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
        ]
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'Rude behavior, dismissive attitude, language barriers',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Rude Behavior', 'Dismissive Attitude', 'Language Barrier', 'Poor English/Hindi Fluency', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'instructor-cancellations',
        name: 'Instructor Cancellations',
        description: 'Last-minute substitutions, frequent cancellations',
        formFields: [
          { id: 'instructor', label: 'Original Instructor', fieldType: 'text', isRequired: true },
          { id: 'substituteInstructor', label: 'Substitute Instructor (if any)', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Last-minute Substitution', 'Frequent Cancellations', 'No Prior Notice', 'Other'], isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'noticePeriod', label: 'How much notice was given?', fieldType: 'dropdown', options: ['None', 'Less than 1 hour', '1-4 hours', '4-24 hours', 'More than 24 hours'], isRequired: false },
        ]
      },
      {
        id: 'motivation-energy',
        name: 'Motivation & Energy',
        description: 'Low energy, demotivating comments, lack of encouragement',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Low Energy', 'Demotivating Comments', 'Lack of Encouragement', 'Boring Delivery', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
        ]
      },
      {
        id: 'safety-injury-prevention',
        name: 'Safety & Injury Prevention',
        description: 'Ignoring injury disclosures, pushing beyond limits',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Ignoring Injury Disclosure', 'Pushing Beyond Limits', 'Unsafe Cues', 'No Safety Warnings', 'Other'], isRequired: true },
          { id: 'injuryDisclosed', label: 'Was injury disclosed beforehand?', fieldType: 'checkbox', isRequired: false },
          { id: 'safetyDetails', label: 'Safety Concern Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'knowledge-expertise',
        name: 'Knowledge & Expertise',
        description: 'Limited anatomy knowledge, inability to answer questions',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Limited Anatomy Knowledge', 'Inability to Answer Questions', 'Inexperienced', 'Other'], isRequired: true },
          { id: 'questionAsked', label: 'Question/Topic They Could Not Address', fieldType: 'textarea', isRequired: false },
        ]
      },
      {
        id: 'punctuality',
        name: 'Punctuality',
        description: 'Starting late, ending early, extending beyond time',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Started Late', 'Ended Early', 'Extended Beyond Time', 'Other'], isRequired: true },
          { id: 'timeVariation', label: 'Time Variation (minutes)', fieldType: 'number', isRequired: false },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
        ]
      },
      {
        id: 'personal-boundaries',
        name: 'Personal Boundaries',
        description: 'Overly physical adjustments without consent',
        formFields: [
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Physical Adjustment Without Consent', 'Inappropriate Touching', 'Personal Space Violation', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
          { id: 'consentAsked', label: 'Was consent asked before adjustment?', fieldType: 'dropdown', options: ['Yes', 'No'], isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'facility-amenities',
    name: 'Facility & Amenities',
    icon: 'Building2',
    color: '#10B981',
    defaultDepartment: 'facilities',
    subcategories: [
      {
        id: 'studio-cleanliness',
        name: 'Studio Cleanliness',
        description: 'Unclean workout area, equipment hygiene, floor conditions',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unclean Workout Area', 'Equipment Hygiene', 'Floor Conditions', 'Dust', 'Dirty Mirrors', 'Other'], isRequired: true },
          { id: 'specificArea', label: 'Specific Area', fieldType: 'text', isRequired: true },
          { id: 'severity', label: 'Severity', fieldType: 'dropdown', options: ['Minor', 'Moderate', 'Severe'], isRequired: true },
        ]
      },
      {
        id: 'changing-room',
        name: 'Changing Room Issues',
        description: 'Locker problems, cleanliness, inadequate facilities',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Locker Problems', 'Cleanliness', 'Inadequate Facilities', 'Missing Amenities', 'Insufficient Space', 'Other'], isRequired: true },
          { id: 'lockerNumber', label: 'Locker Number (if applicable)', fieldType: 'text', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'washroom-shower',
        name: 'Washroom/Shower',
        description: 'Maintenance issues, cleanliness, hot water, supplies',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Maintenance Issues', 'Cleanliness', 'No Hot Water', 'Missing Supplies', 'Drainage', 'Odor', 'Other'], isRequired: true },
          { id: 'specificFacility', label: 'Specific Facility', fieldType: 'dropdown', options: ['Washroom', 'Shower', 'Both'], isRequired: true },
        ]
      },
      {
        id: 'equipment-issues',
        name: 'Equipment Issues',
        description: 'Broken/damaged props, insufficient equipment, worn-out mats',
        formFields: [
          { id: 'equipmentType', label: 'Equipment Type', fieldType: 'dropdown', options: ['Ball', 'Mat', 'Weights', 'Resistance Bands', 'Barre', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Broken/Damaged', 'Insufficient Quantity', 'Worn Out', 'Missing', 'Dirty', 'Other'], isRequired: true },
          { id: 'quantity', label: 'Quantity Affected', fieldType: 'number', isRequired: false },
        ]
      },
      {
        id: 'temperature-control',
        name: 'Temperature Control',
        description: 'Too hot/cold, poor ventilation, AC issues',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Too Hot', 'Too Cold', 'Poor Ventilation', 'AC Not Working', 'Humidity Problems', 'Other'], isRequired: true },
          { id: 'roomArea', label: 'Room/Area', fieldType: 'dropdown', options: ['Studio 1', 'Studio 2', 'Changing Room', 'Reception', 'Other'], isRequired: true },
        ]
      },
      {
        id: 'lighting-ambiance',
        name: 'Lighting & Ambiance',
        description: 'Poor lighting, broken mirrors, sound system issues',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Lighting', 'Broken Mirrors', 'Sound System Issues', 'Ambiance Problems', 'Other'], isRequired: true },
          { id: 'roomArea', label: 'Room/Area', fieldType: 'text', isRequired: true },
        ]
      },
      {
        id: 'parking',
        name: 'Parking',
        description: 'Unavailability, accessibility, valet service issues',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unavailable', 'Accessibility Issues', 'Valet Service Issues', 'Parking Charges', 'Safety Concerns', 'Other'], isRequired: true },
          { id: 'vehicleType', label: 'Vehicle Type', fieldType: 'dropdown', options: ['Car', 'Two-wheeler', 'Other'], isRequired: false },
        ]
      },
      {
        id: 'water-refreshments',
        name: 'Water & Refreshments',
        description: 'Water station cleanliness, no hot water, lacking refreshments',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Water Station Cleanliness', 'No Hot Water', 'Lacking Refreshments', 'Unhygienic Dispensers', 'Other'], isRequired: true },
        ]
      },
      {
        id: 'studio-layout',
        name: 'Studio Layout',
        description: 'Space constraints, flow issues, visibility problems',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Space Constraints', 'Flow Issues', 'Visibility Problems', 'Overcrowded Reception', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'maintenance-issues',
        name: 'Maintenance Issues',
        description: 'Broken fixtures, leaking, electrical issues',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Broken Fixtures', 'Leaking', 'Electrical Issues', 'Doors/Locks Not Working', 'Other'], isRequired: true },
          { id: 'specificArea', label: 'Specific Area', fieldType: 'text', isRequired: true },
          { id: 'urgency', label: 'Urgency', fieldType: 'dropdown', options: ['Can Wait', 'Needs Attention Soon', 'Urgent/Safety Hazard'], isRequired: true },
        ]
      },
      {
        id: 'hygiene-supplies',
        name: 'Hygiene Supplies',
        description: 'Missing toiletries, hand wash, sanitizers',
        formFields: [
          { id: 'missingItems', label: 'Missing Items', fieldType: 'multi-select', options: ['Hand Wash', 'Sanitizer', 'Tissues', 'Towels', 'Toiletries', 'Other'], isRequired: true },
        ]
      },
      {
        id: 'storage-lockers',
        name: 'Storage & Lockers',
        description: 'Insufficient lockers, broken locks, no charging points',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Insufficient Lockers', 'Broken Locks', 'No Charging Points', 'Size Issues', 'Other'], isRequired: true },
          { id: 'lockerNumber', label: 'Locker Number', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'seating-waiting',
        name: 'Seating & Waiting Area',
        description: 'Uncomfortable, insufficient seating, cleanliness',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Uncomfortable', 'Insufficient Seating', 'Cleanliness', 'Lack of Privacy', 'Other'], isRequired: true },
        ]
      },
      {
        id: 'accessibility',
        name: 'Accessibility',
        description: 'No ramp/elevator, difficulty for differently-abled',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['No Ramp', 'No Elevator', 'Narrow Passages', 'Difficulty for Differently-abled', 'Other'], isRequired: true },
          { id: 'specificNeed', label: 'Specific Accessibility Need', fieldType: 'textarea', isRequired: false },
        ]
      },
    ]
  },
  {
    id: 'membership-billing',
    name: 'Membership & Billing',
    icon: 'CreditCard',
    color: '#F59E0B',
    defaultDepartment: 'finance',
    subcategories: [
      {
        id: 'billing-errors',
        name: 'Billing Errors',
        description: 'Incorrect charges, duplicate charges, wrong package applied',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Incorrect Charges', 'Duplicate Charges', 'Wrong Package Applied', 'GST Issues', 'Other'], isRequired: true },
          { id: 'amount', label: 'Amount in Question (INR)', fieldType: 'number', isRequired: true },
          { id: 'transactionDate', label: 'Transaction Date', fieldType: 'date', isRequired: true },
          { id: 'transactionId', label: 'Transaction ID', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'payment-issues',
        name: 'Payment Issues',
        description: 'Payment gateway failures, declined transactions, refund delays',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Payment Gateway Failure', 'Declined Transaction', 'Refund Delay', 'Other'], isRequired: true },
          { id: 'paymentMethod', label: 'Payment Method', fieldType: 'dropdown', options: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Other'], isRequired: true },
          { id: 'amount', label: 'Amount (INR)', fieldType: 'number', isRequired: true },
          { id: 'transactionId', label: 'Transaction ID', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'package-confusion',
        name: 'Package/Plan Confusion',
        description: 'Unclear terms, misleading information, hidden charges',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unclear Terms', 'Misleading Information', 'Hidden Charges', 'Validity Confusion', 'Other'], isRequired: true },
          { id: 'packageName', label: 'Package Name', fieldType: 'text', isRequired: true },
          { id: 'whatWasExpected', label: 'What Was Expected', fieldType: 'textarea', isRequired: true },
          { id: 'whatActuallyHappened', label: 'What Actually Happened', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'membership-cancellation',
        name: 'Membership Cancellation',
        description: 'Difficult process, refund disputes, early termination penalties',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Difficult Process', 'Refund Dispute', 'Early Termination Penalty', 'Other'], isRequired: true },
          { id: 'membershipType', label: 'Membership Type', fieldType: 'text', isRequired: true },
          { id: 'cancellationReason', label: 'Reason for Cancellation', fieldType: 'textarea', isRequired: false },
          { id: 'refundExpected', label: 'Expected Refund Amount (INR)', fieldType: 'number', isRequired: false },
        ]
      },
      {
        id: 'membership-freeze',
        name: 'Membership Freeze',
        description: 'Freeze request denial, complicated process',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Freeze Request Denied', 'Complicated Process', 'Charges During Freeze', 'Other'], isRequired: true },
          { id: 'freezeDuration', label: 'Requested Freeze Duration', fieldType: 'text', isRequired: false },
          { id: 'reason', label: 'Reason for Freeze', fieldType: 'textarea', isRequired: false },
        ]
      },
      {
        id: 'renewal-issues',
        name: 'Renewal Issues',
        description: 'Auto-renewal without notice, difficulty in renewal',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Auto-renewal Without Notice', 'Difficulty in Renewal', 'Price Discrepancy', 'Other'], isRequired: true },
          { id: 'membershipType', label: 'Membership Type', fieldType: 'text', isRequired: true },
          { id: 'renewalDate', label: 'Renewal Date', fieldType: 'date', isRequired: false },
        ]
      },
      {
        id: 'upgrade-downgrade',
        name: 'Upgrade/Downgrade',
        description: 'Process complexity, charge adjustments',
        formFields: [
          { id: 'changeType', label: 'Change Type', fieldType: 'dropdown', options: ['Upgrade', 'Downgrade'], isRequired: true },
          { id: 'currentPackage', label: 'Current Package', fieldType: 'text', isRequired: true },
          { id: 'desiredPackage', label: 'Desired Package', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Process Complexity', 'Charge Adjustments', 'Package Conversion Issues', 'Other'], isRequired: true },
        ]
      },
      {
        id: 'credits-class-pack',
        name: 'Credits/Class Pack',
        description: 'Credit expiry disputes, unused credits, transfer difficulties',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Credit Expiry Dispute', 'Unused Credits', 'Transfer Difficulties', 'Other'], isRequired: true },
          { id: 'creditsAffected', label: 'Number of Credits Affected', fieldType: 'number', isRequired: true },
          { id: 'expiryDate', label: 'Expiry Date', fieldType: 'date', isRequired: false },
        ]
      },
      {
        id: 'promotional-offers',
        name: 'Promotional Offers',
        description: 'Not honored, misleading offers, eligibility disputes',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Not Honored', 'Misleading Offer', 'Eligibility Dispute', 'Code Not Working', 'Other'], isRequired: true },
          { id: 'offerDetails', label: 'Offer/Promo Code Details', fieldType: 'text', isRequired: true },
          { id: 'whereSeenAdvertised', label: 'Where Was Offer Seen', fieldType: 'dropdown', options: ['Website', 'App', 'Email', 'Social Media', 'Staff', 'Other'], isRequired: false },
        ]
      },
      {
        id: 'invoice-receipt',
        name: 'Invoice/Receipt',
        description: 'Missing invoices, incorrect details, GST compliance',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Missing Invoice', 'Incorrect Details', 'GST Compliance', 'Delay in Generation', 'Other'], isRequired: true },
          { id: 'transactionDate', label: 'Transaction Date', fieldType: 'date', isRequired: true },
          { id: 'amount', label: 'Amount (INR)', fieldType: 'number', isRequired: false },
        ]
      },
      {
        id: 'contract-terms',
        name: 'Contract Terms',
        description: 'Unclear terms, disagreement on clauses',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unclear Terms', 'Disagreement on Clauses', 'Lock-in Period Dispute', 'Other'], isRequired: true },
          { id: 'specificClause', label: 'Specific Clause/Term in Question', fieldType: 'textarea', isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'booking-technology',
    name: 'Booking & Technology',
    icon: 'Smartphone',
    color: '#6366F1',
    defaultDepartment: 'operations',
    subcategories: [
      {
        id: 'app-website-issues',
        name: 'App/Website Issues',
        description: 'Crash, slow loading, login problems, glitches',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['App Crash', 'Slow Loading', 'Login Problems', 'Feature Not Working', 'UI/UX Confusion', 'Other'], isRequired: true },
          { id: 'platform', label: 'Platform', fieldType: 'dropdown', options: ['iOS App', 'Android App', 'Website (Desktop)', 'Website (Mobile)'], isRequired: true },
          { id: 'deviceBrowser', label: 'Device/Browser', fieldType: 'text', isRequired: false },
          { id: 'errorMessage', label: 'Error Message', fieldType: 'text', isRequired: false },
          { id: 'stepsToReproduce', label: 'Steps to Reproduce', fieldType: 'textarea', isRequired: true },
          { id: 'screenshotAvailable', label: 'Screenshot Available', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'booking-failures',
        name: 'Booking Failures',
        description: 'Unable to book, booking not confirmed, double bookings',
        formFields: [
          { id: 'className', label: 'Class Attempted', fieldType: 'text', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'failureType', label: 'Failure Type', fieldType: 'dropdown', options: ['Unable to Book', 'Booking Not Confirmed', 'Double Booking', 'Booking Disappeared', 'Other'], isRequired: true },
          { id: 'creditsDeducted', label: 'Credits Deducted', fieldType: 'dropdown', options: ['Yes', 'No', 'Unknown'], isRequired: true },
          { id: 'confirmationReceived', label: 'Booking Confirmation Received', fieldType: 'dropdown', options: ['Yes', 'No', 'Partial'], isRequired: true },
          { id: 'manuallyResolved', label: 'Manually Resolved', fieldType: 'dropdown', options: ['Yes - Added to Class', 'Yes - Credits Refunded', 'No - Still Pending'], isRequired: true },
        ]
      },
      {
        id: 'waitlist-issues',
        name: 'Waitlist Issues',
        description: 'Not moving from waitlist, waitlist not functioning',
        formFields: [
          { id: 'className', label: 'Class', fieldType: 'text', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Not Moving from Waitlist', 'Waitlist Not Showing', 'Priority Confusion', 'Spot Available But Not Notified', 'Other'], isRequired: true },
          { id: 'waitlistPosition', label: 'Waitlist Position', fieldType: 'number', isRequired: false },
          { id: 'timeOnWaitlist', label: 'Time on Waitlist', fieldType: 'text', isRequired: false },
          { id: 'resolution', label: 'Resolution', fieldType: 'dropdown', options: ['Added to Class', 'Moved to Different Class', 'Credits Preserved', 'Still on Waitlist'], isRequired: true },
        ]
      },
      {
        id: 'cancellation-problems',
        name: 'Cancellation Problems',
        description: 'Unable to cancel, late cancellation charges',
        formFields: [
          { id: 'className', label: 'Class to Cancel', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'cancellationAttemptTime', label: 'Cancellation Attempt Time', fieldType: 'datetime', isRequired: true },
          { id: 'hoursBeforeClass', label: 'Hours Before Class', fieldType: 'number', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unable to Cancel via App', 'Late Cancellation Fee Charged', 'Cancellation Window Unclear', 'Credits Not Returned', 'Other'], isRequired: true },
          { id: 'feeCharged', label: 'Fee Charged (INR)', fieldType: 'number', isRequired: false },
          { id: 'creditsReturned', label: 'Credits Returned', fieldType: 'dropdown', options: ['Yes', 'No', 'Partial', 'Unknown'], isRequired: true },
          { id: 'manualCancellationDone', label: 'Manual Cancellation Done', fieldType: 'checkbox', isRequired: true },
        ]
      },
      {
        id: 'class-checkin',
        name: 'Class Check-in',
        description: 'QR code issues, manual check-in delays',
        formFields: [
          { id: 'className', label: 'Class', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['QR Code Not Working', 'QR Code Not Scanning', 'Manual Check-in Delayed', 'Attendance Not Recorded', 'Check-in System Down', 'Other'], isRequired: true },
          { id: 'checkinMethod', label: 'Check-in Method Attempted', fieldType: 'dropdown', options: ['QR Code Scan', 'Manual by Staff', 'Self Check-in Kiosk', 'Other'], isRequired: true },
          { id: 'successfullyCheckedIn', label: 'Successfully Checked In', fieldType: 'dropdown', options: ['Yes - Eventually', 'No - Attended Without Check-in', 'No - Did Not Attend'], isRequired: true },
          { id: 'creditsDeductedCorrectly', label: 'Credits Deducted Correctly', fieldType: 'dropdown', options: ['Yes', 'No', 'Unknown'], isRequired: true },
          { id: 'manualOverrideRequired', label: 'Manual Override Required', fieldType: 'checkbox', isRequired: true },
        ]
      },
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'Missing reminders, spam notifications',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Missing Class Reminder', 'Missing Cancellation Confirmation', 'Too Many Notifications', 'Wrong Information in Notification', 'Notification Delay', 'Other'], isRequired: true },
          { id: 'notificationType', label: 'Notification Type', fieldType: 'dropdown', options: ['Email', 'SMS', 'Push Notification', 'In-App', 'All Channels'], isRequired: true },
          { id: 'relatedClass', label: 'Related Class', fieldType: 'text', isRequired: false },
          { id: 'preferencesUpdated', label: 'Preferences Updated', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'profile-management',
        name: 'Profile Management',
        description: 'Unable to update details, incorrect information',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Cannot Update Profile', 'Incorrect Information Displayed', 'Cannot Upload Photo', 'Cannot Change Password', 'Cannot Update Preferences', 'Other'], isRequired: true },
          { id: 'fieldAffected', label: 'Field Affected', fieldType: 'dropdown', options: ['Name', 'Email', 'Phone', 'Address', 'Emergency Contact', 'Photo', 'Payment Method', 'Preferences', 'Other'], isRequired: true },
          { id: 'platform', label: 'Platform', fieldType: 'dropdown', options: ['iOS App', 'Android App', 'Website (Desktop)', 'Website (Mobile)'], isRequired: true },
          { id: 'informationCorrected', label: 'Information Corrected by Staff', fieldType: 'checkbox', isRequired: true },
        ]
      },
      {
        id: 'class-visibility',
        name: 'Class Visibility',
        description: 'Favorite instructors not showing, schedule not updating',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Favorite Instructor Not Showing', 'Schedule Not Updating', 'Wrong Studio Display', 'Missing Classes', 'Incorrect Times Displayed', 'Other'], isRequired: true },
          { id: 'affectedInstructor', label: 'Affected Instructor', fieldType: 'text', isRequired: false },
          { id: 'platform', label: 'Platform', fieldType: 'dropdown', options: ['iOS App', 'Android App', 'Website (Desktop)', 'Website (Mobile)'], isRequired: true },
          { id: 'cacheCleared', label: 'Cache Cleared', fieldType: 'checkbox', isRequired: false },
          { id: 'issueReplicatedByStaff', label: 'Issue Replicated by Staff', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'payment-gateway',
        name: 'Payment Gateway',
        description: 'Transaction failures, amount deducted but booking failed',
        formFields: [
          { id: 'transactionType', label: 'Transaction Type', fieldType: 'dropdown', options: ['New Purchase', 'Renewal', 'Upgrade', 'Additional Credits', 'Retail Purchase', 'Other'], isRequired: true },
          { id: 'amount', label: 'Amount (INR)', fieldType: 'number', isRequired: true },
          { id: 'paymentMethod', label: 'Payment Method', fieldType: 'dropdown', options: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Transaction Failed', 'Amount Deducted But Booking Failed', 'Payment Gateway Timeout', 'Card Declined', 'Multiple Charges', 'Other'], isRequired: true },
          { id: 'transactionId', label: 'Transaction ID', fieldType: 'text', isRequired: false },
          { id: 'moneyDeducted', label: 'Money Deducted', fieldType: 'dropdown', options: ['Yes', 'No', 'Unknown'], isRequired: true },
          { id: 'bookingSuccessful', label: 'Booking Successful', fieldType: 'dropdown', options: ['Yes', 'No', 'Partial'], isRequired: true },
          { id: 'refundInitiated', label: 'Refund Initiated', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'technical-support',
        name: 'Technical Support',
        description: 'Unresponsive helpdesk, long resolution time',
        formFields: [
          { id: 'supportChannel', label: 'Support Channel Used', fieldType: 'dropdown', options: ['Email', 'Phone', 'In-App Chat', 'Social Media DM', 'Walk-in'], isRequired: true },
          { id: 'issueReported', label: 'Issue Reported to Support', fieldType: 'textarea', isRequired: true },
          { id: 'responseTime', label: 'Response Time', fieldType: 'dropdown', options: ['Immediate', 'Within 1 Hour', 'Within 24 Hours', '24-48 Hours', 'No Response Yet', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['No Response', 'Slow Response', 'Unresolved', 'Generic Response', 'Poor Solution Quality', 'Other'], isRequired: true },
          { id: 'previousTicketNumber', label: 'Previous Ticket Number', fieldType: 'text', isRequired: false },
          { id: 'escalationRequired', label: 'Escalation Required', fieldType: 'checkbox', isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    icon: 'Headphones',
    color: '#EC4899',
    defaultDepartment: 'client_success',
    subcategories: [
      {
        id: 'front-desk-service',
        name: 'Front Desk Service',
        description: 'Rude staff, unhelpful attitude, lack of product knowledge',
        formFields: [
          { id: 'staffMember', label: 'Staff Member Involved', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Rude Behavior', 'Unhelpful Attitude', 'Lack of Knowledge', 'Inattentive', 'Unprofessional Conduct', 'Other'], isRequired: true },
          { id: 'specificIncident', label: 'Specific Incident', fieldType: 'textarea', isRequired: true },
          { id: 'clientRequest', label: 'Client Request/Query', fieldType: 'text', isRequired: true },
          { id: 'requestFulfilled', label: 'Request Fulfilled', fieldType: 'dropdown', options: ['Yes - Immediately', 'Yes - After Delay', 'No - Unable to Fulfill', 'No - Refused'], isRequired: true },
          { id: 'apologyGiven', label: 'Apology Given', fieldType: 'checkbox', isRequired: false },
          { id: 'escalatedToManager', label: 'Escalated to Manager', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'response-time',
        name: 'Response Time',
        description: 'Delayed responses, unacknowledged complaints',
        formFields: [
          { id: 'communicationChannel', label: 'Communication Channel', fieldType: 'dropdown', options: ['Email', 'Phone Call', 'WhatsApp', 'Social Media DM', 'In-Person Follow-up'], isRequired: true },
          { id: 'initialContactDate', label: 'Initial Contact Date', fieldType: 'datetime', isRequired: true },
          { id: 'issueReported', label: 'Issue Reported', fieldType: 'textarea', isRequired: true },
          { id: 'responseReceived', label: 'Response Received', fieldType: 'dropdown', options: ['Yes - Late', 'No Response Yet', 'Partial Response'], isRequired: true },
          { id: 'actualResponseDate', label: 'Actual Response Date', fieldType: 'datetime', isRequired: false },
          { id: 'staffResponsible', label: 'Staff Responsible', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'issue-resolution',
        name: 'Issue Resolution',
        description: 'Unresolved complaints, passed around departments',
        formFields: [
          { id: 'originalIssue', label: 'Original Issue', fieldType: 'textarea', isRequired: true },
          { id: 'dateFirstReported', label: 'Date First Reported', fieldType: 'date', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Still Unresolved', 'Passed Between Departments', 'No Clear Owner', 'Resolution Inadequate', 'Other'], isRequired: true },
          { id: 'numberOfContacts', label: 'Number of Follow-up Contacts', fieldType: 'number', isRequired: false },
          { id: 'currentStatus', label: 'Current Status', fieldType: 'dropdown', options: ['Open', 'In Progress', 'Waiting on Client', 'Waiting on Internal Team', 'Escalated'], isRequired: true },
          { id: 'resolutionOffered', label: 'Resolution Offered', fieldType: 'textarea', isRequired: false },
          { id: 'clientSatisfied', label: 'Client Satisfied with Resolution', fieldType: 'dropdown', options: ['Yes', 'No', 'Partially', 'Too Early to Tell'], isRequired: false },
        ]
      },
      {
        id: 'communication-quality',
        name: 'Communication Quality',
        description: 'Poor communication, language barriers, unclear information',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Communication', 'Language Barrier', 'Unclear Information', 'Conflicting Information', 'Tone Issues', 'Other'], isRequired: true },
          { id: 'communicationChannel', label: 'Communication Channel', fieldType: 'dropdown', options: ['In-Person', 'Phone', 'Email', 'WhatsApp', 'Social Media'], isRequired: true },
          { id: 'staffMember', label: 'Staff Member Involved', fieldType: 'text', isRequired: false },
          { id: 'topicDiscussed', label: 'Topic Discussed', fieldType: 'text', isRequired: true },
          { id: 'clarificationProvided', label: 'Clarification Provided', fieldType: 'checkbox', isRequired: true },
        ]
      },
      {
        id: 'staff-knowledge',
        name: 'Staff Knowledge',
        description: 'Lack of class/membership knowledge, unable to guide',
        formFields: [
          { id: 'staffMember', label: 'Staff Member', fieldType: 'text', isRequired: false },
          { id: 'knowledgeGapArea', label: 'Knowledge Gap Area', fieldType: 'dropdown', options: ['Class Details', 'Membership Packages', 'Billing/Credits', 'Studio Policies', 'Instructor Schedules', 'Special Programs', 'Other'], isRequired: true },
          { id: 'clientQuery', label: 'Client Query', fieldType: 'text', isRequired: true },
          { id: 'incorrectInfoGiven', label: 'Incorrect Information Given', fieldType: 'checkbox', isRequired: true },
          { id: 'incorrectInfoDetails', label: 'Incorrect Info Details', fieldType: 'text', isRequired: false },
          { id: 'correctInfoProvidedLater', label: 'Correct Info Provided Later', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'staff-availability',
        name: 'Staff Availability',
        description: 'No one at desk, long wait times, understaffed',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['No One at Desk', 'Long Wait Time', 'Understaffed', 'Staff Busy with Other Tasks', 'Other'], isRequired: true },
          { id: 'timeOfDay', label: 'Time of Day', fieldType: 'dropdown', options: ['Morning (6-10am)', 'Midday (10am-2pm)', 'Afternoon (2-6pm)', 'Evening (6-10pm)'], isRequired: true },
          { id: 'waitTime', label: 'Wait Time', fieldType: 'dropdown', options: ['Under 5 min', '5-10 min', '10-15 min', '15+ min'], isRequired: false },
          { id: 'clientNeed', label: 'Client Need', fieldType: 'dropdown', options: ['Check-in Help', 'Booking Issue', 'Question', 'Purchase', 'Complaint', 'Other'], isRequired: true },
          { id: 'eventuallyServed', label: 'Eventually Served', fieldType: 'checkbox', isRequired: true },
        ]
      },
      {
        id: 'complaint-handling',
        name: 'Complaint Handling',
        description: 'Dismissive attitude toward complaints, defensive responses',
        formFields: [
          { id: 'originalComplaintCategory', label: 'Original Complaint Category', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Dismissive Attitude', 'Defensive Response', 'No Escalation Option', 'Not Taken Seriously', 'Other'], isRequired: true },
          { id: 'staffMember', label: 'Staff Member Who Received Complaint', fieldType: 'text', isRequired: false },
          { id: 'clientExpectation', label: "Client's Expectation", fieldType: 'text', isRequired: false },
          { id: 'responseGiven', label: 'Response Given', fieldType: 'textarea', isRequired: true },
          { id: 'escalationRequested', label: 'Escalation Requested', fieldType: 'checkbox', isRequired: false },
          { id: 'escalationAllowed', label: 'Escalation Allowed', fieldType: 'checkbox', isRequired: false },
          { id: 'managerInvolvement', label: 'Manager Involvement', fieldType: 'dropdown', options: ['Yes - Immediately', 'Yes - After Delay', 'No'], isRequired: false },
        ]
      },
      {
        id: 'phone-support',
        name: 'Phone Support',
        description: 'Unreachable, long hold times, disconnected calls',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['No Answer', 'Long Hold Time', 'Call Disconnected', 'No Callback', 'Wrong Extension', 'Other'], isRequired: true },
          { id: 'timeOfCall', label: 'Time of Call', fieldType: 'datetime', isRequired: true },
          { id: 'holdDuration', label: 'Hold Duration', fieldType: 'dropdown', options: ['Under 2 min', '2-5 min', '5-10 min', '10+ min', 'No Answer'], isRequired: false },
          { id: 'reasonForCall', label: 'Reason for Call', fieldType: 'text', isRequired: true },
          { id: 'callAttempts', label: 'Number of Call Attempts', fieldType: 'number', isRequired: false },
        ]
      },
      {
        id: 'email-chat-support',
        name: 'Email/Chat Support',
        description: 'Slow responses, generic replies',
        formFields: [
          { id: 'channel', label: 'Channel', fieldType: 'dropdown', options: ['Email', 'In-App Chat', 'WhatsApp', 'Website Chat'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Slow Response', 'Generic Reply', 'Issue Not Resolved', 'Auto-Reply Only', 'Other'], isRequired: true },
          { id: 'dateSent', label: 'Date Sent', fieldType: 'datetime', isRequired: true },
          { id: 'subjectTopic', label: 'Subject/Topic', fieldType: 'text', isRequired: true },
          { id: 'responseTime', label: 'Response Time', fieldType: 'dropdown', options: ['Under 1 Hour', '1-4 Hours', '4-24 Hours', '24-48 Hours', '48+ Hours', 'No Response'], isRequired: false },
          { id: 'issueResolvedViaChannel', label: 'Issue Resolved via Channel', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'staff-professionalism',
        name: 'Staff Professionalism',
        description: 'Gossiping, using phones, eating at desk',
        formFields: [
          { id: 'staffMember', label: 'Staff Member', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Gossiping', 'Using Personal Phone', 'Eating at Desk', 'Inappropriate Conversation', 'Unprofessional Attire', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
          { id: 'clientImpact', label: 'Client Impact', fieldType: 'dropdown', options: ['Overheard by Client', 'Client Had to Wait', 'Client Felt Uncomfortable', 'No Direct Impact'], isRequired: true },
          { id: 'addressedImmediately', label: 'Addressed Immediately', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'newcomer-experience',
        name: 'Newcomer Experience',
        description: 'Poor onboarding, no orientation, lack of guidance',
        formFields: [
          { id: 'firstVisitDate', label: "Client's First Visit Date", fieldType: 'date', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['No Orientation', 'Poor Onboarding', 'Lack of Guidance', 'Not Welcomed', 'Studio Tour Missing', 'Other'], isRequired: true },
          { id: 'staffWhoGreeted', label: 'Staff Who Greeted', fieldType: 'text', isRequired: false },
          { id: 'orientationProvided', label: 'Orientation Provided', fieldType: 'checkbox', isRequired: false },
          { id: 'classExplanationGiven', label: 'Class Explanation Given', fieldType: 'checkbox', isRequired: false },
          { id: 'equipmentDemoProvided', label: 'Equipment Demo Provided', fieldType: 'checkbox', isRequired: false },
          { id: 'feltWelcomed', label: 'Felt Welcomed', fieldType: 'dropdown', options: ['Yes', 'Somewhat', 'No'], isRequired: false },
        ]
      },
    ]
  },
  {
    id: 'sales-marketing',
    name: 'Sales & Marketing',
    icon: 'Megaphone',
    color: '#F97316',
    defaultDepartment: 'sales',
    subcategories: [
      {
        id: 'misleading-information',
        name: 'Misleading Information',
        description: 'False promises during sales pitch, exaggerated benefits',
        formFields: [
          { id: 'salesStaff', label: 'Sales Staff Member', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['False Promise', 'Exaggerated Benefits', 'Hidden Terms', 'Pressure Tactics', 'Incorrect Package Info', 'Other'], isRequired: true },
          { id: 'whatWasPromised', label: 'What Was Promised', fieldType: 'textarea', isRequired: true },
          { id: 'whatWasActuallyTrue', label: 'What Was Actually True', fieldType: 'textarea', isRequired: true },
          { id: 'packageSold', label: 'Package/Product Sold', fieldType: 'text', isRequired: true },
          { id: 'saleDate', label: 'Sale Date', fieldType: 'date', isRequired: true },
          { id: 'clientSeeking', label: 'Client Seeking', fieldType: 'dropdown', options: ['Refund', 'Package Change', 'Clarification', 'Complaint Only'], isRequired: true },
        ]
      },
      {
        id: 'aggressive-selling',
        name: 'Aggressive Selling',
        description: 'Excessive follow-ups, pressure to upgrade',
        formFields: [
          { id: 'salesStaff', label: 'Sales Staff Member', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Excessive Follow-ups', 'Pressure to Upgrade', 'Unwanted Sales Calls', 'Pushy Behavior', 'Other'], isRequired: true },
          { id: 'frequencyOfContact', label: 'Frequency of Contact', fieldType: 'dropdown', options: ['Daily', 'Multiple times a week', 'Weekly', 'Occasionally'], isRequired: false },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'trial-class-experience',
        name: 'Trial Class Experience',
        description: 'Poor trial experience, no proper introduction',
        formFields: [
          { id: 'trialClassDate', label: 'Trial Class Date', fieldType: 'date', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Trial Experience', 'No Proper Introduction', 'Rushed Enrollment', 'Unwelcoming Environment', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: false },
          { id: 'willConsiderMembership', label: 'Will Consider Membership', fieldType: 'dropdown', options: ['Yes', 'No', 'Undecided'], isRequired: false },
        ]
      },
      {
        id: 'communication-overload',
        name: 'Communication Overload',
        description: 'Too many promotional emails/SMS, spam',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Too Many Emails', 'Too Many SMS', 'Spam', 'Irrelevant Offers', 'Other'], isRequired: true },
          { id: 'frequencyOfMessages', label: 'Frequency of Messages', fieldType: 'dropdown', options: ['Multiple times daily', 'Daily', 'Multiple times weekly', 'Weekly'], isRequired: false },
          { id: 'unsubscribeAttempted', label: 'Unsubscribe Attempted', fieldType: 'checkbox', isRequired: false },
          { id: 'preferredContactMethod', label: 'Preferred Contact Method', fieldType: 'dropdown', options: ['Email Only', 'SMS Only', 'No Marketing Contact', 'WhatsApp Only'], isRequired: false },
        ]
      },
      {
        id: 'social-media',
        name: 'Social Media',
        description: 'Inaccurate information, unresponsive to DMs',
        formFields: [
          { id: 'platform', label: 'Platform', fieldType: 'dropdown', options: ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Inaccurate Information', 'Unresponsive to DMs', 'Poor Engagement', 'Misleading Content', 'Other'], isRequired: true },
          { id: 'postLink', label: 'Post/Link (if applicable)', fieldType: 'text', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'guest-passes-referrals',
        name: 'Guest Passes/Referrals',
        description: 'Issues with guest passes, referral benefits not credited',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Guest Pass Issues', 'Referral Benefits Not Credited', 'Restrictions Not Mentioned', 'Other'], isRequired: true },
          { id: 'referredPersonName', label: 'Referred Person Name (if applicable)', fieldType: 'text', isRequired: false },
          { id: 'expectedBenefit', label: 'Expected Benefit', fieldType: 'text', isRequired: false },
          { id: 'referralDate', label: 'Referral/Guest Pass Date', fieldType: 'date', isRequired: false },
        ]
      },
      {
        id: 'events-workshops',
        name: 'Events & Workshops',
        description: 'Poor organization, cancellations, misleading event details',
        formFields: [
          { id: 'eventName', label: 'Event/Workshop Name', fieldType: 'text', isRequired: true },
          { id: 'eventDate', label: 'Event Date', fieldType: 'date', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Organization', 'Event Cancelled', 'Misleading Event Details', 'Registration Issues', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'brand-communication',
        name: 'Brand Communication',
        description: 'Inconsistent messaging, tone mismatch',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Inconsistent Messaging', 'Tone Mismatch', 'Cultural Insensitivity', 'Other'], isRequired: true },
          { id: 'whereObserved', label: 'Where Observed', fieldType: 'dropdown', options: ['Website', 'App', 'Email', 'Social Media', 'In-Studio', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'health-safety',
    name: 'Health & Safety',
    icon: 'ShieldCheck',
    color: '#EF4444',
    defaultDepartment: 'operations',
    subcategories: [
      {
        id: 'hygiene-protocols',
        name: 'Hygiene Protocols',
        description: 'Inadequate sanitization, surface cleaning',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Inadequate Sanitization', 'No Mask Enforcement', 'Surface Cleaning Issues', 'Equipment Not Sanitized', 'Other'], isRequired: true },
          { id: 'specificArea', label: 'Specific Area', fieldType: 'text', isRequired: true },
          { id: 'severity', label: 'Severity', fieldType: 'dropdown', options: ['Minor', 'Moderate', 'Severe'], isRequired: true },
        ]
      },
      {
        id: 'injury-during-class',
        name: 'Injury During Class',
        description: 'Lack of first aid, no incident report',
        formFields: [
          { id: 'injuryType', label: 'Type of Injury', fieldType: 'text', isRequired: true },
          { id: 'className', label: 'Class Name', fieldType: 'text', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: true },
          { id: 'classDateTime', label: 'Class Date & Time', fieldType: 'datetime', isRequired: true },
          { id: 'firstAidProvided', label: 'First Aid Provided', fieldType: 'checkbox', isRequired: true },
          { id: 'incidentReportFiled', label: 'Incident Report Filed', fieldType: 'checkbox', isRequired: true },
          { id: 'medicalAttentionNeeded', label: 'Medical Attention Needed', fieldType: 'checkbox', isRequired: true },
          { id: 'injuryDetails', label: 'Injury Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'emergency-preparedness',
        name: 'Emergency Preparedness',
        description: 'No fire exits marked, missing first aid kit',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Fire Exits Not Marked', 'Missing First Aid Kit', 'No Emergency Protocols', 'Blocked Emergency Exit', 'Other'], isRequired: true },
          { id: 'specificArea', label: 'Specific Area', fieldType: 'text', isRequired: true },
          { id: 'severity', label: 'Severity', fieldType: 'dropdown', options: ['Minor', 'Moderate', 'Critical'], isRequired: true },
        ]
      },
      {
        id: 'covid-health-protocols',
        name: 'COVID/Health Protocols',
        description: 'Not following guidelines, no temperature checks',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Not Following Guidelines', 'No Temperature Checks', 'Crowding', 'No Hand Sanitizer', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'medical-disclosure',
        name: 'Medical Disclosure',
        description: 'Not collecting health information, ignoring disclosed conditions',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Not Collecting Health Info', 'Ignoring Disclosed Conditions', 'No Medical Form', 'Other'], isRequired: true },
          { id: 'conditionDisclosed', label: 'Condition Disclosed (if applicable)', fieldType: 'text', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'equipment-safety',
        name: 'Equipment Safety',
        description: 'Unsafe equipment, no safety checks',
        formFields: [
          { id: 'equipmentType', label: 'Equipment Type', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unsafe Equipment', 'No Safety Checks', 'Sharp Edges', 'Unstable Props', 'Other'], isRequired: true },
          { id: 'injuryOccurred', label: 'Injury Occurred', fieldType: 'checkbox', isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'air-quality',
        name: 'Air Quality',
        description: 'Poor ventilation, strong odors, chemical smells',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Ventilation', 'Strong Odors', 'Chemical Smells', 'Stuffy Environment', 'Other'], isRequired: true },
          { id: 'roomArea', label: 'Room/Area', fieldType: 'text', isRequired: true },
          { id: 'healthSymptoms', label: 'Any Health Symptoms Experienced', fieldType: 'text', isRequired: false },
        ]
      },
    ]
  },
  {
    id: 'community-culture',
    name: 'Community & Culture',
    icon: 'Users',
    color: '#14B8A6',
    defaultDepartment: 'client_success',
    subcategories: [
      {
        id: 'clique-behavior',
        name: 'Clique Behavior',
        description: 'Exclusivity among members, unwelcoming environment',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Exclusivity Among Members', 'Unwelcoming Environment', 'Favoritism', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
          { id: 'impactOnClient', label: 'Impact on Client', fieldType: 'textarea', isRequired: false },
        ]
      },
      {
        id: 'discrimination',
        name: 'Discrimination',
        description: 'Based on body type, fitness level, age, gender',
        formFields: [
          { id: 'discriminationType', label: 'Discrimination Type', fieldType: 'dropdown', options: ['Body Type', 'Fitness Level', 'Age', 'Gender', 'Appearance', 'Other'], isRequired: true },
          { id: 'perpetrator', label: 'Who Made Client Feel Discriminated', fieldType: 'dropdown', options: ['Staff', 'Instructor', 'Other Members', 'Multiple'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'member-behavior',
        name: 'Member Behavior',
        description: 'Disruptive members, loud conversations',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Disruptive Behavior', 'Loud Conversations', 'Phone Usage During Class', 'Space Invasion', 'Other'], isRequired: true },
          { id: 'className', label: 'Class Name (if applicable)', fieldType: 'text', isRequired: false },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
          { id: 'staffNotified', label: 'Staff Notified', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'inclusivity-issues',
        name: 'Inclusivity Issues',
        description: 'Not welcoming to beginners, lack of body positivity',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Not Welcoming to Beginners', 'Lack of Body Positivity', 'Judgmental Atmosphere', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
          { id: 'suggestions', label: 'Suggestions for Improvement', fieldType: 'textarea', isRequired: false },
        ]
      },
      {
        id: 'community-events',
        name: 'Community Events',
        description: 'Lack of community building, poor event execution',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Lack of Community Building', 'Poor Event Execution', 'Limited Engagement Opportunities', 'Other'], isRequired: true },
          { id: 'eventName', label: 'Event Name (if applicable)', fieldType: 'text', isRequired: false },
          { id: 'suggestions', label: 'Suggestions', fieldType: 'textarea', isRequired: false },
        ]
      },
      {
        id: 'studio-culture',
        name: 'Studio Culture',
        description: 'Toxic environment, comparison culture',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Toxic Environment', 'Comparison Culture', 'Lack of Support', 'Competitive Atmosphere', 'Other'], isRequired: true },
          { id: 'incidentDetails', label: 'Incident Details', fieldType: 'textarea', isRequired: true },
          { id: 'impactOnWellbeing', label: 'Impact on Wellbeing', fieldType: 'textarea', isRequired: false },
        ]
      },
    ]
  },
  {
    id: 'retail-merchandise',
    name: 'Retail & Merchandise',
    icon: 'ShoppingBag',
    color: '#A855F7',
    defaultDepartment: 'sales',
    subcategories: [
      {
        id: 'product-quality',
        name: 'Product Quality',
        description: 'Poor quality merchandise, sizing issues, defective products',
        formFields: [
          { id: 'productName', label: 'Product Name', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Quality', 'Sizing Issues', 'Defective Product', 'Other'], isRequired: true },
          { id: 'purchaseDate', label: 'Purchase Date', fieldType: 'date', isRequired: true },
          { id: 'amount', label: 'Amount Paid (INR)', fieldType: 'number', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'product-availability',
        name: 'Product Availability',
        description: 'Out of stock, limited options, size unavailability',
        formFields: [
          { id: 'productName', label: 'Product Name', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Out of Stock', 'Limited Options', 'Size Unavailable', 'Color Unavailable', 'Other'], isRequired: true },
          { id: 'sizeNeeded', label: 'Size/Variant Needed', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'pricing',
        name: 'Pricing',
        description: 'Overpriced, no value for money, hidden charges',
        formFields: [
          { id: 'productName', label: 'Product Name', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Overpriced', 'No Value for Money', 'Hidden Charges', 'Price Discrepancy', 'Other'], isRequired: true },
          { id: 'priceQuoted', label: 'Price Quoted (INR)', fieldType: 'number', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'return-exchange',
        name: 'Return/Exchange',
        description: 'Difficult policy, no refunds, exchange restrictions',
        formFields: [
          { id: 'productName', label: 'Product Name', fieldType: 'text', isRequired: true },
          { id: 'purchaseDate', label: 'Purchase Date', fieldType: 'date', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Difficult Return Policy', 'No Refunds', 'Exchange Restrictions', 'Other'], isRequired: true },
          { id: 'reasonForReturn', label: 'Reason for Return/Exchange', fieldType: 'textarea', isRequired: true },
          { id: 'resolution', label: 'Resolution Offered', fieldType: 'text', isRequired: false },
        ]
      },
      {
        id: 'retail-staff-knowledge',
        name: 'Staff Knowledge',
        description: 'Uninformed about products, wrong recommendations',
        formFields: [
          { id: 'staffMember', label: 'Staff Member', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Uninformed About Products', 'Wrong Recommendations', 'Could Not Answer Questions', 'Other'], isRequired: true },
          { id: 'productCategory', label: 'Product Category', fieldType: 'dropdown', options: ['Apparel', 'Equipment', 'Accessories', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'special-programs',
    name: 'Special Programs',
    icon: 'Award',
    color: '#0EA5E9',
    defaultDepartment: 'training',
    subcategories: [
      {
        id: 'workshop-quality',
        name: 'Workshop Quality',
        description: 'Poor instructor, not worth the fee, disorganized',
        formFields: [
          { id: 'workshopName', label: 'Workshop Name', fieldType: 'text', isRequired: true },
          { id: 'workshopDate', label: 'Workshop Date', fieldType: 'date', isRequired: true },
          { id: 'instructor', label: 'Instructor', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Instructor', 'Not Worth the Fee', 'Disorganized', 'Overcrowded', 'Other'], isRequired: true },
          { id: 'fee', label: 'Fee Paid (INR)', fieldType: 'number', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'private-sessions',
        name: 'Private Sessions',
        description: 'Instructor unavailability, scheduling conflicts',
        formFields: [
          { id: 'instructor', label: 'Preferred/Booked Instructor', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Instructor Unavailable', 'Scheduling Conflicts', 'Pricing Disputes', 'Quality Issues', 'Other'], isRequired: true },
          { id: 'sessionDate', label: 'Session Date', fieldType: 'date', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'corporate-programs',
        name: 'Corporate Programs',
        description: 'Poor coordination, unsuitable timing',
        formFields: [
          { id: 'companyName', label: 'Company Name', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Coordination', 'Unsuitable Timing', 'Lack of Customization', 'Communication Issues', 'Other'], isRequired: true },
          { id: 'programType', label: 'Program Type', fieldType: 'text', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'special-needs-programs',
        name: 'Special Needs Programs',
        description: 'Lack of options for seniors/prenatal/postnatal',
        formFields: [
          { id: 'programType', label: 'Program Type Needed', fieldType: 'dropdown', options: ['Senior', 'Prenatal', 'Postnatal', 'Rehabilitation', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Lack of Options', 'Modifications Inadequate', 'Instructor Not Trained', 'Scheduling Issues', 'Other'], isRequired: true },
          { id: 'specificNeeds', label: 'Specific Needs', fieldType: 'textarea', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'challenges-competitions',
        name: 'Challenges & Competitions',
        description: 'Poor organization, unfair rules',
        formFields: [
          { id: 'eventName', label: 'Challenge/Competition Name', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Organization', 'Unfair Rules', 'Unclear Guidelines', 'Prizes Not Delivered', 'Other'], isRequired: true },
          { id: 'eventDate', label: 'Event Date', fieldType: 'date', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
    ]
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: 'MoreHorizontal',
    color: '#64748B',
    defaultDepartment: 'operations',
    subcategories: [
      {
        id: 'noise-disturbance',
        name: 'Noise Disturbance',
        description: 'From other studios, external noise, loud construction',
        formFields: [
          { id: 'noiseSource', label: 'Noise Source', fieldType: 'dropdown', options: ['Other Studios', 'External Traffic', 'Construction', 'Other Members', 'Equipment', 'Other'], isRequired: true },
          { id: 'roomArea', label: 'Room/Area Affected', fieldType: 'text', isRequired: true },
          { id: 'timeOfOccurrence', label: 'Time of Occurrence', fieldType: 'dropdown', options: ['Morning', 'Midday', 'Afternoon', 'Evening', 'All Day'], isRequired: false },
          { id: 'impactOnExperience', label: 'Impact on Experience', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'policy-changes',
        name: 'Policy Changes',
        description: 'Not communicated properly, sudden changes',
        formFields: [
          { id: 'policyArea', label: 'Policy Area', fieldType: 'dropdown', options: ['Membership', 'Booking', 'Cancellation', 'Dress Code', 'Studio Rules', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Not Communicated', 'Sudden Change', 'Unfair Policy', 'Inconsistent Application', 'Other'], isRequired: true },
          { id: 'policyDetails', label: 'Policy Details', fieldType: 'textarea', isRequired: true },
          { id: 'howClientWasAffected', label: 'How Client Was Affected', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'guest-experience',
        name: 'Guest Experience',
        description: 'Poor treatment of non-members, complicated guest policies',
        formFields: [
          { id: 'guestName', label: 'Guest Name', fieldType: 'text', isRequired: true },
          { id: 'hostMemberName', label: 'Host Member Name', fieldType: 'text', isRequired: false },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Poor Treatment', 'Complicated Policies', 'Pricing Issues', 'Access Denied', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'lost-found',
        name: 'Lost & Found',
        description: 'Lost items not found, no system in place',
        formFields: [
          { id: 'itemDescription', label: 'Item Description', fieldType: 'text', isRequired: true },
          { id: 'dateOfLoss', label: 'Date of Loss', fieldType: 'date', isRequired: true },
          { id: 'lastSeenLocation', label: 'Last Seen Location', fieldType: 'text', isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Item Not Found', 'No System in Place', 'Item Misplaced by Staff', 'Other'], isRequired: true },
          { id: 'estimatedValue', label: 'Estimated Value (INR)', fieldType: 'number', isRequired: false },
          { id: 'itemRecovered', label: 'Item Recovered', fieldType: 'checkbox', isRequired: false },
        ]
      },
      {
        id: 'nutrition-wellness-advice',
        name: 'Nutrition/Wellness Advice',
        description: 'Unqualified advice, conflicting information',
        formFields: [
          { id: 'adviceGivenBy', label: 'Advice Given By', fieldType: 'dropdown', options: ['Instructor', 'Staff', 'Other Member', 'Other'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Unqualified Advice', 'Conflicting Information', 'Pushy Supplement Sales', 'Medical Advice Given', 'Other'], isRequired: true },
          { id: 'adviceDetails', label: 'Advice Details', fieldType: 'textarea', isRequired: true },
          { id: 'concernLevel', label: 'Concern Level', fieldType: 'dropdown', options: ['Minor', 'Moderate', 'Serious'], isRequired: true },
        ]
      },
      {
        id: 'multi-location-issues',
        name: 'Multi-location Issues',
        description: 'Credits not transferring, different policies across studios',
        formFields: [
          { id: 'primaryLocation', label: 'Primary Location', fieldType: 'dropdown', options: ['Kwality House Kemps Corner', 'Kenkre House', 'South United Football Club', 'Supreme HQ Bandra', 'WeWork Prestige Central', 'WeWork Galaxy', 'The Studio by Copper + Cloves'], isRequired: true },
          { id: 'secondaryLocation', label: 'Secondary Location', fieldType: 'dropdown', options: ['Kwality House Kemps Corner', 'Kenkre House', 'South United Football Club', 'Supreme HQ Bandra', 'WeWork Prestige Central', 'WeWork Galaxy', 'The Studio by Copper + Cloves'], isRequired: true },
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Credits Not Transferring', 'Different Policies', 'Booking Confusion', 'Schedule Sync Issues', 'Other'], isRequired: true },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
      {
        id: 'feedback-system',
        name: 'Feedback System',
        description: 'Difficulty providing feedback, no response to feedback',
        formFields: [
          { id: 'issueType', label: 'Issue Type', fieldType: 'dropdown', options: ['Difficulty Providing Feedback', 'No Response to Feedback', 'Retaliation for Negative Feedback', 'Feedback Not Implemented', 'Other'], isRequired: true },
          { id: 'feedbackChannel', label: 'Feedback Channel Used', fieldType: 'dropdown', options: ['In-App', 'Email', 'In-Person', 'Social Media', 'Survey', 'Other'], isRequired: true },
          { id: 'originalFeedback', label: 'Original Feedback Given', fieldType: 'textarea', isRequired: false },
          { id: 'details', label: 'Details', fieldType: 'textarea', isRequired: true },
        ]
      },
    ]
  },
];

// Helper function to get category by ID
export function getCategoryById(categoryId: string): CategoryData | undefined {
  return categories.find(cat => cat.id === categoryId);
}

// Helper function to get subcategory by ID
export function getSubcategoryById(categoryId: string, subcategoryId: string): SubcategoryData | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(sub => sub.id === subcategoryId);
}

// Helper function to get all form fields for a subcategory (global + specific)
export function getAllFormFieldsForSubcategory(categoryId: string, subcategoryId: string): FormField[] {
  const subcategory = getSubcategoryById(categoryId, subcategoryId);
  if (!subcategory) return globalFields;
  return [...globalFields, ...subcategory.formFields];
}

// Locations data
export const locations = [
  { id: 'kwality-house', name: 'Kwality House Kemps Corner' },
  { id: 'kenkre-house', name: 'Kenkre House' },
  { id: 'south-united', name: 'South United Football Club' },
  { id: 'supreme-hq', name: 'Supreme HQ Bandra' },
  { id: 'wework-prestige', name: 'WeWork Prestige Central' },
  { id: 'wework-galaxy', name: 'WeWork Galaxy' },
  { id: 'copper-cloves', name: 'The Studio by Copper + Cloves' },
  { id: 'popup', name: 'Pop-up' },
];

// Departments data
export const departments = [
  { id: 'operations', name: 'Operations' },
  { id: 'facilities', name: 'Facilities' },
  { id: 'training', name: 'Training' },
  { id: 'sales', name: 'Sales' },
  { id: 'client_success', name: 'Client Success' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'finance', name: 'Finance' },
  { id: 'management', name: 'Management' },
];
