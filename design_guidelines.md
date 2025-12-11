# Design Guidelines: Physique 57 Ticket Management System

## Design Approach
**System-Based Approach**: Sophisticated glassmorphic design system inspired by modern productivity tools (Linear, Notion) with enterprise-grade data handling capabilities.

## Core Visual Language

### Color Palette
- **Primary Background**: Pure white (#FFFFFF)
- **Accent Gradients**: Charcoal to black (#1A1A1A → #0D0D0D) for emphasis and depth
- **Secondary Elements**: Deep slate (#2D3748), metallic silver (#E8E8E8) for borders
- **Status Colors**: Priority indicators (red, orange, yellow, green) with professional appearance

### Typography
- **Font Family**: Geist or Inter (modern sans-serif)
- **Weights**: Regular (400), Medium (500), Semibold (600)
- **Hierarchy**: Clear distinction between headings, body text, labels, and metadata

### Glassmorphic Components
- Semi-transparent white overlays (85-90% opacity)
- Backdrop blur effects for depth
- Subtle shadows for elevation
- Refined borders with gradient accents

### Spacing System
Use Tailwind spacing with 4px base unit: 2, 4, 6, 8, 12, 16, 24, 32, 48 (p-2, m-4, gap-8, etc.)

## Layout Architecture

### Dashboard Layout
- **Header**: Logo, global search bar (glassmorphic), user profile dropdown, notification bell
- **Sidebar**: Navigation with smooth transitions, dark gradient for active states
- **Main Content**: White background with strategic glassmorphic cards

### Multi-View System
1. **List View**: Clean table with hover states (dark gradient highlight)
2. **Kanban View**: Glassmorphic columns for ticket statuses with drag-and-drop
3. **Calendar View**: Deadline tracking with gradient indicators
4. **Timeline View**: Horizontal timeline with milestone markers

## Component Library

### Cards & Containers
- **KPI Cards**: Glassmorphic with dark gradient top border, large numbers, percentage indicators
- **Ticket Cards**: White background, priority dot indicator, status badge, key metadata
- **Detail Panels**: Layered glassmorphic effect with tab navigation

### Form Elements
- **Input Fields**: Refined borders, subtle focus states with gradient accent
- **Dropdowns**: Smooth animations, glassmorphic menu with proper spacing
- **File Upload**: Drag-and-drop area with minimalist design
- **Buttons**: Primary (dark gradient fill), Secondary (outline), sizes: sm, md, lg

### Data Display
- **Tables**: Alternating row backgrounds, sortable headers, hover highlights
- **Charts**: Gradient-filled line charts, color-coded donut charts, boxplots for metrics
- **Badges**: Status (Open, In Progress, Resolved), Priority (colored dots), Tags (AI-generated)

### Navigation
- **Breadcrumbs**: With gradient separators
- **Tabs**: Underline indicator with gradient accent
- **Filters Panel**: Collapsible glassmorphic sidebar with grouped options

## Ticket Creation Flow

### Multi-Step Form
1. **Category Selection**: Visual icon cards with glassmorphic hover effects
2. **Dynamic Fields**: Load based on subcategory, organized sections
3. **Client Information**: Efficient horizontal layout
4. **Priority & Routing**: Visual selectors with clear indicators
5. **Attachments**: Drag-and-drop with preview thumbnails
6. **Review & Submit**: Summary view with auto-save indicator

## Analytics Dashboard

### KPI Section
Four glassmorphic cards: Total Tickets, Avg Resolution Time, SLA Compliance %, Customer Satisfaction

### Charts
- **Ticket Volume**: Gradient-filled line chart with hover tooltips
- **Category Distribution**: Donut chart with color-coded segments
- **Resolution Metrics**: Boxplots with elegant styling
- **Team Performance**: Sortable table with gradient highlights

## Interactions & Animations

### Micro-Interactions
- Smooth page transitions (fade + subtle slide)
- Hover elevation on cards and buttons
- Loading states with skeleton screens (glassmorphic placeholders)
- Success animations (subtle, non-intrusive)
- Notification entry (slide + fade)

### Status Indicators
- Real-time updates with smooth transitions
- Priority changes with color morphing
- SLA warnings with gradient pulsing (approaching deadlines)
- Escalation alerts with prominent dark gradient emphasis

## Special Features

### AI Auto-Tagging Display
- Glassmorphic badges with gradient accents
- Sentiment visualization (green positive, gray neutral, red negative)
- Keyword cloud with elegant sizing

### Notification System
- Glassmorphic notification center dropdown
- Badge counter with subtle animation
- In-app cards with icon, title, description, action buttons

### Mobile Optimization
- Bottom tab bar navigation
- Touch-friendly sizing (min 44px)
- Responsive grids that stack elegantly
- Collapsible sections for dense information

## Accessibility
- High contrast for all text on glassmorphic backgrounds
- Clear focus indicators with gradient highlights
- Keyboard navigation support
- Screen reader friendly labels

## Images
No hero images required. Use icons from Lucide React (24px, consistent stroke weights) throughout the interface for categories, actions, and status indicators.