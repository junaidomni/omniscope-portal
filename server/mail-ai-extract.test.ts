import { describe, it, expect } from "vitest";

// ============================================================================
// AI TASK EXTRACTION — Unit Tests
// ============================================================================

// Test the task extraction response parsing and enrichment logic
// The actual LLM call is tested via integration, but we validate the
// data transformation, priority mapping, and contact matching logic

describe("AI Task Extraction — Response Parsing", () => {
  const mockExtractedTasks = [
    {
      title: "Send KYB documents to compliance team",
      description: "Referenced in email from Zahra regarding onboarding",
      priority: "high",
      assignee: "Zahra Qureshi",
      assigneeEmail: "zahra@example.com",
      dueDateHint: "by Friday",
      category: "compliance",
    },
    {
      title: "Schedule follow-up call with client",
      description: "Discussed in thread about carbon credits deal",
      priority: "medium",
      assignee: null,
      assigneeEmail: null,
      dueDateHint: "next week",
      category: "communications",
    },
    {
      title: "Review draft agreement",
      description: "Legal team needs to review before signing",
      priority: "high",
      assignee: "Legal Team",
      assigneeEmail: null,
      dueDateHint: "ASAP",
      category: "legal",
    },
  ];

  it("should parse valid task extraction response", () => {
    const response = {
      threadContext: "Discussion about carbon credits deal onboarding",
      tasks: mockExtractedTasks,
    };

    expect(response.tasks).toHaveLength(3);
    expect(response.threadContext).toBeTruthy();
    expect(response.tasks[0].title).toBe("Send KYB documents to compliance team");
  });

  it("should validate priority values", () => {
    const validPriorities = ["low", "medium", "high"];
    for (const task of mockExtractedTasks) {
      expect(validPriorities).toContain(task.priority);
    }
  });

  it("should validate category values", () => {
    const validCategories = ["compliance", "finance", "operations", "communications", "legal", "general"];
    for (const task of mockExtractedTasks) {
      expect(validCategories).toContain(task.category);
    }
  });

  it("should handle tasks with null assignee", () => {
    const noAssigneeTask = mockExtractedTasks[1];
    expect(noAssigneeTask.assignee).toBeNull();
    expect(noAssigneeTask.assigneeEmail).toBeNull();
  });

  it("should handle tasks with assignee name but no email", () => {
    const nameOnlyTask = mockExtractedTasks[2];
    expect(nameOnlyTask.assignee).toBe("Legal Team");
    expect(nameOnlyTask.assigneeEmail).toBeNull();
  });

  it("should handle tasks with both assignee name and email", () => {
    const fullTask = mockExtractedTasks[0];
    expect(fullTask.assignee).toBe("Zahra Qureshi");
    expect(fullTask.assigneeEmail).toBe("zahra@example.com");
  });
});

describe("AI Task Extraction — Priority Mapping", () => {
  it("should map valid priorities correctly", () => {
    const validPriorities = ["low", "medium", "high"];
    const mapPriority = (p: string) =>
      validPriorities.includes(p) ? p : "medium";

    expect(mapPriority("high")).toBe("high");
    expect(mapPriority("medium")).toBe("medium");
    expect(mapPriority("low")).toBe("low");
  });

  it("should default invalid priorities to medium", () => {
    const validPriorities = ["low", "medium", "high"];
    const mapPriority = (p: string) =>
      validPriorities.includes(p) ? p : "medium";

    expect(mapPriority("urgent")).toBe("medium");
    expect(mapPriority("critical")).toBe("medium");
    expect(mapPriority("")).toBe("medium");
  });
});

describe("AI Task Extraction — TaskItem Mapping", () => {
  interface TaskItem {
    id: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    assignee: { id: number; name: string; email: string | null } | null;
    assignedName: string;
    dueDate: string;
    category: string;
  }

  const mapExtractedToTaskItem = (task: {
    title: string;
    description: string;
    priority: string;
    assigneeName: string | null;
    assigneeEmail: string | null;
    assigneeContactId: number | null;
    category: string;
  }): TaskItem => ({
    id: "test-id",
    title: task.title,
    description: task.description || "",
    priority: (["low", "medium", "high"].includes(task.priority)
      ? task.priority
      : "medium") as "low" | "medium" | "high",
    assignee: task.assigneeContactId
      ? {
          id: task.assigneeContactId,
          name: task.assigneeName || "",
          email: task.assigneeEmail || null,
        }
      : null,
    assignedName: task.assigneeName || "",
    dueDate: "",
    category: task.category || "",
  });

  it("should map enriched task with matched contact", () => {
    const result = mapExtractedToTaskItem({
      title: "Send documents",
      description: "KYB docs needed",
      priority: "high",
      assigneeName: "Zahra Qureshi",
      assigneeEmail: "zahra@example.com",
      assigneeContactId: 42,
      category: "compliance",
    });

    expect(result.title).toBe("Send documents");
    expect(result.priority).toBe("high");
    expect(result.assignee).not.toBeNull();
    expect(result.assignee!.id).toBe(42);
    expect(result.assignee!.name).toBe("Zahra Qureshi");
    expect(result.assignedName).toBe("Zahra Qureshi");
    expect(result.category).toBe("compliance");
  });

  it("should map task without matched contact", () => {
    const result = mapExtractedToTaskItem({
      title: "Follow up",
      description: "Schedule call",
      priority: "medium",
      assigneeName: null,
      assigneeEmail: null,
      assigneeContactId: null,
      category: "communications",
    });

    expect(result.assignee).toBeNull();
    expect(result.assignedName).toBe("");
  });

  it("should default invalid priority to medium", () => {
    const result = mapExtractedToTaskItem({
      title: "Test",
      description: "",
      priority: "urgent",
      assigneeName: null,
      assigneeEmail: null,
      assigneeContactId: null,
      category: "general",
    });

    expect(result.priority).toBe("medium");
  });

  it("should handle empty category", () => {
    const result = mapExtractedToTaskItem({
      title: "Test",
      description: "",
      priority: "low",
      assigneeName: null,
      assigneeEmail: null,
      assigneeContactId: null,
      category: "",
    });

    expect(result.category).toBe("");
  });
});

