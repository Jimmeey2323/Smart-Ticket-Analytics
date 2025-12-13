export type TemplateField = {
  id: string;
  label: string;
  fieldType:
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
  description: string;
  isRequired: boolean;
  isHidden?: boolean;
  options?: string[];
};

export type TemplateSection = {
  name: string;
  fields: TemplateField[];
};

export type TicketTemplate = {
  categoryName: string;
  subcategoryName: string;
  subcategoryDescription?: string;
  sections: TemplateSection[];
};

export const P57_TICKET_TEMPLATES: TicketTemplate[] = [
  {
    categoryName: 'Class & Instruction',
    subcategoryName: 'Hosted Class Feedback',
    subcategoryDescription: 'Feedback template for hosted / influencer / partner classes',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_hc_event_date',
            label: 'Event Date',
            fieldType: 'Date',
            description: 'Date when the hosted/influencer class took place',
            isRequired: true,
          },
          {
            id: 'p57_hc_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio or venue where the class was conducted',
            isRequired: true,
          },
          {
            id: 'p57_hc_partner_name',
            label: 'Influencer / Partner Name',
            fieldType: 'Text',
            description: 'Name of influencer or collaborating brand',
            isRequired: true,
          },
          {
            id: 'p57_hc_logged_by',
            label: 'Logged By',
            fieldType: 'Dropdown',
            options: ['Associates list'],
            description: 'Staff member submitting this form',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_hc_class_type',
            label: 'Class Type',
            fieldType: 'Dropdown',
            options: ['Classes list (include Studio Hosted Class)'],
            description: 'Class format delivered during the event',
            isRequired: true,
          },
          {
            id: 'p57_hc_trainer',
            label: 'Trainer Conducting Class',
            fieldType: 'Dropdown',
            options: ['Trainers list'],
            description: 'Trainer who led the hosted class',
            isRequired: true,
          },
          {
            id: 'p57_hc_total_attendees',
            label: 'Total Attendees',
            fieldType: 'Number',
            description: 'Total number of people who attended the class',
            isRequired: true,
          },
          {
            id: 'p57_hc_new_prospects',
            label: 'New Prospects Count',
            fieldType: 'Number',
            description: 'Attendees who were new to Physique 57',
            isRequired: true,
          },
          {
            id: 'p57_hc_existing_clients',
            label: 'Existing Clients Count',
            fieldType: 'Number',
            description: 'Attendees who were existing clients',
            isRequired: true,
          },
          {
            id: 'p57_hc_conversion_booked',
            label: 'Conversion Appointments Booked',
            fieldType: 'Number',
            description: 'Number of trials / sales appointments scheduled post-class',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Sales Intelligence',
        fields: [
          {
            id: 'p57_hc_packages_discussed',
            label: 'Packages Discussed',
            fieldType: 'Checkbox',
            options: ['Memberships', 'Class Packages', 'Privates', 'Single Classes', 'Gift Cards', 'Others'],
            description: 'Products/packages discussed with attendees',
            isRequired: false,
          },
          {
            id: 'p57_hc_objections',
            label: 'Key Objections Raised',
            fieldType: 'Long Text',
            description: 'Common objections or hesitations expressed by prospects',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_hc_audience_fit',
            label: 'Influencer Audience Fit',
            fieldType: 'Dropdown',
            options: ['Strong Fit', 'Moderate Fit', 'Poor Fit'],
            description: 'How relevant was the influencer’s audience to our target client',
            isRequired: true,
          },
          {
            id: 'p57_hc_revenue_potential',
            label: 'Estimated Revenue Potential',
            fieldType: 'Dropdown',
            options: ['Low (<₹25k)', 'Medium (₹25k–₹75k)', 'High (>₹75k)'],
            description: 'Sales potential from this event',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_hc_followup_owner',
            label: 'Follow-Up Owner',
            fieldType: 'Dropdown',
            options: ['Sales', 'Marketing', 'Client Success', 'Management'],
            description: 'Department or team responsible for next action',
            isRequired: true,
          },
          {
            id: 'p57_hc_followup_deadline',
            label: 'Follow-Up Deadline',
            fieldType: 'Date',
            description: 'Date by which follow-up should be completed',
            isRequired: false,
          },
        ],
      },
    ],
  },

  {
    categoryName: 'Facilities & Equipment',
    subcategoryName: 'Studio Amenities & Personnel Related',
    subcategoryDescription: 'Template for reporting amenities/facilities/personnel issues in studio',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_afp_logged_datetime',
            label: 'Issue Logged Date & Time',
            fieldType: 'DateTime',
            description: 'Timestamp when the issue was observed or reported',
            isRequired: true,
          },
          {
            id: 'p57_afp_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio where the issue occurred',
            isRequired: true,
          },
          {
            id: 'p57_afp_logged_by',
            label: 'Logged By',
            fieldType: 'Dropdown',
            options: ['Associates list', 'Trainers list'],
            description: 'Staff member submitting this report',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_afp_issue_category',
            label: 'Issue Category',
            fieldType: 'Dropdown',
            options: ['Equipment/Facilities', 'Amenities (Washrooms/Lockers/Water)', 'Personnel', 'Safety Concern'],
            description: 'Broad classification of the issue',
            isRequired: true,
          },
          {
            id: 'p57_afp_specific_area',
            label: 'Specific Area / Asset',
            fieldType: 'Text',
            description: 'Area, room, or asset involved (e.g. Locker Room, Barre #2)',
            isRequired: true,
          },
          {
            id: 'p57_afp_issue_description',
            label: 'Issue Description',
            fieldType: 'Long Text',
            description: 'Factual description of what is not working or observed',
            isRequired: true,
          },
          {
            id: 'p57_afp_personnel_involved',
            label: 'Personnel Involved (if applicable)',
            fieldType: 'Dropdown',
            options: ['Trainers list', 'Associates list'],
            description: 'Staff member(s) involved in the issue',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_afp_classes_impacted',
            label: 'Class(es) Impacted',
            fieldType: 'Checkbox',
            options: ['Classes list'],
            description: 'Classes affected due to this issue',
            isRequired: false,
          },
          {
            id: 'p57_afp_client_impact',
            label: 'Client Impact Observed',
            fieldType: 'Dropdown',
            options: ['Yes – service disruption', 'Yes – safety risk', 'No client impact yet'],
            description: 'Whether clients were directly impacted',
            isRequired: true,
          },
          {
            id: 'p57_afp_action_taken',
            label: 'Immediate Action Taken',
            fieldType: 'Long Text',
            description: 'Temporary fix or action already taken on-site',
            isRequired: false,
          },
          {
            id: 'p57_afp_priority',
            label: 'Priority Level',
            fieldType: 'Dropdown',
            options: ['Low (log only)', 'Medium (48hrs)', 'High (24hrs)', 'Critical (immediate)'],
            description: 'Urgency based on impact and risk',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_afp_department',
            label: 'Department to Notify',
            fieldType: 'Dropdown',
            options: ['Facilities', 'Operations', 'Training', 'Client Success', 'Management'],
            description: 'Team responsible for resolution',
            isRequired: true,
          },
          {
            id: 'p57_afp_followup_required',
            label: 'Follow-Up Required',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether additional follow-up is needed',
            isRequired: true,
          },
          {
            id: 'p57_afp_followup_deadline',
            label: 'Follow-Up Deadline',
            fieldType: 'Date',
            description: 'Target date for issue resolution',
            isRequired: false,
          },
        ],
      },
    ],
  },

  {
    categoryName: 'Facilities & Equipment',
    subcategoryName: 'Studio Repair & Maintenance',
    subcategoryDescription: 'Template for repairs and maintenance issues',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_rm_logged_datetime',
            label: 'Issue Logged Date & Time',
            fieldType: 'DateTime',
            description: 'When the issue was identified',
            isRequired: true,
          },
          {
            id: 'p57_rm_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio or site where issue occurred',
            isRequired: true,
          },
          {
            id: 'p57_rm_logged_by',
            label: 'Logged By',
            fieldType: 'Dropdown',
            options: ['Associates list', 'Trainers list'],
            description: 'Staff member reporting issue',
            isRequired: true,
          },
          {
            id: 'p57_rm_shift',
            label: 'Shift During Discovery',
            fieldType: 'Dropdown',
            options: ['Opening', 'Mid-day', 'Closing'],
            description: 'Shift when issue was noticed',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_rm_issue_type',
            label: 'Issue Type',
            fieldType: 'Dropdown',
            options: ['Equipment', 'Electrical', 'Plumbing', 'HVAC / AC', 'Structural', 'Cleanliness / Upkeep', 'IT / AV', 'Other'],
            description: 'Category of maintenance issue',
            isRequired: true,
          },
          {
            id: 'p57_rm_asset_name',
            label: 'Asset / Equipment Name',
            fieldType: 'Text',
            description: 'Specific asset or area affected',
            isRequired: true,
          },
          {
            id: 'p57_rm_asset_id',
            label: 'Asset ID / Tag (if any)',
            fieldType: 'Text',
            description: 'Internal tag or identifier for the asset',
            isRequired: false,
          },
          {
            id: 'p57_rm_issue_description',
            label: 'Issue Description',
            fieldType: 'Long Text',
            description: 'Factual description of problem observed',
            isRequired: true,
          },
          {
            id: 'p57_rm_suspected_cause',
            label: 'Suspected Cause',
            fieldType: 'Dropdown',
            options: ['Wear & tear', 'Improper use', 'Power / utility issue', 'Vendor fault', 'Unknown'],
            description: 'Likely reason for issue (if known)',
            isRequired: false,
          },
          {
            id: 'p57_rm_first_observed',
            label: 'Issue First Observed On',
            fieldType: 'Date',
            description: 'Date issue was first noticed',
            isRequired: false,
          },
          {
            id: 'p57_rm_frequency',
            label: 'Frequency of Issue',
            fieldType: 'Dropdown',
            options: ['First occurrence', 'Repeat issue', 'Frequent recurring'],
            description: 'Whether this is a repeat problem',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_rm_classes_impacted',
            label: 'Classes Impacted',
            fieldType: 'Checkbox',
            options: ['Classes list'],
            description: 'Classes affected or at risk',
            isRequired: false,
          },
          {
            id: 'p57_rm_class_cancelled',
            label: 'Class Cancellations Required',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether any classes were cancelled',
            isRequired: true,
          },
          {
            id: 'p57_rm_estimated_downtime',
            label: 'Estimated Downtime (Hours)',
            fieldType: 'Number',
            description: 'Expected equipment or area downtime',
            isRequired: false,
          },
          {
            id: 'p57_rm_client_impact',
            label: 'Client Impact Level',
            fieldType: 'Dropdown',
            options: ['No impact', 'Minor inconvenience', 'Class disruption', 'Safety risk'],
            description: 'Level of disruption or risk to clients',
            isRequired: true,
          },
          {
            id: 'p57_rm_temp_action',
            label: 'Temporary Action Taken',
            fieldType: 'Long Text',
            description: 'Workaround or safety measure applied',
            isRequired: false,
          },
          {
            id: 'p57_rm_priority',
            label: 'Priority Level',
            fieldType: 'Dropdown',
            options: ['Low (log only)', 'Medium (48hrs)', 'High (24hrs)', 'Critical (immediate)'],
            description: 'Urgency of resolution',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_rm_vendor_required',
            label: 'Vendor / Technician Required',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether external help is needed',
            isRequired: true,
          },
          {
            id: 'p57_rm_preferred_vendor',
            label: 'Preferred Vendor (if known)',
            fieldType: 'Text',
            description: 'Vendor name if already identified',
            isRequired: false,
          },
          {
            id: 'p57_rm_vendor_called_date',
            label: 'Vendor Called Date',
            fieldType: 'Date',
            description: 'When vendor was contacted',
            isRequired: false,
          },
          {
            id: 'p57_rm_department',
            label: 'Department to Notify',
            fieldType: 'Dropdown',
            options: ['Facilities', 'Operations', 'Management'],
            description: 'Team responsible for coordination',
            isRequired: true,
          },
          {
            id: 'p57_rm_approved_by',
            label: 'Repair Approved By',
            fieldType: 'Dropdown',
            options: ['Management list'],
            description: 'Manager who approved the repair',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Financial Impact',
        fields: [
          {
            id: 'p57_rm_estimated_cost',
            label: 'Estimated Repair Cost (₹)',
            fieldType: 'Number',
            description: 'Expected cost before work begins',
            isRequired: false,
          },
          {
            id: 'p57_rm_actual_cost',
            label: 'Actual Repair Cost (₹)',
            fieldType: 'Number',
            description: 'Final cost after completion',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Closure',
        fields: [
          {
            id: 'p57_rm_status',
            label: 'Resolution Status',
            fieldType: 'Dropdown',
            options: ['Logged', 'In Progress', 'Awaiting Vendor', 'Resolved', 'Deferred'],
            description: 'Current status of the issue',
            isRequired: true,
          },
          {
            id: 'p57_rm_resolution_date',
            label: 'Actual Resolution Date',
            fieldType: 'Date',
            description: 'Date issue was fully resolved',
            isRequired: false,
          },
          {
            id: 'p57_rm_preventive_action',
            label: 'Preventive Action Recommended',
            fieldType: 'Long Text',
            description: 'Steps to avoid recurrence',
            isRequired: false,
          },
        ],
      },
    ],
  },

  {
    categoryName: 'Class & Instruction',
    subcategoryName: 'Trainer Feedback',
    subcategoryDescription: 'Template for capturing trainer feedback observations',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_tf_logged_datetime',
            label: 'Feedback Logged Date & Time',
            fieldType: 'DateTime',
            description: 'When this feedback is being recorded',
            isRequired: true,
          },
          {
            id: 'p57_tf_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio where the observation or issue occurred',
            isRequired: true,
          },
          {
            id: 'p57_tf_logged_by',
            label: 'Logged By',
            fieldType: 'Dropdown',
            options: ['Associates list'],
            description: 'Staff member submitting this feedback',
            isRequired: true,
          },
          {
            id: 'p57_tf_trainer',
            label: 'Trainer Name',
            fieldType: 'Dropdown',
            options: ['Trainers list'],
            description: 'Trainer being referenced',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_tf_class_type',
            label: 'Class Type',
            fieldType: 'Dropdown',
            options: ['Classes list'],
            description: 'Class during which the issue or observation occurred',
            isRequired: true,
          },
          {
            id: 'p57_tf_feedback_category',
            label: 'Feedback Category',
            fieldType: 'Dropdown',
            options: ['Class Delivery', 'Client Interaction', 'Professional Conduct', 'Punctuality', 'Safety / Form Correction', 'Protocol Compliance', 'Other'],
            description: 'Primary nature of feedback',
            isRequired: true,
          },
          {
            id: 'p57_tf_observation',
            label: 'Specific Observation',
            fieldType: 'Long Text',
            description: 'Factual description of what was observed (no opinions)',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_tf_clients_impacted',
            label: 'Client(s) Impacted',
            fieldType: 'Text',
            description: 'Client name(s) if applicable',
            isRequired: false,
          },
          {
            id: 'p57_tf_client_impact',
            label: 'Client Impact Level',
            fieldType: 'Dropdown',
            options: ['No impact', 'Minor dissatisfaction', 'Class disruption', 'Safety concern'],
            description: 'Extent of impact on client experience or safety',
            isRequired: true,
          },
          {
            id: 'p57_tf_repeat_issue',
            label: 'Was This a Repeat Issue?',
            fieldType: 'Dropdown',
            options: ['Yes', 'No', 'Unsure'],
            description: 'Whether this has occurred before with the same trainer',
            isRequired: false,
          },
          {
            id: 'p57_tf_action_taken',
            label: 'Immediate Action Taken',
            fieldType: 'Long Text',
            description: 'Any real-time correction or intervention done',
            isRequired: false,
          },
          {
            id: 'p57_tf_priority',
            label: 'Priority Level',
            fieldType: 'Dropdown',
            options: ['Low (log only)', 'Medium (48hrs)', 'High (24hrs)', 'Critical (immediate)'],
            description: 'Urgency for review or action',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_tf_department',
            label: 'Department to Notify',
            fieldType: 'Dropdown',
            options: ['Training', 'Operations', 'Client Success', 'Management'],
            description: 'Team responsible for follow-up',
            isRequired: true,
          },
          {
            id: 'p57_tf_followup_required',
            label: 'Follow-Up Required',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether further action is needed',
            isRequired: true,
          },
          {
            id: 'p57_tf_followup_deadline',
            label: 'Follow-Up Deadline',
            fieldType: 'Date',
            description: 'Target date for review or action',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Closure',
        fields: [
          {
            id: 'p57_tf_manager_notes',
            label: 'Manager Review Notes',
            fieldType: 'Long Text',
            description: 'Notes added during review or closure',
            isRequired: false,
          },
        ],
      },
    ],
  },

  {
    categoryName: 'Class & Instruction',
    subcategoryName: 'Class Experience Feedback',
    subcategoryDescription: 'Template for class experience feedback and quality issues',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_ce_logged_datetime',
            label: 'Feedback Logged Date & Time',
            fieldType: 'DateTime',
            description: 'When this feedback is being recorded',
            isRequired: true,
          },
          {
            id: 'p57_ce_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio where the class took place',
            isRequired: true,
          },
          {
            id: 'p57_ce_logged_by',
            label: 'Logged By',
            fieldType: 'Dropdown',
            options: ['Associates list', 'Trainers list'],
            description: 'Staff member submitting this feedback',
            isRequired: true,
          },
          {
            id: 'p57_ce_class_date',
            label: 'Class Date',
            fieldType: 'Date',
            description: 'Date when the class occurred',
            isRequired: true,
          },
          {
            id: 'p57_ce_class_time',
            label: 'Class Time Slot',
            fieldType: 'Text',
            description: 'Scheduled time of the class',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_ce_class_type',
            label: 'Class Type',
            fieldType: 'Dropdown',
            options: ['Classes list'],
            description: 'Format of the class conducted',
            isRequired: true,
          },
          {
            id: 'p57_ce_trainer',
            label: 'Trainer Name',
            fieldType: 'Dropdown',
            options: ['Trainers list'],
            description: 'Trainer who led the class',
            isRequired: true,
          },
          {
            id: 'p57_ce_attendance',
            label: 'Attendance Count',
            fieldType: 'Number',
            description: 'Total number of attendees',
            isRequired: true,
          },
          {
            id: 'p57_ce_capacity',
            label: 'Capacity Utilisation',
            fieldType: 'Dropdown',
            options: ['Under 50%', '50–75%', '75–100%'],
            description: 'How full the class was',
            isRequired: false,
          },
          {
            id: 'p57_ce_feedback_category',
            label: 'Primary Feedback Category',
            fieldType: 'Dropdown',
            options: ['Intensity Level', 'Cueing / Clarity', 'Music / Audio', 'Pace / Flow', 'Space / Setup', 'Temperature / Ventilation', 'Other'],
            description: 'Main class experience issue',
            isRequired: true,
          },
          {
            id: 'p57_ce_observation',
            label: 'Specific Observation',
            fieldType: 'Long Text',
            description: 'What specifically impacted the class experience',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_ce_clients_impacted',
            label: 'Client(s) Impacted',
            fieldType: 'Text',
            description: 'Client names if feedback came from specific individuals',
            isRequired: false,
          },
          {
            id: 'p57_ce_client_impact',
            label: 'Client Impact Level',
            fieldType: 'Dropdown',
            options: ['No impact', 'Mild dissatisfaction', 'Multiple complaints', 'Safety concern'],
            description: 'Severity of impact on experience or safety',
            isRequired: true,
          },
          {
            id: 'p57_ce_class_disruption',
            label: 'Class Interrupted or Delayed',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether class flow was disrupted',
            isRequired: true,
          },
          {
            id: 'p57_ce_action_taken',
            label: 'Immediate Action Taken',
            fieldType: 'Long Text',
            description: 'On-the-spot adjustments or resolution',
            isRequired: false,
          },
          {
            id: 'p57_ce_repeat_issue',
            label: 'Repeat Feedback for This Class',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether this issue has been reported before',
            isRequired: false,
          },
          {
            id: 'p57_ce_priority',
            label: 'Priority Level',
            fieldType: 'Dropdown',
            options: ['Low (log only)', 'Medium (48hrs)', 'High (24hrs)', 'Critical (immediate)'],
            description: 'Urgency for follow-up',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_ce_department',
            label: 'Department to Notify',
            fieldType: 'Dropdown',
            options: ['Training', 'Operations', 'Client Success', 'Management'],
            description: 'Team responsible for review',
            isRequired: true,
          },
          {
            id: 'p57_ce_followup_required',
            label: 'Follow-Up Required',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether further action is needed',
            isRequired: true,
          },
          {
            id: 'p57_ce_followup_deadline',
            label: 'Follow-Up Deadline',
            fieldType: 'Date',
            description: 'Target date for action',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Closure',
        fields: [
          {
            id: 'p57_ce_manager_notes',
            label: 'Manager Review Notes',
            fieldType: 'Long Text',
            description: 'Notes added during review or closure',
            isRequired: false,
          },
        ],
      },
    ],
  },

  {
    categoryName: 'Class & Instruction',
    subcategoryName: 'Scheduling and Planning Feedback',
    subcategoryDescription: 'Template for scheduling, planning, and calendar feedback',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_cm_logged_datetime',
            label: 'Feedback Logged Date & Time',
            fieldType: 'DateTime',
            description: 'When this feedback is recorded',
            isRequired: true,
          },
          {
            id: 'p57_cm_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio to which this feedback applies',
            isRequired: true,
          },
          {
            id: 'p57_cm_logged_by',
            label: 'Logged By',
            fieldType: 'Dropdown',
            options: ['Associates list', 'Trainers list'],
            description: 'Staff member submitting feedback',
            isRequired: true,
          },
          {
            id: 'p57_cm_feedback_type',
            label: 'Feedback Type',
            fieldType: 'Dropdown',
            options: ['Issue Observed', 'Change Recommendation', 'Demand Insight'],
            description: 'Nature of input being logged',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_cm_time_slot',
            label: 'Time Slot Affected',
            fieldType: 'Text',
            description: 'Time slot being discussed',
            isRequired: true,
          },
          {
            id: 'p57_cm_days',
            label: 'Day(s) of Week',
            fieldType: 'Checkbox',
            options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            description: 'Days this feedback applies to',
            isRequired: true,
          },
          {
            id: 'p57_cm_current_class',
            label: 'Current Class Type',
            fieldType: 'Dropdown',
            options: ['Classes list'],
            description: 'Class currently scheduled',
            isRequired: true,
          },
          {
            id: 'p57_cm_attendance_trend',
            label: 'Attendance Trend',
            fieldType: 'Dropdown',
            options: ['Consistently Full', 'Stable', 'Underfilled', 'Frequently Cancelled'],
            description: 'Observed booking trend',
            isRequired: true,
          },
          {
            id: 'p57_cm_waitlist_freq',
            label: 'Waitlist Frequency',
            fieldType: 'Dropdown',
            options: ['Never', 'Occasionally', 'Frequently'],
            description: 'How often waitlists occur',
            isRequired: false,
          },
          {
            id: 'p57_cm_client_segment',
            label: 'Client Segment Observed',
            fieldType: 'Checkbox',
            options: ['Newcomers', 'Regulars', 'Advanced', 'Pre/Post Natal'],
            description: 'Dominant client type attending',
            isRequired: false,
          },
          {
            id: 'p57_cm_conflict',
            label: 'Competing Class Conflict',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether another class competes for same clients',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_cm_suggested_class',
            label: 'Suggested Class Type',
            fieldType: 'Dropdown',
            options: ['Classes list'],
            description: 'Recommended replacement or addition',
            isRequired: false,
          },
          {
            id: 'p57_cm_trainer_profile',
            label: 'Suggested Trainer Profile',
            fieldType: 'Dropdown',
            options: ['Senior Trainer', 'Strength-focused', 'Beginner-friendly', 'Any'],
            description: 'Trainer profile best suited',
            isRequired: false,
          },
          {
            id: 'p57_cm_expected_impact',
            label: 'Expected Impact on Attendance',
            fieldType: 'Dropdown',
            options: ['Increase', 'Neutral', 'Decrease'],
            description: 'Forecast after change',
            isRequired: false,
          },
          {
            id: 'p57_cm_revenue_impact',
            label: 'Revenue Impact Estimate',
            fieldType: 'Dropdown',
            options: ['Low', 'Medium', 'High'],
            description: 'Expected business impact',
            isRequired: false,
          },
          {
            id: 'p57_cm_priority',
            label: 'Priority Level',
            fieldType: 'Dropdown',
            options: ['Low (log only)', 'Medium (48hrs)', 'High (24hrs)'],
            description: 'Urgency of review',
            isRequired: true,
          },
          {
            id: 'p57_cm_supporting_obs',
            label: 'Supporting Observation',
            fieldType: 'Long Text',
            description: 'Factual basis for this input',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_cm_department',
            label: 'Department to Notify',
            fieldType: 'Dropdown',
            options: ['Operations', 'Training', 'Sales', 'Management'],
            description: 'Team responsible for evaluation',
            isRequired: true,
          },
          {
            id: 'p57_cm_review_deadline',
            label: 'Review Required By',
            fieldType: 'Date',
            description: 'Deadline for planning decision',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Closure',
        fields: [
          {
            id: 'p57_cm_decision_status',
            label: 'Decision Status',
            fieldType: 'Dropdown',
            options: ['Pending', 'Approved', 'Rejected', 'Trial Scheduled'],
            description: 'Outcome after review',
            isRequired: false,
          },
          {
            id: 'p57_cm_trial_dates',
            label: 'Trial Period Dates',
            fieldType: 'Text',
            description: 'Dates for trial if approved',
            isRequired: false,
          },
        ],
      },
    ],
  },

  {
    categoryName: 'Class & Instruction',
    subcategoryName: 'Trainer Allocation Request',
    subcategoryDescription: 'Template for requesting trainer allocations and substitutions',
    sections: [
      {
        name: 'Identification',
        fields: [
          {
            id: 'p57_ta_logged_datetime',
            label: 'Request Logged Date & Time',
            fieldType: 'DateTime',
            description: 'When the allocation request is being raised',
            isRequired: true,
          },
          {
            id: 'p57_ta_location',
            label: 'Location',
            fieldType: 'Dropdown',
            options: ['Locations list'],
            description: 'Studio where trainer is required',
            isRequired: true,
          },
          {
            id: 'p57_ta_requested_by',
            label: 'Requested By',
            fieldType: 'Dropdown',
            options: ['Associates list', 'Managers list'],
            description: 'Staff member raising the request',
            isRequired: true,
          },
          {
            id: 'p57_ta_request_type',
            label: 'Request Type',
            fieldType: 'Dropdown',
            options: ['New Class Allocation', 'Substitute Required', 'Additional Class', 'Permanent Reallocation', 'Emergency Coverage'],
            description: 'Nature of trainer allocation request',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Core Information',
        fields: [
          {
            id: 'p57_ta_reason',
            label: 'Reason for Request',
            fieldType: 'Dropdown',
            options: ['Trainer Leave', 'Trainer No-Show', 'High Demand', 'Special Event / Hosted Class', 'Skill Match Needed', 'Schedule Optimisation'],
            description: 'Primary reason driving the request',
            isRequired: true,
          },
          {
            id: 'p57_ta_urgency',
            label: 'Urgency Level',
            fieldType: 'Dropdown',
            options: ['Immediate (same day)', '24 hrs', '48 hrs', 'Planned (3+ days)'],
            description: 'How soon the trainer is required',
            isRequired: true,
          },
          {
            id: 'p57_ta_class_date',
            label: 'Class Date',
            fieldType: 'Date',
            description: 'Date for which trainer allocation is needed',
            isRequired: true,
          },
          {
            id: 'p57_ta_class_time',
            label: 'Class Time Slot',
            fieldType: 'Text',
            description: 'Time slot requiring trainer coverage',
            isRequired: true,
          },
          {
            id: 'p57_ta_class_type',
            label: 'Class Type',
            fieldType: 'Dropdown',
            options: ['Classes list'],
            description: 'Class format requiring coverage',
            isRequired: true,
          },
          {
            id: 'p57_ta_original_trainer',
            label: 'Original Trainer (if any)',
            fieldType: 'Dropdown',
            options: ['Trainers list'],
            description: 'Trainer initially scheduled',
            isRequired: false,
          },
          {
            id: 'p57_ta_preferred_trainers',
            label: 'Preferred Trainer(s)',
            fieldType: 'Checkbox',
            options: ['Trainers list'],
            description: 'Trainer(s) ideally suited for this allocation',
            isRequired: false,
          },
          {
            id: 'p57_ta_skill_requirement',
            label: 'Skill / Certification Requirement',
            fieldType: 'Checkbox',
            options: ['Pre/Post Natal', 'PowerCycle', 'Strength Lab', 'Senior Trainer'],
            description: 'Any specific skills required',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Impact Assessment',
        fields: [
          {
            id: 'p57_ta_expected_attendance',
            label: 'Expected Attendance',
            fieldType: 'Dropdown',
            options: ['Low', 'Medium', 'High', 'Waitlist Expected'],
            description: 'Anticipated class load',
            isRequired: false,
          },
          {
            id: 'p57_ta_client_risk',
            label: 'Client Sensitivity',
            fieldType: 'Dropdown',
            options: ['Low', 'Medium', 'High'],
            description: 'Risk of client dissatisfaction if unfulfilled',
            isRequired: true,
          },
          {
            id: 'p57_ta_revenue_risk',
            label: 'Revenue at Risk (₹)',
            fieldType: 'Number',
            description: 'Estimated revenue impact if class is cancelled',
            isRequired: false,
          },
          {
            id: 'p57_ta_temp_action',
            label: 'Temporary Action Taken',
            fieldType: 'Long Text',
            description: 'Interim steps taken before allocation',
            isRequired: false,
          },
          {
            id: 'p57_ta_priority',
            label: 'Priority Level',
            fieldType: 'Dropdown',
            options: ['Low', 'Medium', 'High', 'Critical'],
            description: 'Overall priority of request',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Routing',
        fields: [
          {
            id: 'p57_ta_approval_required',
            label: 'Approval Required',
            fieldType: 'Dropdown',
            options: ['Yes', 'No'],
            description: 'Whether management approval is needed',
            isRequired: true,
          },
          {
            id: 'p57_ta_approving_manager',
            label: 'Approving Manager',
            fieldType: 'Dropdown',
            options: ['Management list'],
            description: 'Manager approving allocation',
            isRequired: false,
          },
          {
            id: 'p57_ta_department',
            label: 'Department Handling',
            fieldType: 'Dropdown',
            options: ['Operations', 'Training', 'Management'],
            description: 'Team responsible for fulfilment',
            isRequired: true,
          },
        ],
      },
    ],
  },
];
