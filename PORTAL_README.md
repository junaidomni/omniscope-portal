# OmniScope Intelligence Portal

**All Markets. One Scope.**

A secure, enterprise-grade intelligence portal for consolidating call intelligence reports, managing action items, and tracking strategic insights across all OmniScope client meetings.

---

## Overview

The OmniScope Intelligence Portal is an internal tool designed for the OmniScope team to:

- **Consolidate call intelligence** from Plaud and Fathom recordings
- **Search and filter** meeting reports by date, sector, jurisdiction, and participants
- **Track action items** with automated task extraction and status management
- **Maintain institutional memory** with full-text search across all transcripts
- **Generate insights** through daily and weekly intelligence summaries

---

## Features

### 🔒 Secure Authentication
- Manus OAuth integration restricted to @omniscopex.ae domain
- Role-based access control (admin/user)
- Persistent login sessions

### 📊 Intelligence Dashboard
- View all call intelligence reports in chronological order
- Filter by primary lead, date range, sector, and jurisdiction
- Search across meeting transcripts and summaries
- OmniScope black and gold branding

### 📝 Meeting Detail Pages
- Executive strategic summaries
- Strategic highlights and key quotes
- Opportunities and risks analysis
- Participant and organization tracking
- Automated action item extraction

### ✅ Task Management
- Automated task creation from meeting action items
- Task assignment to team members
- Status tracking (open/in-progress/completed)
- Priority levels (low/medium/high)
- Filter by status and assignee

### 🔍 Full-Text Search
- Search across all meeting transcripts
- Filter results by relevance
- Quick access to meeting details

### 🔗 Data Ingestion Pipeline
- Webhook endpoint for automated data ingestion
- Supports Plaud and Fathom sources
- Duplicate detection by sourceId
- Automatic tag assignment (sectors/jurisdictions)
- Automated task extraction from action items

---

## Technical Architecture

### Stack
- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express + tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth
- **Testing**: Vitest

### Database Schema

**meetings** - Core intelligence reports
- Meeting metadata (date, participants, organizations, jurisdictions)
- Executive summaries and strategic highlights
- Opportunities, risks, and key quotes
- Full transcripts
- Source tracking (Plaud/Fathom/Manual)

**tasks** - Action items
- Task details (title, description, priority)
- Assignment and status tracking
- Meeting associations
- Auto-generated vs manual flags

**tags** - Sector and jurisdiction classification
- Sector tags (OTC Liquidity, Digital Assets, Real Estate, etc.)
- Jurisdiction tags (UAE, USA, GCC, etc.)

**meeting_tags** - Many-to-many relationship between meetings and tags

**users** - Team member accounts
- OAuth integration
- Role-based permissions

---

## Data Ingestion

### Webhook Endpoint

**URL**: `https://your-domain.manus.space/api/trpc/ingestion.webhook`

**Method**: POST

**Authentication**: Public endpoint (consider adding API key authentication for production)

### Payload Format

```json
{
  "meetingDate": "2026-02-15T10:00:00Z",
  "primaryLead": "Kyle",
  "participants": ["Kyle", "Client Name"],
  "organizations": ["Company Name"],
  "jurisdictions": ["UAE", "USA"],
  "executiveSummary": "5-8 sentence strategic overview...",
  "strategicHighlights": [
    "Deal structure signal 1",
    "Capital reference 2"
  ],
  "opportunities": [
    "Monetization angle 1",
    "Partnership opportunity 2"
  ],
  "risks": [
    "Regulatory exposure",
    "Counterparty opacity"
  ],
  "keyQuotes": [
    "Important commitment statement"
  ],
  "fullTranscript": "Complete meeting transcript...",
  "sourceType": "plaud",
  "sourceId": "unique-recording-id",
  "sectors": ["OTC Liquidity", "Digital Assets"],
  "jurisdictionTags": ["UAE"],
  "actionItems": [
    {
      "title": "Follow up with client",
      "description": "Send proposal by Friday",
      "priority": "high",
      "assignedTo": "Kyle",
      "dueDate": "2026-02-20"
    }
  ]
}
```

### Supported Source Types
- `plaud` - Plaud device recordings
- `fathom` - Fathom meeting transcriptions
- `manual` - Manually entered reports

### Duplicate Detection
The system automatically detects duplicates using the `sourceId` field. If a meeting with the same `sourceId` already exists, the webhook will return:

```json
{
  "success": false,
  "reason": "duplicate",
  "meetingId": 123
}
```

---

## Integration with Existing Automation

The portal is designed to integrate seamlessly with the existing Plaud/Fathom automation pipeline documented in the OmniScope project folder:

1. **Plaud/Fathom** → Recording captured
2. **Zapier/n8n** → Triggers on new recording
3. **Manus AI** → Processes recording and generates structured intelligence report
4. **Webhook** → Sends structured data to portal ingestion endpoint
5. **Portal** → Stores meeting, creates tasks, assigns tags
6. **Google Drive** → Original reports also archived (parallel process)

---

## Development

### Prerequisites
- Node.js 22+
- pnpm
- MySQL/TiDB database

### Setup
```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Run development server
pnpm dev

# Run tests
pnpm test
```

### Environment Variables
All required environment variables are automatically injected by the Manus platform:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - Manus OAuth app ID
- `OAUTH_SERVER_URL` - OAuth backend URL
- `VITE_OAUTH_PORTAL_URL` - OAuth frontend URL

---

## Testing

The portal includes comprehensive vitest tests covering:
- Meeting CRUD operations
- Task management
- Search functionality
- Data ingestion and validation
- Duplicate detection
- Tag management
- Authentication flows

Run tests with:
```bash
pnpm test
```

All 12 tests pass successfully.

---

## Deployment

The portal is hosted on Manus infrastructure with built-in:
- SSL/TLS encryption
- Automatic scaling
- Database backups
- Custom domain support

To deploy:
1. Create a checkpoint via the Manus UI
2. Click "Publish" in the Management UI
3. Configure custom domain (optional)

---

## Security Considerations

### Current Implementation
- ✅ Manus OAuth authentication
- ✅ Protected tRPC procedures
- ✅ Input validation with Zod schemas
- ✅ SQL injection protection via Drizzle ORM
- ✅ HTTPS enforced

### Recommended Enhancements
- [ ] Add API key authentication for webhook endpoint
- [ ] Implement rate limiting on ingestion endpoint
- [ ] Add audit logging for sensitive operations
- [ ] Restrict OAuth to @omniscopex.ae domain only
- [ ] Implement row-level security for multi-tenant scenarios

---

## Future Enhancements

### Planned Features
- Daily and weekly intelligence summary views
- Advanced analytics and trend analysis
- Export reports to PDF
- Email notifications for new action items
- Integration with calendar for meeting scheduling
- Mobile-responsive design improvements
- Real-time collaboration features

### Integration Opportunities
- Direct Plaud API integration (when OAuth becomes available)
- Fathom API integration
- Slack notifications for high-priority tasks
- CRM integration for client tracking
- Document management system integration

---

## Support

For technical support or feature requests, contact the OmniScope development team.

**Portal Version**: 1.0.0  
**Last Updated**: February 15, 2026  
**Maintained By**: OmniScope Group
