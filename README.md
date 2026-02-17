# OmniScope Intelligence Portal

**All Markets. One Scope.**

A sovereign-grade intelligence and CRM platform for institutional operations — built for discretion, execution, and scale.

---

## Overview

OmniScope Intelligence Portal is a private, multi-jurisdictional business intelligence system designed for OTC brokerage, commodities, real estate capital, and institutional clearing operations. It combines meeting intelligence, CRM, HR operations, and AI-powered analysis into a unified platform.

### Core Capabilities

- **Meeting Intelligence** — Auto-sync from Fathom, Plaud, or Zapier with GPT-4 analysis
- **CRM & Contact Management** — Contacts, companies, interactions, AI enrichment
- **Task & Project Management** — Kanban boards, assignments, follow-up reminders
- **HR Operations** — Employee records, payroll tracking, document management
- **AI Layer** — Ask OmniScope conversational search, daily briefings, duplicate detection
- **Google Calendar & Gmail Integration** — OAuth2-based sync and email sending
- **Branded Reports** — PDF and Markdown exports with OmniScope branding

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Node.js 22 + Express + tRPC 11
- **Database:** MySQL 8+ (Drizzle ORM)
- **AI:** OpenAI GPT-4o (or compatible API)
- **Storage:** AWS S3 (or compatible)
- **Auth:** OAuth2 + JWT sessions

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8+ database
- OpenAI API key (or compatible LLM endpoint)
- AWS S3 bucket (or compatible storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/jakeryanio/omniscope-intelligence-portal.git
cd omniscope-intelligence-portal

# Install dependencies
pnpm install

# Set up environment variables (see .env.example)
cp .env.example .env
# Edit .env with your credentials

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## Environment Variables

See `.env.example` for the complete list. Key variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/omniscope

# Authentication
JWT_SECRET=your-secret-key
OWNER_OPEN_ID=admin-user-id

# LLM API
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-your-openai-key

# Storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=omniscope-files
AWS_S3_REGION=us-east-1

# Google OAuth (for Calendar/Gmail)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Fathom AI (optional)
FATHOM_API_KEY=your-fathom-key
```

---

## Project Structure

```
omniscope-intelligence-portal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # tRPC client, utilities
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── _core/            # Framework (auth, LLM, storage)
│   ├── routers.ts        # tRPC API procedures
│   ├── db.ts             # Database query helpers
│   ├── ingestion.ts      # Meeting intelligence pipeline
│   ├── fathomIntegration.ts  # Fathom API integration
│   └── googleCalendar.ts # Google Calendar/Gmail integration
├── drizzle/              # Database schema & migrations
│   └── schema.ts
├── shared/               # Shared types & constants
└── package.json
```

---

## Key Features

### 1. Meeting Intelligence Pipeline

- **Auto-sync from Fathom** — Webhook receives meeting data, GPT-4 analyzes transcript
- **Plaud/Zapier integration** — Universal webhook endpoint for any transcription service
- **AI Analysis** — Extracts strategic highlights, opportunities, risks, quotes, action items
- **Auto-contact creation** — Identifies participants and creates/links contact records
- **Auto-task generation** — Converts action items to tasks with assignments
- **Branded PDF reports** — One-click export with OmniScope branding

### 2. CRM & Contact Management

- **Contacts** — Name, email, phone, company, role, category (Client, Partner, Employee, etc.)
- **Companies** — Organization profiles with linked contacts and interactions
- **Interactions** — Timeline of meetings, calls, emails with context
- **AI Enrichment** — Analyzes all notes/interactions to generate personality profiles
- **Duplicate detection** — Semantic similarity check when adding new contacts
- **Global search** — Search across contacts, companies, meetings, tasks

### 3. Task & Project Management

- **Kanban board** — Drag-and-drop task management with status columns
- **Task assignment** — Assign to team members with due dates
- **Meeting linking** — Tasks auto-linked to source meetings
- **Follow-up reminders** — AI scans for approaching deadlines and generates reminders
- **Bulk operations** — Multi-select, bulk status updates

### 4. AI Layer

- **Ask OmniScope** — Conversational search across all data with GPT-4 synthesis
- **Daily briefings** — Automated morning summary of meetings, tasks, priorities
- **Contact enrichment** — AI-generated personality profiles and relationship insights
- **Duplicate detection** — Semantic similarity matching for contact deduplication
- **Birthday alerts** — Automated reminders with message suggestions

### 5. Google Calendar & Gmail Integration

- **OAuth2 flow** — Secure authorization with refresh token storage
- **Calendar sync** — Two-way sync of events
- **Event creation** — Create Google Calendar events from the portal
- **Gmail sending** — Send emails via Gmail API (meeting recaps, follow-ups)

### 6. HR Operations

- **Employee records** — Full employee profiles with contact info, role, department
- **Payroll tracking** — Salary, payment method, payment schedule
- **Document management** — Upload contracts, IDs, receipts with S3 storage
- **Department organization** — Group employees by department

---

## API Documentation

The portal uses tRPC for type-safe API calls. All procedures are defined in `server/routers.ts`.

### Key Router Namespaces

- `auth` — Authentication (login, logout, me)
- `meetings` — Meeting CRUD, search, analysis
- `contacts` — Contact CRUD, search, enrichment
- `companies` — Company CRUD, linking
- `tasks` — Task CRUD, Kanban operations
- `employees` — HR operations
- `aiInsights` — Ask OmniScope, daily briefings, reminders
- `ingestion` — Webhook endpoints for Fathom/Plaud
- `admin` — User management, invitations

---

## Deployment

### Production Build

```bash
# Build frontend and backend
pnpm build

# Start production server
NODE_ENV=production node dist/index.js
```

### Docker Deployment

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Recommended Architecture

```
[Cloudflare DNS + SSL]
        │
[Nginx Reverse Proxy]
        │
[Node.js App (PM2)]  ──→  [MySQL 8+ (PlanetScale)]
        │
        ├──→  [OpenAI API]
        ├──→  [AWS S3 / R2]
        ├──→  [Fathom API]
        └──→  [Google APIs]
```

---

## Self-Hosting Guide

See `docs/self-hosting-guide.md` for a complete migration guide including:

- Infrastructure requirements
- Environment variable setup
- LLM API configuration
- S3 storage setup
- Authentication replacement
- Cost estimates

**Estimated monthly cost:** $16–75 (VPS + database + S3 + LLM API)

---

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Type checking
pnpm check
```

174 tests covering authentication, database operations, Fathom integration, and business logic.

---

## License

MIT License — See LICENSE file for details.

---

## Support

For questions or issues, contact the OmniScope team or open an issue on GitHub.

---

**Built with Manus AI**  
*Sovereign infrastructure for institutional execution*
