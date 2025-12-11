# Physique 57 Ticket Management System

## Overview

This is an internal ticket management and analytics system for Physique 57 India, designed to help internal teams record, track, and resolve customer feedback and issues. The application functions as a simplified support desk system with smart categorization, AI-powered insights, and comprehensive analytics dashboards.

The system supports multiple ticket categories specific to fitness studio operations including class experience, instructor-related issues, facility & amenities, and membership & billing concerns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom glassmorphic design system
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Custom theme with light/dark mode support, glassmorphic effects, and modern typography (Geist font family)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Structure**: RESTful endpoints under `/api` prefix
- **Authentication**: Replit Auth with OpenID Connect, Passport.js for session management
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **AI Integration**: OpenAI API for sentiment analysis and smart categorization

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with push-based migrations

### Key Data Models
- Users with role-based access (admin, manager, team_member, support_staff)
- Tickets with status workflow (open → in_progress → pending → resolved → closed)
- Categories and subcategories for issue classification
- Ticket comments, history, and attachments for full audit trails
- Notifications system for real-time updates
- Assignment and escalation rules for intelligent routing

### Build System
- **Development**: Vite with HMR and React plugin
- **Production Build**: esbuild for server bundling, Vite for client
- **Path Aliases**: `@/` for client source, `@shared/` for shared modules

## External Dependencies

### Database
- PostgreSQL (required, connection via DATABASE_URL environment variable)

### Authentication
- Replit Auth (OpenID Connect provider)
- Requires SESSION_SECRET environment variable

### AI Services
- OpenAI API for ticket analysis and sentiment detection
- Requires OPENAI_API_KEY environment variable

### UI Component Libraries
- Radix UI primitives (dialogs, dropdowns, forms, etc.)
- Lucide React for icons
- Embla Carousel for carousel components
- date-fns for date formatting

### Development Tools
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)