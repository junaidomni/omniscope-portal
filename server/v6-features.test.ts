import { describe, it, expect } from "vitest";

// ============================================================================
// V6 FEATURE TESTS
// Full-page reports, customizable dashboard, transparent logo, kanban drag-drop
// ============================================================================

describe("V6: Full-Page Daily/Weekly Reports", () => {
  it("DailyReport page component file exists", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("client/src/pages/DailyReport.tsx");
    expect(exists).toBe(true);
    const source = fs.readFileSync("client/src/pages/DailyReport.tsx", "utf-8");
    expect(source).toMatch(/export default function/);
  });

  it("WeeklyReport page component file exists", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("client/src/pages/WeeklyReport.tsx");
    expect(exists).toBe(true);
    const source = fs.readFileSync("client/src/pages/WeeklyReport.tsx", "utf-8");
    expect(source).toMatch(/export default function/);
  });

  it("DailyReport has back navigation and email functionality", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/DailyReport.tsx", "utf-8")
    );
    // Has back button/link to meetings
    expect(source).toMatch(/ArrowLeft|back|\/meetings/i);
    // Has email report functionality
    expect(source).toMatch(/EmailReport|email|Send/i);
    // Has full breakdown view toggle
    expect(source).toMatch(/breakdown|Full Breakdown/i);
    // Has meeting summaries
    expect(source).toMatch(/MeetingReportCard|meeting\.title|meetings/i);
    // Has task sections
    expect(source).toMatch(/TaskReportRow|allTasks|tasks/i);
  });

  it("WeeklyReport has back navigation and email functionality", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/WeeklyReport.tsx", "utf-8")
    );
    // Has back button/link
    expect(source).toMatch(/ArrowLeft|back|\/meetings/i);
    // Has email report functionality
    expect(source).toMatch(/EmailReport|email|Send/i);
    // Has full breakdown view
    expect(source).toMatch(/breakdown|Full Breakdown/i);
    // Has daily breakdown
    expect(source).toMatch(/dailyBreakdown|daily/i);
  });
});

describe("V6: Customizable Dashboard", () => {
  it("Dashboard supports widget reordering with localStorage persistence", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/Dashboard.tsx", "utf-8")
    );
    // Has localStorage persistence
    expect(source).toMatch(/localStorage/);
    // Has drag-and-drop functionality
    expect(source).toMatch(/drag|onDragStart|onDragOver|onDrop/i);
    // Has customize button/mode
    expect(source).toMatch(/[Cc]ustomize/);
    // Has reset to default
    expect(source).toMatch(/[Rr]eset|DEFAULT_WIDGET_ORDER/);
  });

  it("Dashboard includes Daily Report and Weekly Report widgets", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/Dashboard.tsx", "utf-8")
    );
    // Has daily report widget
    expect(source).toMatch(/DailyReport|daily.*report|dailySummary/i);
    // Has weekly report widget
    expect(source).toMatch(/WeeklyReport|weekly.*report|weeklySummary/i);
    // Links to full report pages
    expect(source).toMatch(/\/reports\/daily/);
    expect(source).toMatch(/\/reports\/weekly/);
  });

  it("Dashboard has all required widget types", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/Dashboard.tsx", "utf-8")
    );
    // Metric cards
    expect(source).toMatch(/MetricCard|metric/i);
    // Upcoming schedule
    expect(source).toMatch(/Upcoming.*Schedule|upcoming/i);
    // Recent intelligence
    expect(source).toMatch(/Recent.*Intelligence|recent/i);
    // Daily report widget
    expect(source).toMatch(/daily.*report/i);
    // Weekly report widget
    expect(source).toMatch(/weekly.*report/i);
  });
});

describe("V6: App Routes for Reports", () => {
  it("App.tsx has routes for daily and weekly report pages", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/App.tsx", "utf-8")
    );
    // Has route for daily report
    expect(source).toMatch(/\/reports\/daily/);
    // Has route for weekly report
    expect(source).toMatch(/\/reports\/weekly/);
    // Imports the report components
    expect(source).toMatch(/DailyReport/);
    expect(source).toMatch(/WeeklyReport/);
  });
});

describe("V6: Logo Transparency", () => {
  it("Sidebar logo uses transparent PNG from S3", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/components/PortalLayout.tsx", "utf-8")
    );
    // Uses an img tag with S3 URL for logo
    expect(source).toMatch(/omniscope-logo-transparent|\.png/i);
    // Has proper alt text
    expect(source).toMatch(/alt.*[Oo]mni[Ss]cope/);
  });
});

describe("V6: Kanban Drag-and-Drop", () => {
  it("ToDo page has Kanban columns with drag-and-drop handlers", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/ToDo.tsx", "utf-8")
    );
    // Has kanban columns
    expect(source).toMatch(/To Do|In Progress|Completed/);
    // Has drag handlers
    expect(source).toMatch(/onDragStart|draggable/);
    expect(source).toMatch(/onDragOver|onDrop/);
    // Has status update mutation
    expect(source).toMatch(/updateTask|update/i);
    // Has priority grouping
    expect(source).toMatch(/high|medium|low/i);
  });
});

describe("V6: Enhanced Analytics for Reports", () => {
  it("DailySummary includes full meeting details and tasks", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("server/analytics.ts", "utf-8")
    );
    // Has meetings array with details
    expect(source).toMatch(/meetings:.*Array/);
    // Has allTasks array
    expect(source).toMatch(/allTasks/);
    // Has opportunities and risks
    expect(source).toMatch(/allOpportunities/);
    expect(source).toMatch(/allRisks/);
    // Has key highlights
    expect(source).toMatch(/keyHighlights/);
  });

  it("WeeklySummary includes daily breakdown and full meeting details", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("server/analytics.ts", "utf-8")
    );
    // Has daily breakdown
    expect(source).toMatch(/dailyBreakdown/);
    // Has unique participants count
    expect(source).toMatch(/uniqueParticipants/);
    // Has unique organizations count
    expect(source).toMatch(/uniqueOrganizations/);
    // Has meetings array
    expect(source).toMatch(/meetings:.*Array/);
  });
});

describe("V6: Meetings Page Report Links", () => {
  it("Meetings page links to full report pages instead of dialogs", async () => {
    const source = await import("fs").then(fs =>
      fs.readFileSync("client/src/pages/Meetings.tsx", "utf-8")
    );
    // Links to daily report page
    expect(source).toMatch(/\/reports\/daily/);
    // Links to weekly report page
    expect(source).toMatch(/\/reports\/weekly/);
    // Should NOT have Dialog-based report content (moved to separate pages)
    expect(source).not.toMatch(/DailyReportContent/);
    expect(source).not.toMatch(/WeeklyReportContent/);
  });
});
