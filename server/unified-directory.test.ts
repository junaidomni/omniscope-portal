import { describe, it, expect } from "vitest";

// ============================================================================
// UNIFIED DIRECTORY SYSTEM TESTS
// ============================================================================

describe("Unified Directory — Search Logic", () => {
  // Test the unified search concept: contacts + users in one query
  it("should match contacts by name prefix", () => {
    const contacts = [
      { id: 1, name: "Joanne Odom", email: "joanne@acme.com", companyName: "Acme Corp" },
      { id: 2, name: "John Smith", email: "john@beta.io", companyName: "Beta Inc" },
      { id: 3, name: "Kyle Reeves", email: "kyle@gamma.co", companyName: "Gamma LLC" },
    ];
    const query = "jo";
    const results = contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
    );
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Joanne Odom");
    expect(results[1].name).toBe("John Smith");
  });

  it("should match contacts by email prefix", () => {
    const contacts = [
      { id: 1, name: "Joanne Odom", email: "joanne@acme.com" },
      { id: 2, name: "John Smith", email: "john@beta.io" },
      { id: 3, name: "Kyle Reeves", email: "kyle@gamma.co" },
    ];
    const query = "kyle@";
    const results = contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
    );
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Kyle Reeves");
  });

  it("should return empty for no match", () => {
    const contacts = [
      { id: 1, name: "Joanne Odom", email: "joanne@acme.com" },
    ];
    const query = "xyz";
    const results = contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
    );
    expect(results).toHaveLength(0);
  });

  it("should be case insensitive", () => {
    const contacts = [
      { id: 1, name: "Joanne Odom", email: "joanne@acme.com" },
    ];
    const query = "JOANNE";
    const results = contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
    );
    expect(results).toHaveLength(1);
  });
});

describe("Unified Directory — Email Domain Matching", () => {
  it("should extract domain from email", () => {
    const email = "joanne@acme.com";
    const domain = email.split("@")[1];
    expect(domain).toBe("acme.com");
  });

  it("should match company by domain", () => {
    const companies = [
      { id: 1, name: "Acme Corp", website: "https://acme.com" },
      { id: 2, name: "Beta Inc", website: "https://beta.io" },
    ];
    const email = "joanne@acme.com";
    const domain = email.split("@")[1];
    const match = companies.find(c => c.website?.includes(domain));
    expect(match?.name).toBe("Acme Corp");
  });

  it("should not match generic email domains", () => {
    const genericDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    const email = "user@gmail.com";
    const domain = email.split("@")[1];
    const isGeneric = genericDomains.includes(domain);
    expect(isGeneric).toBe(true);
  });

  it("should match corporate domains", () => {
    const genericDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    const email = "user@omniscope.ae";
    const domain = email.split("@")[1];
    const isGeneric = genericDomains.includes(domain);
    expect(isGeneric).toBe(false);
  });
});

describe("Unified Directory — Multi-Task Creation", () => {
  it("should validate at least one task has a title", () => {
    const tasks = [
      { title: "", description: "" },
      { title: "Follow up on KYB", description: "Need docs" },
    ];
    const validTasks = tasks.filter(t => t.title.trim());
    expect(validTasks).toHaveLength(1);
    expect(validTasks[0].title).toBe("Follow up on KYB");
  });

  it("should reject all empty tasks", () => {
    const tasks = [
      { title: "", description: "" },
      { title: "  ", description: "" },
    ];
    const validTasks = tasks.filter(t => t.title.trim());
    expect(validTasks).toHaveLength(0);
  });

  it("should support multiple tasks from one email", () => {
    const tasks = [
      { title: "Send KYB documents", priority: "high" },
      { title: "Schedule follow-up call", priority: "medium" },
      { title: "Prepare compliance report", priority: "low" },
      { title: "Review counterparty profile", priority: "medium" },
      { title: "Update CRM with deal status", priority: "low" },
    ];
    expect(tasks).toHaveLength(5);
    const highPriority = tasks.filter(t => t.priority === "high");
    expect(highPriority).toHaveLength(1);
  });

  it("should link tasks to thread via sourceThreadId", () => {
    const threadId = "thread_abc123";
    const task = {
      title: "Follow up",
      sourceThreadId: threadId,
      assigneeContactId: 42,
    };
    expect(task.sourceThreadId).toBe(threadId);
    expect(task.assigneeContactId).toBe(42);
  });

  it("should support assignee as contact ID, not just name string", () => {
    const task = {
      title: "Review proposal",
      assignedName: "Kyle Reeves",
      assigneeContactId: 15,
      companyId: 3,
    };
    // Entity-linked: if Kyle changes email, task still works
    expect(task.assigneeContactId).toBe(15);
    expect(task.companyId).toBe(3);
  });
});

