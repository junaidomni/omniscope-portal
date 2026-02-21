/**
 * Cross-Org Digest Generator
 * 
 * Generates daily and weekly intelligence digests that aggregate data
 * across all organizations under a single account. Account owners see
 * a consolidated view; org members see their single-org digest.
 * 
 * Architecture:
 *   account → [org1, org2, org3] → aggregate stats per org → unified report
 */

import * as analytics from "./analytics";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrgDigestSection {
  orgId: number;
  orgName: string;
  orgSlug: string;
  orgAccentColor: string | null;
  // Metrics
  meetingCount: number;
  newContactsCount: number;
  tasksCreated: number;
  tasksCompleted: number;
  openTasksCount: number;
  highPriorityTasks: number;
  // Highlights
  meetingSummaries: Array<{
    title: string;
    participants: string[];
    summary: string;
    time: string;
  }>;
  topSectors: string[];
  topJurisdictions: string[];
  // Upcoming
  upcomingTasks: Array<{
    title: string;
    dueDate: string | null;
    priority: string;
  }>;
}

export interface DigestReport {
  type: "daily" | "weekly";
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  accountName: string;
  totalOrgs: number;
  // Aggregate metrics
  totalMeetings: number;
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalOpenTasks: number;
  totalNewContacts: number;
  // Per-org breakdown
  orgSections: OrgDigestSection[];
  // AI-generated executive summary
  executiveSummary: string | null;
  // Formatted output
  markdownContent: string;
  htmlContent: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Core Generator ─────────────────────────────────────────────────────────

/**
 * Generate a daily digest for a single org.
 */
async function generateOrgDailySection(
  orgId: number,
  orgName: string,
  orgSlug: string,
  orgAccentColor: string | null,
  date: Date
): Promise<OrgDigestSection> {
  try {
    const summary = await analytics.getDailySummary(date, orgId);
    
    // Get open tasks count
    const allTasks = await db.getAllTasks({ orgId, status: "open" });
    const highPriority = allTasks.filter((t: any) => t.priority === "high" || t.priority === "urgent");
    
    // Get upcoming tasks (next 3 days)
    const upcoming = allTasks
      .filter((t: any) => t.dueDate)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
    
    // Get new contacts today
    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(date);
    todayEnd.setHours(23, 59, 59, 999);
    const allContacts = await db.getAllContacts(orgId);
    const newContacts = allContacts.filter((c: any) => {
      const created = new Date(c.createdAt);
      return created >= todayStart && created <= todayEnd;
    });

    return {
      orgId,
      orgName,
      orgSlug,
      orgAccentColor,
      meetingCount: summary.meetingCount,
      newContactsCount: newContacts.length,
      tasksCreated: summary.tasksCreated,
      tasksCompleted: summary.tasksCompleted,
      openTasksCount: allTasks.length,
      highPriorityTasks: highPriority.length,
      meetingSummaries: summary.meetings.map((m: any) => ({
        title: m.participants.join(", "),
        participants: m.participants,
        summary: m.summary,
        time: m.time,
      })),
      topSectors: summary.topSectors,
      topJurisdictions: summary.topJurisdictions,
      upcomingTasks: upcoming.map((t: any) => ({
        title: t.title,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : null,
        priority: t.priority || "normal",
      })),
    };
  } catch (err) {
    console.error(`[Digest] Error generating section for org ${orgId}:`, err);
    return {
      orgId,
      orgName,
      orgSlug,
      orgAccentColor,
      meetingCount: 0,
      newContactsCount: 0,
      tasksCreated: 0,
      tasksCompleted: 0,
      openTasksCount: 0,
      highPriorityTasks: 0,
      meetingSummaries: [],
      topSectors: [],
      topJurisdictions: [],
      upcomingTasks: [],
    };
  }
}

/**
 * Generate a weekly digest section for a single org.
 */
async function generateOrgWeeklySection(
  orgId: number,
  orgName: string,
  orgSlug: string,
  orgAccentColor: string | null,
  weekStart: Date
): Promise<OrgDigestSection> {
  try {
    const summary = await analytics.getWeeklySummary(weekStart, orgId);
    
    const allTasks = await db.getAllTasks({ orgId, status: "open" });
    const highPriority = allTasks.filter((t: any) => t.priority === "high" || t.priority === "urgent");
    const upcoming = allTasks
      .filter((t: any) => t.dueDate)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
    
    const allContacts = await db.getAllContacts(orgId);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const newContacts = allContacts.filter((c: any) => {
      const created = new Date(c.createdAt);
      return created >= weekStart && created < weekEnd;
    });

    return {
      orgId,
      orgName,
      orgSlug,
      orgAccentColor,
      meetingCount: summary.totalMeetings,
      newContactsCount: newContacts.length,
      tasksCreated: summary.tasksCreated,
      tasksCompleted: summary.tasksCompleted,
      openTasksCount: allTasks.length,
      highPriorityTasks: highPriority.length,
      meetingSummaries: summary.dailyBreakdown
        .flatMap((d: any) => d.meetings || [])
        .slice(0, 10)
        .map((m: any) => ({
          title: m.participants?.join(", ") || "Meeting",
          participants: m.participants || [],
          summary: m.summary || "",
          time: m.time || "",
        })),
      topSectors: summary.topSectors || [],
      topJurisdictions: summary.topJurisdictions || [],
      upcomingTasks: upcoming.map((t: any) => ({
        title: t.title,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : null,
        priority: t.priority || "normal",
      })),
    };
  } catch (err) {
    console.error(`[Digest] Error generating weekly section for org ${orgId}:`, err);
    return {
      orgId, orgName, orgSlug, orgAccentColor,
      meetingCount: 0, newContactsCount: 0, tasksCreated: 0, tasksCompleted: 0,
      openTasksCount: 0, highPriorityTasks: 0, meetingSummaries: [],
      topSectors: [], topJurisdictions: [], upcomingTasks: [],
    };
  }
}

// ─── AI Executive Summary ───────────────────────────────────────────────────

async function generateExecutiveSummary(
  sections: OrgDigestSection[],
  type: "daily" | "weekly"
): Promise<string | null> {
  try {
    const dataSnapshot = sections.map((s) => ({
      org: s.orgName,
      meetings: s.meetingCount,
      tasksCreated: s.tasksCreated,
      tasksCompleted: s.tasksCompleted,
      openTasks: s.openTasksCount,
      highPriority: s.highPriorityTasks,
      newContacts: s.newContactsCount,
      sectors: s.topSectors,
      highlights: s.meetingSummaries.slice(0, 3).map((m) => m.summary).filter(Boolean),
    }));

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are OmniScope's executive intelligence briefing engine. Generate a concise ${type} executive summary for an account owner who manages multiple organizations. Be direct, strategic, and actionable — like a military briefing or Tesla dashboard notification. Use 3-5 bullet points max. No fluff.`,
        },
        {
          role: "user",
          content: `Generate an executive summary for this ${type} digest:\n\n${JSON.stringify(dataSnapshot, null, 2)}`,
        },
      ],
    });

    return response?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("[Digest] AI summary generation failed:", err);
    return null;
  }
}

