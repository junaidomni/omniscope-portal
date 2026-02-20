# OmniScope Super Admin Organization Hub — Architecture Blueprint

**Prepared for:** Jake Qureshi, OmniScope  
**Date:** February 20, 2026  
**Classification:** Internal Strategy Document  
**Status:** Brainstorm / Pre-Implementation

---

## Executive Summary

When a user clicks **"All Organizations"** in the OmniScope sidebar, the entire application shell should transform. The current workspace-level navigation (Command Center, Intelligence, Communications, Operations, Relationships) disappears and is replaced by a **system-level Super Admin Hub** — a completely separate navigation structure designed for managing the platform across all organizations, users, billing, compliance, and infrastructure.

This is not a page within the existing workspace. It is a **parallel application shell** that shares the same codebase and authentication but presents an entirely different interface, modeled after how Stripe Organizations [1], Notion's Admin Console [2], and Slack Enterprise Grid [3] handle the distinction between "working inside a workspace" and "managing the platform."

The core architectural principle is **one codebase, one deployment, universal upgrades** — every feature built once is instantly available to every org, with visibility controlled through feature flags and plan tiers.

---

## The Two-Shell Architecture

The fundamental UX concept is that OmniScope operates in two distinct modes, each with its own sidebar, navigation, and content area. The user switches between them via the org switcher dropdown in the top-left corner.

| Aspect | Workspace Mode (Current) | Super Admin Hub (New) |
|--------|--------------------------|----------------------|
| **Trigger** | Click a specific org name (e.g., "OmniScope") | Click "All Organizations" |
| **Sidebar Navigation** | Command Center, Intelligence, Communications, Operations, Relationships, Ask Omni, Settings, HR Hub, Admin | Dashboard, Organizations, People, Integrations, Billing, Security, Analytics, Audit Log, Feature Flags, Platform Settings |
| **Data Scope** | Filtered to the selected organization | Aggregated across all organizations |
| **Target User** | Day-to-day operator within one workspace | Platform owner / super admin managing the entire ecosystem |
| **Design Language** | OmniScope black-gold with org-specific accent color | Elevated institutional black-gold with platinum/silver accents to visually distinguish the admin layer |

This mirrors how Notion handles it: clicking "Manage Organization" in the workspace switcher opens an entirely separate admin console with its own navigation categories (General, People, Security, Data & Compliance, Analytics) [2]. Stripe does the same — the Organization-level dashboard shows cross-account metrics, unified team management, and consolidated reporting that simply do not exist at the individual account level [1].

---

## Super Admin Hub — Navigation Structure

The Super Admin sidebar should contain the following sections, organized by function. Each section is described in detail below.

### Sidebar Layout

```
┌─────────────────────────────┐
│  [OmniScope Logo]           │
│  ▼ All Organizations        │
│                             │
│  ── OVERVIEW ──             │
│  ◈ Dashboard                │
│  ◈ Organizations            │
│                             │
│  ── PEOPLE ──               │
│  ◈ Team Members             │
│  ◈ Roles & Permissions      │
│  ◈ Invitations              │
│                             │
│  ── PLATFORM ──             │
│  ◈ Integrations & API Keys  │
│  ◈ Feature Flags            │
│  ◈ Templates & Workflows    │
│                             │
│  ── FINANCE ──              │
│  ◈ Billing & Plans          │
│  ◈ Usage & Quotas           │
│                             │
│  ── GOVERNANCE ──           │
│  ◈ Security & Compliance    │
│  ◈ Audit Log                │
│  ◈ Data & Exports           │
│                             │
│  ── INSIGHTS ──             │
│  ◈ Analytics                │
│  ◈ Platform Health          │
│                             │
│  ── TOOLS ──                │
│  ◈ Ask Omni (Admin Mode)    │
│  ◈ Platform Settings        │
│                             │
│  ─────────────────────      │
│  [User Profile / Sign Out]  │
└─────────────────────────────┘
```