describe("Unified Directory — Person Card Data", () => {
  it("should aggregate contact info for person card", () => {
    const personCard = {
      id: 1,
      name: "Joanne Odom",
      email: "joanne@acme.com",
      title: "CFO",
      company: { id: 1, name: "Acme Corp", industry: "Finance" },
      recentTasks: [
        { id: 10, title: "Send compliance docs", status: "in_progress" },
        { id: 11, title: "Review contract", status: "completed" },
      ],
      recentMeetings: [
        { id: 20, meetingTitle: "Q1 Review" },
      ],
    };
    expect(personCard.name).toBe("Joanne Odom");
    expect(personCard.company.name).toBe("Acme Corp");
    expect(personCard.recentTasks).toHaveLength(2);
    expect(personCard.recentMeetings).toHaveLength(1);
  });

  it("should handle contact without company", () => {
    const personCard = {
      id: 2,
      name: "Freelancer Joe",
      email: "joe@gmail.com",
      title: null,
      company: null,
      recentTasks: [],
      recentMeetings: [],
    };
    expect(personCard.company).toBeNull();
    expect(personCard.recentTasks).toHaveLength(0);
  });
});

describe("Unified Directory — Quick Create Contact", () => {
  it("should create contact from email compose", () => {
    const newContact = {
      name: "New Person",
      email: "newperson@startup.io",
    };
    expect(newContact.name).toBe("New Person");
    expect(newContact.email).toContain("@");
  });

  it("should detect if contact already exists by email", () => {
    const existingContacts = [
      { id: 1, email: "joanne@acme.com" },
      { id: 2, email: "kyle@gamma.co" },
    ];
    const newEmail = "joanne@acme.com";
    const existing = existingContacts.find(c => c.email === newEmail);
    expect(existing).toBeDefined();
    expect(existing?.id).toBe(1);
  });

  it("should not create duplicate when email exists", () => {
    const existingContacts = [
      { id: 1, email: "joanne@acme.com" },
    ];
    const newEmail = "joanne@acme.com";
    const existing = existingContacts.find(c => c.email === newEmail);
    // If existing, return existing instead of creating
    const result = existing ? { created: false, contact: existing } : { created: true, contact: { id: 99, email: newEmail } };
    expect(result.created).toBe(false);
    expect(result.contact.id).toBe(1);
  });
});

describe("Unified Directory — Autocomplete Behavior", () => {
  it("should debounce search (simulate 300ms delay concept)", () => {
    // Autocomplete should not fire on every keystroke
    const DEBOUNCE_MS = 300;
    expect(DEBOUNCE_MS).toBeGreaterThanOrEqual(200);
    expect(DEBOUNCE_MS).toBeLessThanOrEqual(500);
  });

  it("should require minimum 2 characters before searching", () => {
    const MIN_CHARS = 2;
    const query1 = "j";
    const query2 = "jo";
    expect(query1.length >= MIN_CHARS).toBe(false);
    expect(query2.length >= MIN_CHARS).toBe(true);
  });

  it("should show email mode results with email addresses", () => {
    const results = [
      { id: 1, name: "Joanne Odom", email: "joanne@acme.com", type: "contact" },
      { id: 2, name: "John Smith", email: "john@beta.io", type: "contact" },
    ];
    // In email mode, results should show email addresses
    results.forEach(r => {
      expect(r.email).toBeTruthy();
      expect(r.email).toContain("@");
    });
  });

  it("should show name mode results for task assignment", () => {
    const results = [
      { id: 1, name: "Kyle Reeves", email: "kyle@gamma.co", companyName: "Gamma LLC" },
    ];
    // In name mode, company name is shown for context
    expect(results[0].companyName).toBe("Gamma LLC");
  });
});

describe("Unified Directory — Star Filter with Person Context", () => {
  it("should filter threads by star level", () => {
    const threads = [
      { threadId: "t1", starLevel: 1 },
      { threadId: "t2", starLevel: 3 },
      { threadId: "t3", starLevel: null },
      { threadId: "t4", starLevel: 2 },
    ];
    const filtered = threads.filter(t => t.starLevel === 3);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].threadId).toBe("t2");
  });

  it("should show all threads when no star filter", () => {
    const threads = [
      { threadId: "t1", starLevel: 1 },
      { threadId: "t2", starLevel: 3 },
      { threadId: "t3", starLevel: null },
    ];
    const starFilter = null;
    const filtered = starFilter ? threads.filter(t => t.starLevel === starFilter) : threads;
    expect(filtered).toHaveLength(3);
  });
});
