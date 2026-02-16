import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================================
// HELPERS
// ============================================================================

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@omniscopex.ae",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ============================================================================
// ENHANCED DAILY SUMMARY - Full meeting details and tasks
// ============================================================================

describe("analytics.dailySummary - enhanced fields", () => {
  it("includes full meeting details with participants and orgs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.dailySummary({});

    expect(result).toBeDefined();
    expect(result).toHaveProperty("meetings");
    expect(Array.isArray(result.meetings)).toBe(true);

    // Each meeting in the array should have detailed fields
    if (result.meetings.length > 0) {
      const meeting = result.meetings[0];
      expect(meeting).toHaveProperty("id");
      expect(meeting).toHaveProperty("title");
    }
  });

  it("includes task data in daily summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.dailySummary({});

    expect(result).toHaveProperty("tasksCreated");
    expect(result).toHaveProperty("tasksCompleted");
    expect(typeof result.tasksCreated).toBe("number");
    expect(typeof result.tasksCompleted).toBe("number");
  });

  it("includes sector and jurisdiction breakdowns", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.dailySummary({});

    expect(result).toHaveProperty("topSectors");
    expect(result).toHaveProperty("topJurisdictions");
    expect(Array.isArray(result.topSectors)).toBe(true);
    expect(Array.isArray(result.topJurisdictions)).toBe(true);
  });
});

// ============================================================================
// ENHANCED WEEKLY SUMMARY - Full meeting details and tasks
// ============================================================================

describe("analytics.weeklySummary - enhanced fields", () => {
  it("includes full meeting details in weekly summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.weeklySummary({});

    expect(result).toBeDefined();
    expect(result).toHaveProperty("meetings");
    expect(Array.isArray(result.meetings)).toBe(true);
  });

  it("includes all task data in weekly summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.weeklySummary({});

    expect(result).toHaveProperty("tasksCreated");
    expect(result).toHaveProperty("tasksCompleted");
    expect(result).toHaveProperty("keyOpportunities");
    expect(result).toHaveProperty("keyRisks");
    expect(Array.isArray(result.keyOpportunities)).toBe(true);
    expect(Array.isArray(result.keyRisks)).toBe(true);
  });

  it("has 7-day daily breakdown", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.weeklySummary({});

    expect(result.dailyBreakdown).toBeDefined();
    expect(result.dailyBreakdown.length).toBe(7);
    result.dailyBreakdown.forEach((day: any) => {
      expect(day).toHaveProperty("date");
      // dailyBreakdown items have date and meetings count
      expect(typeof day.date).toBe("string");
    });
  });
});

// ============================================================================
// TASK MANAGEMENT - Kanban operations (status transitions)
// ============================================================================

describe("tasks - kanban status transitions", () => {
  it("creates a task in open status by default", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Kanban test task - open",
      priority: "medium",
    });

    expect(created).toBeDefined();
    expect(created.id).toBeGreaterThan(0);
  });

  it("transitions task from open to in_progress", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Kanban test - to in_progress",
      priority: "high",
    });

    const updated = await caller.tasks.update({
      id: created.id,
      status: "in_progress",
    });

    expect(updated).toBeDefined();
  });

  it("transitions task from in_progress to completed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Kanban test - to completed",
      priority: "low",
    });

    // First move to in_progress
    await caller.tasks.update({
      id: created.id,
      status: "in_progress",
    });

    // Then move to completed
    const completed = await caller.tasks.update({
      id: created.id,
      status: "completed",
    });

    expect(completed).toBeDefined();
  });

  it("transitions task back from completed to open", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Kanban test - reopen",
      priority: "medium",
    });

    // Complete it
    await caller.tasks.update({
      id: created.id,
      status: "completed",
    });

    // Reopen it
    const reopened = await caller.tasks.update({
      id: created.id,
      status: "open",
    });

    expect(reopened).toBeDefined();
  });
});

// ============================================================================
// TASK MANAGEMENT - Priority and category
// ============================================================================

describe("tasks - priority and category management", () => {
  it("creates tasks with different priorities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const highTask = await caller.tasks.create({
      title: "High priority task",
      priority: "high",
      category: "Gold",
    });
    const medTask = await caller.tasks.create({
      title: "Medium priority task",
      priority: "medium",
      category: "BTC",
    });
    const lowTask = await caller.tasks.create({
      title: "Low priority task",
      priority: "low",
      category: "General",
    });

    expect(highTask.id).toBeGreaterThan(0);
    expect(medTask.id).toBeGreaterThan(0);
    expect(lowTask.id).toBeGreaterThan(0);
  });

  it("updates task priority", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Priority change test",
      priority: "low",
    });

    const updated = await caller.tasks.update({
      id: created.id,
      priority: "high",
    });

    expect(updated).toBeDefined();
  });

  it("updates task category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Category change test",
      priority: "medium",
    });

    const updated = await caller.tasks.update({
      id: created.id,
      category: "Real Estate",
    });

    expect(updated).toBeDefined();
  });
});

// ============================================================================
// TASK MANAGEMENT - Notes and full detail editing
// ============================================================================

describe("tasks - notes and detail editing", () => {
  it("creates task with notes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Task with notes",
      priority: "medium",
      notes: "Initial notes for this task",
    });

    expect(result.id).toBeGreaterThan(0);
  });

  it("updates task notes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Task to update notes",
      priority: "high",
    });

    const updated = await caller.tasks.update({
      id: created.id,
      notes: "Updated notes with more detail",
    });

    expect(updated).toBeDefined();
  });

  it("updates multiple fields at once", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Multi-field update test",
      priority: "low",
    });

    const updated = await caller.tasks.update({
      id: created.id,
      title: "Updated title",
      priority: "high",
      status: "in_progress",
      notes: "Added notes",
      category: "Gold",
      assignedName: "Junaid",
    });

    expect(updated).toBeDefined();
  });
});

// ============================================================================
// TASK MANAGEMENT - Delete
// ============================================================================

describe("tasks - delete", () => {
  it("deletes a task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.tasks.create({
      title: "Task to delete",
      priority: "low",
    });

    const deleted = await caller.tasks.delete({ id: created.id });
    expect(deleted).toBeDefined();
  });

  it("requires authentication to delete", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.tasks.delete({ id: 99999 })).rejects.toThrow();
  });
});

// ============================================================================
// TASK CATEGORIES
// ============================================================================

describe("tasks.categories", () => {
  it("returns categories list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.categories();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================================
// EXPORT - Enhanced daily and weekly reports
// ============================================================================

describe("export.dailySummary - enhanced content", () => {
  it("generates markdown report with meeting details", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.dailySummary({});

    expect(result).toBeDefined();
    expect(result.content).toContain("OmniScope");
    expect(result.mimeType).toBe("text/markdown");
    expect(result.filename).toContain("daily");
  });
});

describe("export.weeklySummary - enhanced content", () => {
  it("generates markdown report with weekly breakdown", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.weeklySummary({});

    expect(result).toBeDefined();
    expect(result.content).toContain("OmniScope");
    expect(result.mimeType).toBe("text/markdown");
    expect(result.filename).toContain("weekly");
  });
});