---

## Section-by-Section Feature Map

### 1. Dashboard (Home)

The Super Admin Dashboard is the landing page when entering the hub. It provides a **bird's-eye view** of the entire platform, aggregating key metrics across all organizations.

| Widget | Description | Data Source |
|--------|-------------|-------------|
| **Organization Overview** | Total orgs, active vs. suspended, plan distribution (starter/professional/enterprise) | `organizations` + `accounts` tables |
| **People Summary** | Total users across all orgs, active sessions, pending invitations | `users` + `orgMemberships` + `invitations` tables |
| **Activity Heatmap** | Platform-wide activity over the last 30 days (meetings logged, tasks completed, emails sent) | `activityLog` table |
| **Revenue / Plan Breakdown** | MRR by plan tier, upgrade/downgrade trends | `accounts.plan` + future billing table |
| **Integration Health** | Connected vs. errored integrations across all orgs, most-used integrations | `integrations` table |
| **Quick Actions** | Create org, invite user, toggle feature, view audit log | Navigation shortcuts |

This is analogous to Stripe Organizations' refreshed home page that "surfaces key business information across all your accounts, such as gross volume or the number of refunded payments" [1]. The goal is to answer the question: **"How is my platform doing right now?"** in a single glance.

### 2. Organizations

This page already exists in a basic form. It should be elevated to become the central management hub for all workspaces.

**List View** — A table/grid of all organizations with sortable columns:

| Column | Description |
|--------|-------------|
| Name + Logo | Org name with avatar/initials |
| Plan | Inherited from parent account |
| Members | Count of active members |
| Status | Active / Suspended / Archived |
| Industry | Vertical classification |
| Integrations | Count of connected integrations |
| Created | Date created |
| Actions | Switch to, Settings, Suspend, Archive |

**Organization Detail View** — Clicking into an org opens a sub-page with tabs:

| Tab | Contents |
|-----|----------|
| **Overview** | Org stats, recent activity, health score |
| **Members** | Users in this org, their roles, last active |
| **Integrations** | Connected services for this org, API keys, status |
| **Settings** | Name, slug, logo, accent color, timezone, industry |
| **Feature Flags** | Which features are enabled/disabled for this org |
| **Data** | Storage usage, record counts, export options |

### 3. Team Members (People)

A unified view of every user across all organizations — the equivalent of Notion's "Manage Members" section where "you can see everyone in your organization and which workspaces they belong to" [2].

**Key capabilities:**

The member list should show each user once (even if they belong to multiple orgs) with columns for name, email, orgs they belong to, their role in each, last active timestamp, and account status. Clicking into a user opens a profile showing their cross-org memberships, activity history, and permissions — similar to how Notion lets you "click into any member to see their profile across all workspaces at once" [2].

**Bulk operations** should include: invite to additional orgs, change role across orgs, deactivate user, export member list.

### 4. Roles & Permissions

A dedicated page for managing the role hierarchy and what each role can do. The existing role enum (`super_admin`, `account_owner`, `org_admin`, `manager`, `member`, `viewer`) should be displayed as a visual hierarchy with a permissions matrix.

| Permission | Super Admin | Account Owner | Org Admin | Manager | Member | Viewer |
|------------|:-----------:|:-------------:|:---------:|:-------:|:------:|:------:|
| Access Super Admin Hub | ✓ | ✓ | — | — | — | — |
| Create/Delete Organizations | ✓ | ✓ | — | — | — | — |
| Manage All Users | ✓ | ✓ | — | — | — | — |
| Manage Org Users | ✓ | ✓ | ✓ | — | — | — |
| Manage Integrations | ✓ | ✓ | ✓ | — | — | — |
| Toggle Features | ✓ | ✓ | ✓ | — | — | — |
| Create/Edit Records | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Delete Records | ✓ | ✓ | ✓ | ✓ | — | — |
| View Records | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export Data | ✓ | ✓ | ✓ | ✓ | — | — |
| View Audit Log | ✓ | ✓ | ✓ | — | — | — |
| Manage Billing | ✓ | ✓ | — | — | — | — |

