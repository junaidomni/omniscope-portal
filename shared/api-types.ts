/**
 * Shared API-level type contracts.
 *
 * These interfaces define the shapes returned by tRPC procedures and consumed
 * by the frontend.  They sit between the raw Drizzle row types (DB layer) and
 * the React components (UI layer), giving both sides a stable contract.
 *
 * Rules:
 *  1. Every router that returns entity data should map DB rows → one of these types.
 *  2. Frontend components should import from here, never from drizzle/schema directly.
 *  3. When adding a new feature (messaging, newsletters, etc.), define its API types here first.
 */

// ---------------------------------------------------------------------------
// Common / Utility
// ---------------------------------------------------------------------------

/** Standard paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Standard mutation result */
export interface MutationResult {
  success: boolean;
  message?: string;
}

/** Org-scoped query filter base */
export interface OrgFilter {
  orgId?: number | null;
}

/** Priority levels used across tasks and items */
export type Priority = "low" | "medium" | "high";

/** Approval status used for contacts & companies */
export type ApprovalStatus = "pending" | "approved" | "rejected";

/** Task status */
export type TaskStatus = "open" | "in_progress" | "completed";

/** Relationship health */
export type RelationshipHealth = "strong" | "warm" | "cold" | "new";

/** Contact category */
export type ContactCategory = "client" | "prospect" | "partner" | "vendor" | "other";

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

/** Lightweight task card shown in triage, operations, and dashboards */
export interface TaskCard {
  id: number;
  title: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date | string | null;
  assignedName: string | null;
  category: string | null;
}

