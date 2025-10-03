# Overview

ProjectFlow is a project timeline management application that enables teams to visualize, track, and manage project phases through an interactive Gantt-chart style interface. The application provides dashboard analytics, project creation with multi-phase workflows, and interactive timeline visualization using D3.js. Built with a modern full-stack architecture, it combines React for the frontend with Express for the backend, using PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Routing**: React with TypeScript using Wouter for client-side routing. The application uses a component-based architecture with three main pages: Dashboard, Projects, and Timeline.

**State Management**: TanStack Query (React Query) for server state management with aggressive caching strategies (staleTime: Infinity, no automatic refetching). This approach optimizes performance by treating server data as stable until explicitly invalidated.

**UI Components**: Shadcn UI component library built on Radix UI primitives, providing accessible, customizable components. Uses Tailwind CSS for styling with a comprehensive design system featuring theme variables for colors, spacing, and typography.

**Data Visualization**: D3.js for rendering interactive Gantt-chart timelines with zoom capabilities and phase status indicators. Timeline calculations are abstracted into utility functions for maintainability.

**Form Handling**: React Hook Form with Zod for schema validation, ensuring type-safe form submissions that align with backend validation schemas.

## Backend Architecture

**Server Framework**: Express.js with TypeScript running in ESM mode. The server implements custom middleware for request logging, JSON body parsing with raw body preservation for webhook verification scenarios.

**API Design**: RESTful API structure with endpoints for projects, phases, users, and analytics. Routes are organized in a dedicated routes module with consistent error handling and validation.

**Database Layer**: Storage abstraction pattern using an `IStorage` interface implemented by `DatabaseStorage`. This design allows for potential storage backend changes without affecting business logic.

**Development Setup**: Vite in middleware mode for HMR during development, with custom error logging. Production builds use esbuild for server bundling and Vite for client assets.

## Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket support for edge/serverless compatibility.

**ORM**: Drizzle ORM for type-safe database operations with schema definitions shared between client and server via the `/shared` directory. Uses Drizzle-Zod for automatic Zod schema generation from database schemas.

**Schema Design**:
- **Users**: Authentication credentials, profile information, and role-based access (admin, project_manager, developer, designer, team_member)
- **Projects**: Core project metadata with client information, date ranges, and status tracking
- **Phases**: Project sub-tasks with assignees, status enum (pending, in_progress, completed, delayed), ordering, and cascade deletion on project removal
- **Relations**: Users to projects (creator), users to phases (assignee), projects to phases (one-to-many)

**Migrations**: Drizzle Kit manages schema migrations with outputs to `/migrations` directory.

## External Dependencies

**UI Framework**: Shadcn UI components (@radix-ui/* packages) for accessible, headless UI primitives

**Data Visualization**: D3.js library for timeline rendering and interactive charts

**Database Services**: 
- Neon serverless PostgreSQL (@neondatabase/serverless)
- WebSocket support via 'ws' package for serverless database connections

**Development Tools**:
- Vite for frontend build and development server
- Replit-specific plugins (@replit/vite-plugin-*) for development experience enhancements
- TSX for TypeScript execution in development

**Form & Validation**:
- React Hook Form for form state management
- Zod for runtime schema validation
- @hookform/resolvers for integration

**Date Handling**: date-fns for date manipulation and formatting throughout the application

**Session Management**: connect-pg-simple for PostgreSQL-backed session storage (configured but authentication implementation not visible in provided files)