In the future, consider adding **custom roles** — but for Phase 1, the six built-in roles are sufficient.

### 5. Invitations

A centralized invitation management page showing all pending, accepted, and expired invitations across all organizations. This is where the admin can:

Send new invitations (select org, select role, enter email), resend expired invitations, revoke pending invitations, and see invitation analytics (acceptance rate, average time to accept).

### 6. Integrations & API Keys

**This is the critical section Jake mentioned** — each org needs to connect its own integrations (Gmail API, Calendar, Fathom, etc.) with clear instructions and validation so the workspace is fully functional from day one.

**Platform-Level View:**

A matrix showing which integrations are connected across which orgs, with health status indicators. This answers the question: "Which of my orgs are fully configured and which are missing critical integrations?"

| Integration | OmniScope | Kinetix | Pinnacle | Status |
|-------------|:---------:|:-------:|:--------:|--------|
| Gmail / Google | ✓ | ✓ | — | 2/3 connected |
| Fathom | ✓ | — | — | 1/3 connected |
| Calendar | ✓ | ✓ | ✓ | All connected |
| Slack | — | — | — | Not configured |

**Per-Org Integration Setup:**

When drilling into an org's integrations, the admin should see a guided setup flow for each integration type:

- **OAuth-based** (Gmail, Calendar, Google Drive): One-click connect with OAuth flow, scopes displayed, token status
- **API Key-based** (Fathom, custom APIs): Input field with validation, test connection button, key rotation
- **Webhook-based** (Slack, Discord, custom): Generated webhook URL, delivery status, retry controls

**API Key Management:**

Each org should be able to generate its own API keys for external access to OmniScope's data. This page manages: key generation with scopes, key rotation, usage analytics per key, and revocation.

### 7. Feature Flags

The existing `featureToggles` table already supports org-level feature flags. This page provides a visual interface for managing them.

**The display should be a matrix** — features on the Y-axis, organizations on the X-axis, with toggle switches at each intersection. This is the mechanism that enables the "deploy once, enable selectively" model discussed earlier.

| Feature | Global Default | OmniScope | Kinetix | Pinnacle |
|---------|:--------------:|:---------:|:-------:|:--------:|
| AI Insights | ✓ On | ✓ | ✓ | ✓ |
| Document Signing | ✓ On | ✓ | ✓ | — |
| HR Module | — Off | ✓ | — | — |
| Mail Analytics | ✓ On | ✓ | ✓ | ✓ |
| Pipeline View | — Beta | ✓ | — | — |

Grouped by category (Core, Communication, Intelligence, Operations, Experimental) matching the existing `featureToggles.category` enum.

### 8. Templates & Workflows

A library of templates that can be deployed across organizations — meeting templates, document templates, email templates, task workflows. The admin creates templates at the platform level, then enables them per-org or globally.

### 9. Billing & Plans

Account-level billing management showing: current plan per account, plan limits (max orgs, max users per org), upgrade/downgrade controls, payment history, and invoice generation.

The existing `accounts` table has `plan`, `maxOrganizations`, and `maxUsersPerOrg` fields. This page makes those manageable through a UI rather than direct database edits.

### 10. Usage & Quotas

Visual representation of resource consumption across the platform: storage used per org, API call volume, meeting recordings stored, documents created, active users vs. seat limits. Progress bars and threshold alerts when approaching limits.

### 11. Security & Compliance

Centralized security controls that cascade down to all organizations, following the Notion model where "you'll be able to set and manage security settings across all your workspaces" [2].

Key controls include: password policies, session timeout settings, IP allowlisting, two-factor authentication enforcement, data retention policies, and export restrictions. Each setting should have a scope selector (Global / Per-Org) so the admin can enforce platform-wide policies while allowing org-level overrides where appropriate.