/** Extended task with full details */
export interface TaskDetail extends TaskCard {
  description: string | null;
  notes: string | null;
  meetingId: number | null;
  meetingTitle: string | null;
  source: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/** Contact card shown in lists and relationship views */
export interface ContactCard {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  title: string | null;
  approvalStatus: ApprovalStatus;
  relationshipHealth: RelationshipHealth | null;
  category: ContactCategory | null;
  isStarred: boolean;
  meetingCount?: number;
  lastMeetingDate?: Date | string | null;
}

/** Full contact profile */
export interface ContactProfile extends ContactCard {
  dateOfBirth: string | null;
  address: string | null;
  website: string | null;
  linkedin: string | null;
  source: string | null;
  notes: ContactNote[];
  meetings: MeetingSummary[];
  tasks: TaskCard[];
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

/** Contact note */
export interface ContactNote {
  id: number;
  content: string;
  authorName: string | null;
  createdAt: Date | string | null;
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

/** Company card shown in lists */
export interface CompanyCard {
  id: number;
  name: string;
  sector: string | null;
  jurisdiction: string | null;
  website: string | null;
  approvalStatus: ApprovalStatus;
  contactCount?: number;
}

/** Full company profile */
export interface CompanyProfile extends CompanyCard {
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contacts: ContactCard[];
  meetings: MeetingSummary[];
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

// ---------------------------------------------------------------------------
// Meeting / Intelligence
// ---------------------------------------------------------------------------

/** Meeting summary shown in lists and triage */
export interface MeetingSummary {
  id: number;
  title: string;
  meetingDate: Date | string | null;
  primaryLead: string | null;
  executiveSummary: string | null;
  source: string | null;
  tags?: TagItem[];
  participantCount?: number;
}

/** Full meeting detail */
export interface MeetingDetail extends MeetingSummary {
  transcript: string | null;
  rawTranscript: string | null;
  keyDecisions: string | null;
  actionItems: string | null;
  participants: string | null;
  contacts: ContactCard[];
  tasks: TaskCard[];
  categories: string[];
  tags: TagItem[];
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

/** Tag item */
export interface TagItem {
  id: number;
  name: string;
  type: "sector" | "jurisdiction";
}

// ---------------------------------------------------------------------------
// Triage Feed
// ---------------------------------------------------------------------------

/** Complete triage feed response */
export interface TriageFeed {
  userName: string;
  greeting: string;
  summary: TriageSummary;
  overdueTasks: TaskCard[];
  todayTasks: TaskCard[];
  highPriorityTasks: TaskCard[];
  starredEmails: StarredEmail[];
  pendingContacts: PendingContact[];
  pendingCompanies: PendingCompany[];
  recentMeetings: MeetingSummary[];
  tomorrowTasks: TaskCard[];
  weekTasks: TaskCard[];
  completedTodayTasks: CompletedTask[];
  pendingSuggestions: PendingSuggestion[];
}

export interface TriageSummary {
  totalOpen: number;
  totalOverdue: number;
  totalHighPriority: number;
  completedToday: number;
  totalStarred: number;
  totalPendingApprovals: number;
}

export interface StarredEmail {
  threadId: string;
  starLevel: number;
  subject: string | null;
  fromName: string | null;
  fromEmail: string | null;
}

export interface PendingContact {
  id: number;
  name: string;
  email: string | null;
  organization: string | null;
  title: string | null;
  source: string | null;
  createdAt: Date | string | null;
}

export interface PendingCompany {
  id: number;
  name: string;
  sector: string | null;
}

export interface CompletedTask {
  id: number;
  title: string;
  priority: Priority;
  completedAt: Date | string | null;
  assignedName: string | null;
  category: string | null;
}

export interface PendingSuggestion {
  id: number;
  type: string;
  status: string;
  contactId: number | null;
  contactName: string | null;
  companyId: number | null;
  companyName: string | null;
  suggestedCompanyId: number | null;
  suggestedCompanyName: string | null;
  suggestedData: Record<string, unknown> | null;
  reason: string | null;
  confidence: number | null;
  createdAt: Date | string | null;
}

// ---------------------------------------------------------------------------
// Analytics / Dashboard
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  totalMeetings: number;
  totalContacts: number;
  totalTasks: number;
  totalCompanies: number;
  openTasks: number;
  completedTasks: number;
  meetingsThisWeek: number;
  meetingsLastWeek: number;
  topSectors: { name: string; count: number }[];
  topJurisdictions: { name: string; count: number }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null;
  createdAt: Date | string | null;
  userName: string | null;
}

// ---------------------------------------------------------------------------
// Email / Communications
// ---------------------------------------------------------------------------

export interface EmailThread {
  threadId: string;
  subject: string;
  snippet: string;
  fromName: string;
  fromEmail: string;
  date: number;
  isUnread: boolean;
  isStarred: boolean;
  messageCount: number;
  hasAttachments: boolean;
  labelIds: string[];
  hasUnsubscribe: boolean;
}

export interface EmailMessage {
  messageId: string;
  threadId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  toRecipients: string[];
  ccRecipients: string[];
  date: number;
  body: string;
  snippet: string;
  hasAttachments: boolean;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

// ---------------------------------------------------------------------------
// Document Vault
// ---------------------------------------------------------------------------

export interface VaultDocument {
  id: number;
  title: string;
  description: string | null;
  mimeType: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  folderId: number | null;
  folderName: string | null;
  status: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export interface VaultFolder {
  id: number;
  name: string;
  parentId: number | null;
  documentCount?: number;
}

// ---------------------------------------------------------------------------
// HR / Employee
// ---------------------------------------------------------------------------

export interface EmployeeCard {
  id: number;
  name: string;
  email: string | null;
  position: string | null;
  department: string | null;
  status: string;
  startDate: Date | string | null;
}

// ---------------------------------------------------------------------------
// Integration / Settings
// ---------------------------------------------------------------------------

export interface IntegrationStatus {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  lastSyncAt: Date | string | null;
  status: string;
}

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Future: Messaging (placeholder for upcoming feature)
// ---------------------------------------------------------------------------

export interface MessageThread {
  id: number;
  subject: string;
  participants: { id: number; name: string; avatar?: string }[];
  lastMessage: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
}

export interface Message {
  id: number;
  threadId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: Date | string;
  readAt: Date | string | null;
  attachments: { name: string; url: string; mimeType: string }[];
}

// ---------------------------------------------------------------------------
// Future: Newsletter (placeholder for upcoming feature)
// ---------------------------------------------------------------------------

export interface Newsletter {
  id: number;
  title: string;
  subject: string;
  status: "draft" | "scheduled" | "sent";
  recipientCount: number;
  scheduledAt: Date | string | null;
  sentAt: Date | string | null;
  openRate: number | null;
  clickRate: number | null;
}

export interface NewsletterRecipient {
  id: number;
  email: string;
  name: string | null;
  status: "subscribed" | "unsubscribed" | "bounced";
  subscribedAt: Date | string;
}