// ─── Markdown Formatter ─────────────────────────────────────────────────────

function formatDigestMarkdown(report: Omit<DigestReport, "markdownContent" | "htmlContent">): string {
  const { type, accountName, periodStart, periodEnd, orgSections, executiveSummary } = report;
  const title = type === "daily" ? "Daily Intelligence Digest" : "Weekly Intelligence Digest";
  const period = type === "daily"
    ? formatDate(new Date(periodStart))
    : `${formatDateShort(new Date(periodStart))} — ${formatDateShort(new Date(periodEnd))}`;

  let md = `# OmniScope ${title}\n\n`;
  md += `**${accountName}** · ${period}\n\n`;
  md += `---\n\n`;

  // Executive Summary
  if (executiveSummary) {
    md += `## Executive Summary\n\n${executiveSummary}\n\n---\n\n`;
  }

  // Aggregate KPIs
  md += `## Key Metrics\n\n`;
  md += `| Metric | Total |\n`;
  md += `|--------|-------|\n`;
  md += `| Meetings | ${report.totalMeetings} |\n`;
  md += `| Tasks Created | ${report.totalTasksCreated} |\n`;
  md += `| Tasks Completed | ${report.totalTasksCompleted} |\n`;
  md += `| Open Tasks | ${report.totalOpenTasks} |\n`;
  md += `| New Contacts | ${report.totalNewContacts} |\n\n`;

  // Per-org sections
  if (orgSections.length > 1) {
    md += `---\n\n## Organization Breakdown\n\n`;
  }

  for (const section of orgSections) {
    if (orgSections.length > 1) {
      md += `### ${section.orgName}\n\n`;
    }

    // Metrics table
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Meetings | ${section.meetingCount} |\n`;
    md += `| Tasks Created | ${section.tasksCreated} |\n`;
    md += `| Tasks Completed | ${section.tasksCompleted} |\n`;
    md += `| Open Tasks | ${section.openTasksCount} |\n`;
    md += `| High Priority | ${section.highPriorityTasks} |\n`;
    md += `| New Contacts | ${section.newContactsCount} |\n\n`;

    // Sectors
    if (section.topSectors.length > 0) {
      md += `**Active Sectors:** ${section.topSectors.join(", ")}\n\n`;
    }

    // Meeting summaries
    if (section.meetingSummaries.length > 0) {
      md += `**Meeting Highlights:**\n\n`;
      for (const m of section.meetingSummaries.slice(0, 5)) {
        md += `- **${m.title}** (${m.time}): ${m.summary}\n`;
      }
      md += `\n`;
    }

    // Upcoming tasks
    if (section.upcomingTasks.length > 0) {
      md += `**Upcoming Tasks:**\n\n`;
      for (const t of section.upcomingTasks) {
        const priority = t.priority === "high" || t.priority === "urgent" ? " ⚠" : "";
        md += `- ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""}${priority}\n`;
      }
      md += `\n`;
    }

    if (orgSections.length > 1) {
      md += `---\n\n`;
    }
  }

  md += `\n---\n\n*Generated by OmniScope Intelligence Portal*\n*All Markets. One Scope.*\n`;

  return md;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a daily digest for an account (cross-org consolidated).
 */
export async function generateDailyDigest(
  accountId: number,
  date?: Date
): Promise<DigestReport> {
  const targetDate = date || new Date();
  
  // Get account info
  const account = await db.getAccountById(accountId);
  if (!account) throw new Error(`Account ${accountId} not found`);
  
  // Get all orgs under this account
  const orgs = await db.getOrganizationsByAccount(accountId);
  
  // Generate sections for each org in parallel
  const orgSections = await Promise.all(
    orgs
      .filter((o) => o.status === "active")
      .map((o) => generateOrgDailySection(o.id, o.name, o.slug, o.accentColor, targetDate))
  );

  // Aggregate totals
  const totalMeetings = orgSections.reduce((sum, s) => sum + s.meetingCount, 0);
  const totalTasksCreated = orgSections.reduce((sum, s) => sum + s.tasksCreated, 0);
  const totalTasksCompleted = orgSections.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const totalOpenTasks = orgSections.reduce((sum, s) => sum + s.openTasksCount, 0);
  const totalNewContacts = orgSections.reduce((sum, s) => sum + s.newContactsCount, 0);

  // Generate AI executive summary
  const executiveSummary = await generateExecutiveSummary(orgSections, "daily");

  const reportBase = {
    type: "daily" as const,
    generatedAt: new Date().toISOString(),
    periodStart: new Date(targetDate.setHours(0, 0, 0, 0)).toISOString(),
    periodEnd: new Date(targetDate.setHours(23, 59, 59, 999)).toISOString(),
    accountName: account.name,
    totalOrgs: orgs.length,
    totalMeetings,
    totalTasksCreated,
    totalTasksCompleted,
    totalOpenTasks,
    totalNewContacts,
    orgSections,
    executiveSummary,
  };

  const markdownContent = formatDigestMarkdown(reportBase);

  return {
    ...reportBase,
    markdownContent,
    htmlContent: "", // HTML rendering can be added later
  };
}

/**
 * Generate a weekly digest for an account (cross-org consolidated).
 */
export async function generateWeeklyDigest(
  accountId: number,
  weekStart?: Date
): Promise<DigestReport> {
  const targetWeekStart = weekStart || (() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  })();
  
  const weekEnd = new Date(targetWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const account = await db.getAccountById(accountId);
  if (!account) throw new Error(`Account ${accountId} not found`);
  
  const orgs = await db.getOrganizationsByAccount(accountId);
  
  const orgSections = await Promise.all(
    orgs
      .filter((o) => o.status === "active")
      .map((o) => generateOrgWeeklySection(o.id, o.name, o.slug, o.accentColor, targetWeekStart))
  );

  const totalMeetings = orgSections.reduce((sum, s) => sum + s.meetingCount, 0);
  const totalTasksCreated = orgSections.reduce((sum, s) => sum + s.tasksCreated, 0);
  const totalTasksCompleted = orgSections.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const totalOpenTasks = orgSections.reduce((sum, s) => sum + s.openTasksCount, 0);
  const totalNewContacts = orgSections.reduce((sum, s) => sum + s.newContactsCount, 0);

  const executiveSummary = await generateExecutiveSummary(orgSections, "weekly");

  const reportBase = {
    type: "weekly" as const,
    generatedAt: new Date().toISOString(),
    periodStart: targetWeekStart.toISOString(),
    periodEnd: weekEnd.toISOString(),
    accountName: account.name,
    totalOrgs: orgs.length,
    totalMeetings,
    totalTasksCreated,
    totalTasksCompleted,
    totalOpenTasks,
    totalNewContacts,
    orgSections,
    executiveSummary,
  };

  const markdownContent = formatDigestMarkdown(reportBase);

  return {
    ...reportBase,
    markdownContent,
    htmlContent: "",
  };
}

/**
 * Generate a single-org daily digest (for non-account-owners).
 */
export async function generateSingleOrgDailyDigest(
  orgId: number,
  date?: Date
): Promise<DigestReport> {
  const targetDate = date || new Date();
  const org = await db.getOrganizationById(orgId);
  if (!org) throw new Error(`Organization ${orgId} not found`);
  
  const account = await db.getAccountById(org.accountId);
  
  const section = await generateOrgDailySection(
    org.id, org.name, org.slug, org.accentColor, targetDate
  );

  const executiveSummary = await generateExecutiveSummary([section], "daily");

  const reportBase = {
    type: "daily" as const,
    generatedAt: new Date().toISOString(),
    periodStart: new Date(targetDate.setHours(0, 0, 0, 0)).toISOString(),
    periodEnd: new Date(targetDate.setHours(23, 59, 59, 999)).toISOString(),
    accountName: account?.name || org.name,
    totalOrgs: 1,
    totalMeetings: section.meetingCount,
    totalTasksCreated: section.tasksCreated,
    totalTasksCompleted: section.tasksCompleted,
    totalOpenTasks: section.openTasksCount,
    totalNewContacts: section.newContactsCount,
    orgSections: [section],
    executiveSummary,
  };

  const markdownContent = formatDigestMarkdown(reportBase);

  return {
    ...reportBase,
    markdownContent,
    htmlContent: "",
  };
}