### 12. Audit Log

An enhanced version of the existing `activityLog` table, presented as a searchable, filterable timeline of all actions across all organizations. Filters should include: date range, organization, user, action type, and entity type.

This is critical for compliance — the ability to answer "who did what, when, and in which org" is a regulatory requirement for financial infrastructure platforms.

### 13. Data & Exports

Bulk data management: export all data for an org (GDPR compliance), import data into a new org, cross-org data migration tools, and backup scheduling.

### 14. Analytics

Platform-wide analytics aggregating data across all organizations: user engagement trends, feature adoption rates, most active orgs, growth metrics, and content performance. This mirrors Notion's Analytics tab where "org owners track page popularity and views across multiple workspaces" [2].

### 15. Platform Health

System status dashboard showing: API response times, integration sync status, database performance, error rates, and uptime metrics. This is the operational monitoring view for ensuring the platform is running smoothly.

### 16. Ask Omni (Admin Mode)

The existing AI assistant, but operating in admin context — able to answer questions about cross-org data, generate platform-wide reports, and execute admin commands through natural language.

### 17. Platform Settings

Global configuration that applies to the entire platform: default branding, default timezone, default feature flag states for new orgs, email notification templates, and platform-wide announcement banners.

---

## Onboarding Wizard — Integration Setup Step

The existing 4-step onboarding wizard (Company → Branding → Details → Launch) needs a **5th step: Integrations & API Keys**. This step should appear between "Details" and "Launch" so the org is fully configured before going live.

**Step 5: Connect Your Tools**

The wizard should present the essential integrations in priority order:

| Priority | Integration | Type | Why It Matters |
|----------|-------------|------|----------------|
| **Critical** | Google Workspace (Gmail + Calendar) | OAuth | Core communication and scheduling |
| **Critical** | Fathom / Plaud | API Key | Meeting intelligence — the core product |
| **Important** | Slack / Teams | OAuth/Webhook | Team communication channel |
| **Optional** | QuickBooks / Stripe | OAuth | Financial data integration |
| **Optional** | Custom API | API Key | User-defined integrations |

Each integration card should show: the service name and icon, a brief description of what it enables, a "Connect" button (OAuth) or "Enter API Key" field, a validation indicator (green check / red X / pending), and a "Skip for now" option.

The wizard should track completion percentage and warn if critical integrations are skipped: "Your workspace will have limited functionality without Gmail and Fathom connected. You can always set these up later in Settings → Integrations."

---

## Technical Implementation Strategy

### Phase 1: Shell Architecture (Foundation)

The most important technical decision is how the two shells coexist. The recommended approach:

**A new `AdminLayout` component** (parallel to `PortalLayout`) that renders when the user is in "All Organizations" mode. The `OrgContext` already tracks whether `currentOrg` is `null` (all orgs mode) or a specific org. The `App.tsx` router should check this context and render either `PortalLayout` with workspace routes or `AdminLayout` with admin routes.

```
App.tsx
├── OrgContext.currentOrg !== null → PortalLayout (workspace routes)
│   ├── /                    → Command Center
│   ├── /intelligence        → Intelligence
│   ├── /communications      → Communications
│   ├── /operations          → Operations
│   ├── /relationships       → Relationships
│   └── ...existing routes
│
└── OrgContext.currentOrg === null → AdminLayout (admin routes)
    ├── /admin/dashboard     → Super Admin Dashboard
    ├── /admin/organizations → Organizations List
    ├── /admin/org/:id       → Organization Detail
    ├── /admin/people        → Team Members
    ├── /admin/roles         → Roles & Permissions
    ├── /admin/invitations   → Invitations
    ├── /admin/integrations  → Integrations Matrix
    ├── /admin/features      → Feature Flags
    ├── /admin/billing       → Billing & Plans
    ├── /admin/security      → Security & Compliance
    ├── /admin/audit          → Audit Log
    ├── /admin/analytics     → Analytics
    ├── /admin/health        → Platform Health
    └── /admin/settings      → Platform Settings
```

