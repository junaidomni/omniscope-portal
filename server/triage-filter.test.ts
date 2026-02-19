import { describe, expect, it } from "vitest";

/**
 * Tests for the Triage Feed stat card filter logic.
 *
 * The filtering is client-side: when a stat card is tapped, the TriageFeed
 * component sets `activeFilter` state and conditionally renders sections.
 * These tests validate the filter type definition and the deduplication
 * logic used when assembling filtered task lists.
 */

// Mirror the TriageFilter type from the component
type TriageFilter = "open" | "overdue" | "high" | "done" | "starred" | "pending" | null;

// Simulate the deduplication logic used in the "open" and "high" filter views
function deduplicateTasks<T extends { id: number }>(tasks: T[]): T[] {
  return tasks.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
}

// Simulate filter label mapping used in the filter indicator bar
function getFilterLabel(filter: TriageFilter): string | null {
  const labels: Record<string, string> = {
    open: "Showing all open tasks",
    overdue: "Showing overdue tasks",
    high: "Showing high priority tasks",
    done: "Showing tasks completed today",
    starred: "Showing starred emails",
    pending: "Showing pending approvals",
  };
  return filter ? labels[filter] ?? null : null;
}

// Simulate the toggle behavior: tapping same card again clears filter
function toggleFilter(current: TriageFilter, next: TriageFilter): TriageFilter {
  return current === next ? null : next;
}

describe("TriageFilter type and toggle behavior", () => {
  it("returns null when toggling the same filter (deselect)", () => {
    expect(toggleFilter("open", "open")).toBeNull();
    expect(toggleFilter("high", "high")).toBeNull();
    expect(toggleFilter("overdue", "overdue")).toBeNull();
    expect(toggleFilter("done", "done")).toBeNull();
    expect(toggleFilter("starred", "starred")).toBeNull();
    expect(toggleFilter("pending", "pending")).toBeNull();
  });

  it("switches to a new filter when a different card is tapped", () => {
    expect(toggleFilter("open", "high")).toBe("high");
    expect(toggleFilter("high", "overdue")).toBe("overdue");
    expect(toggleFilter(null, "starred")).toBe("starred");
  });

  it("activates a filter from null state", () => {
    expect(toggleFilter(null, "open")).toBe("open");
    expect(toggleFilter(null, "pending")).toBe("pending");
  });
});

describe("Filter labels", () => {
  it("returns correct label for each filter type", () => {
    expect(getFilterLabel("open")).toBe("Showing all open tasks");
    expect(getFilterLabel("overdue")).toBe("Showing overdue tasks");
    expect(getFilterLabel("high")).toBe("Showing high priority tasks");
    expect(getFilterLabel("done")).toBe("Showing tasks completed today");
    expect(getFilterLabel("starred")).toBe("Showing starred emails");
    expect(getFilterLabel("pending")).toBe("Showing pending approvals");
  });

  it("returns null for null filter", () => {
    expect(getFilterLabel(null)).toBeNull();
  });
});

describe("Task deduplication for open/high filter views", () => {
  it("removes duplicate tasks by id", () => {
    const tasks = [
      { id: 1, title: "Task A", priority: "high" },
      { id: 2, title: "Task B", priority: "medium" },
      { id: 1, title: "Task A (duplicate)", priority: "high" },
      { id: 3, title: "Task C", priority: "low" },
      { id: 2, title: "Task B (duplicate)", priority: "medium" },
    ];
    const result = deduplicateTasks(tasks);
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual([1, 2, 3]);
    // First occurrence wins
    expect(result[0].title).toBe("Task A");
    expect(result[1].title).toBe("Task B");
  });

  it("handles empty array", () => {
    expect(deduplicateTasks([])).toEqual([]);
  });

  it("handles array with no duplicates", () => {
    const tasks = [
      { id: 10, title: "X" },
      { id: 20, title: "Y" },
    ];
    expect(deduplicateTasks(tasks)).toHaveLength(2);
  });

  it("preserves order of first occurrence", () => {
    const tasks = [
      { id: 5, title: "E" },
      { id: 3, title: "C" },
      { id: 1, title: "A" },
      { id: 3, title: "C-dup" },
      { id: 5, title: "E-dup" },
    ];
    const result = deduplicateTasks(tasks);
    expect(result.map((t) => t.id)).toEqual([5, 3, 1]);
  });
});

describe("Stat card active state logic", () => {
  it("only one filter can be active at a time", () => {
    // Simulating sequential taps
    let filter: TriageFilter = null;
    filter = toggleFilter(filter, "open");
    expect(filter).toBe("open");
    filter = toggleFilter(filter, "high");
    expect(filter).toBe("high");
    filter = toggleFilter(filter, "high");
    expect(filter).toBeNull();
  });

  it("all valid filter values are covered", () => {
    const validFilters: TriageFilter[] = ["open", "overdue", "high", "done", "starred", "pending", null];
    for (const f of validFilters) {
      if (f === null) {
        expect(getFilterLabel(f)).toBeNull();
      } else {
        expect(getFilterLabel(f)).toBeTruthy();
      }
    }
  });
});