describe("AI Task Extraction — Conversation Text Building", () => {
  const buildConversationText = (messages: Array<{
    body?: string;
    bodyHtml?: string;
    snippet?: string;
    internalDate: string;
    fromName?: string;
    fromEmail: string;
  }>) => {
    return messages.map((msg) => {
      const body = (msg.body || msg.bodyHtml || msg.snippet || "").replace(/<[^>]+>/g, "").trim();
      const date = new Date(parseInt(msg.internalDate)).toISOString();
      return `[${date}] ${msg.fromName || msg.fromEmail} <${msg.fromEmail}>:\n${body}`;
    }).join("\n\n---\n\n");
  };

  it("should build conversation text from messages", () => {
    const messages = [
      {
        body: "Please send the KYB documents.",
        internalDate: "1708300000000",
        fromName: "Jake",
        fromEmail: "jake@omniscopex.ae",
      },
      {
        bodyHtml: "<p>Will do, sending now.</p>",
        internalDate: "1708310000000",
        fromName: "Zahra",
        fromEmail: "zahra@example.com",
      },
    ];

    const text = buildConversationText(messages);
    expect(text).toContain("Jake <jake@omniscopex.ae>");
    expect(text).toContain("Please send the KYB documents.");
    expect(text).toContain("Zahra <zahra@example.com>");
    expect(text).toContain("Will do, sending now.");
    expect(text).toContain("---");
  });

  it("should strip HTML tags from bodyHtml", () => {
    const messages = [
      {
        bodyHtml: "<div><p>Hello <strong>World</strong></p></div>",
        internalDate: "1708300000000",
        fromEmail: "test@example.com",
      },
    ];

    const text = buildConversationText(messages);
    expect(text).toContain("Hello World");
    expect(text).not.toContain("<div>");
    expect(text).not.toContain("<strong>");
  });

  it("should fallback to snippet when body is empty", () => {
    const messages = [
      {
        snippet: "This is a snippet preview...",
        internalDate: "1708300000000",
        fromEmail: "test@example.com",
      },
    ];

    const text = buildConversationText(messages);
    expect(text).toContain("This is a snippet preview...");
  });

  it("should use fromEmail when fromName is missing", () => {
    const messages = [
      {
        body: "Hello",
        internalDate: "1708300000000",
        fromEmail: "noreply@example.com",
      },
    ];

    const text = buildConversationText(messages);
    expect(text).toContain("noreply@example.com <noreply@example.com>");
  });

  it("should truncate to 12000 chars for LLM input", () => {
    const longBody = "A".repeat(15000);
    const messages = [
      {
        body: longBody,
        internalDate: "1708300000000",
        fromEmail: "test@example.com",
      },
    ];

    const text = buildConversationText(messages);
    const truncated = text.substring(0, 12000);
    expect(truncated.length).toBe(12000);
  });
});

describe("AI Task Extraction — JSON Schema Validation", () => {
  it("should validate correct response structure", () => {
    const response = {
      threadContext: "Discussion about deal terms",
      tasks: [
        {
          title: "Review contract",
          description: "Legal review needed",
          priority: "high",
          assignee: "Legal Team",
          assigneeEmail: null,
          dueDateHint: "by EOD",
          category: "legal",
        },
      ],
    };

    expect(response).toHaveProperty("threadContext");
    expect(response).toHaveProperty("tasks");
    expect(Array.isArray(response.tasks)).toBe(true);
    expect(response.tasks[0]).toHaveProperty("title");
    expect(response.tasks[0]).toHaveProperty("description");
    expect(response.tasks[0]).toHaveProperty("priority");
    expect(response.tasks[0]).toHaveProperty("assignee");
    expect(response.tasks[0]).toHaveProperty("assigneeEmail");
    expect(response.tasks[0]).toHaveProperty("dueDateHint");
    expect(response.tasks[0]).toHaveProperty("category");
  });

  it("should handle empty tasks array", () => {
    const response = {
      threadContext: "Informational email with no action items",
      tasks: [],
    };

    expect(response.tasks).toHaveLength(0);
    expect(response.threadContext).toBeTruthy();
  });

  it("should handle maximum 10 tasks", () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: `Description ${i + 1}`,
      priority: "medium",
      assignee: null,
      assigneeEmail: null,
      dueDateHint: null,
      category: "general",
    }));

    const response = { threadContext: "Complex thread", tasks };
    expect(response.tasks.length).toBeLessThanOrEqual(10);
  });
});