### Phase 2: Data Layer

Most of the data already exists in the schema. The key additions needed:

| New Table / Field | Purpose |
|-------------------|---------|
| `orgIntegrations` | Per-org integration instances (currently `integrations` is global) |
| `apiKeys` | Per-org API keys for external access |
| `platformSettings` | Global platform configuration (not per-user, not per-org) |
| `billingEvents` | Payment and plan change history |
| `securityPolicies` | Cascading security rules (global → org → user) |

### Phase 3: Cross-Org Queries

New tRPC procedures that aggregate data across organizations — total users, total meetings, integration health matrix, feature flag matrix. These are admin-only procedures gated by `super_admin` or `account_owner` role.

### Phase 4: Feature Flag Engine

Enhance the existing `featureToggles` system to support: global defaults, per-org overrides, per-plan defaults (all Enterprise orgs get feature X), and gradual rollout percentages.

---

## Design Direction

The Super Admin Hub should feel **elevated** compared to the workspace view — like stepping from the trading floor into the executive suite. Both use the OmniScope black-gold language, but the admin hub should incorporate:

**Visual Differentiation:** Subtle platinum/silver accents alongside gold to signal "you are at the platform level, not inside a workspace." Slightly wider spacing, larger typography for section headers, and more generous use of white space to convey authority and clarity.

**Information Density:** Admin views inherently need to show more data. Use well-structured tables with sortable columns, collapsible sections, and progressive disclosure (summary → detail on click). Reference Linear's dashboard approach — clean data tables with minimal chrome.

**Status Communication:** Heavy use of status indicators (green/amber/red dots), progress bars for quotas, and health badges. The admin needs to see at a glance what needs attention.

**Responsive but Desktop-First:** The Super Admin Hub is primarily a desktop experience. Mobile should be functional but the design should optimize for wide screens with multi-column layouts.

---

## Implementation Priority

The recommended build order, based on dependency chains and immediate value:

| Priority | Section | Rationale |
|----------|---------|-----------|
| **P0** | Shell Architecture (AdminLayout + routing) | Everything else depends on this |
| **P0** | Dashboard (basic) | Landing page for the hub |
| **P0** | Organizations (enhanced list + detail) | Core management function |
| **P1** | Integrations & API Keys | Jake's explicit requirement — orgs need to be functional from day one |
| **P1** | Onboarding Wizard Step 5 | Ensures new orgs are properly configured |
| **P1** | Team Members | Cross-org user management |
| **P1** | Feature Flags UI | Enables the "deploy once, enable selectively" model |
| **P2** | Roles & Permissions | Visual permissions matrix |
| **P2** | Audit Log (enhanced) | Compliance requirement |
| **P2** | Billing & Plans | Account management |
| **P3** | Security & Compliance | Cascading policies |
| **P3** | Analytics | Platform-wide insights |
| **P3** | Platform Health | Operational monitoring |
| **P3** | Templates & Workflows | Content management |

---

## References

[1] Stripe. "Stripe Organizations: A new way to power the world's most complex businesses." Stripe Blog, May 14, 2024. https://stripe.com/blog/stripe-organizations-powering-the-worlds-most-complex-businesses

[2] Notion. "Everything you need to know about setting up and managing an organization in Notion." Notion Help Center. https://www.notion.com/help/guides/everything-about-setting-up-and-managing-an-organization-in-notion

[3] Slack. "Guide to the Slack admin dashboard." Slack Help Center. https://slack.com/help/articles/115005594006-Guide-to-the-Slack-admin-dashboard

[4] HubSpot. "Set up multi-account management." HubSpot Knowledge Base. https://knowledge.hubspot.com/account-management/set-up-multi-account-management
