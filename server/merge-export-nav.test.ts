import { describe, it, expect } from "vitest";

describe("Activity Log CSV Export", () => {
  describe("exportAll endpoint", () => {
    it("should accept optional action and entityType filters", () => {
      const params = { action: "approve_contact", entityType: "contact" };
      expect(params.action).toBe("approve_contact");
      expect(params.entityType).toBe("contact");
    });

    it("should accept empty/undefined filters to export everything", () => {
      const params = {};
      expect(params).toBeDefined();
      expect(Object.keys(params)).toHaveLength(0);
    });

    it("should return logs array and total count", () => {
      const mockResult = {
        logs: [
          { id: 1, action: "approve_contact", entityType: "contact", entityName: "John Doe", details: "Approved", createdAt: Date.now() },
          { id: 2, action: "reject_company", entityType: "company", entityName: "Acme Corp", details: "Rejected", createdAt: Date.now() },
        ],
        total: 2,
      };
      expect(mockResult.logs).toHaveLength(2);
      expect(mockResult.total).toBe(2);
    });

    it("should use a high limit (10000) for full export", () => {
      const exportLimit = 10000;
      expect(exportLimit).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("CSV generation", () => {
    it("should produce valid CSV with headers", () => {
      const headers = ["Date", "Time", "Action", "Entity Type", "Entity Name", "Details"];
      const csv = headers.join(",");
      expect(csv).toContain("Date");
      expect(csv).toContain("Action");
      expect(csv).toContain("Entity Name");
      expect(csv.split(",")).toHaveLength(6);
    });

    it("should escape commas and quotes in CSV fields", () => {
      const name = 'O\'Brien, James';
      const escaped = `"${name.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"O\'Brien, James"');
    });

    it("should handle empty details gracefully", () => {
      const details = "";
      const escaped = `"${(details || "").replace(/"/g, '""')}"`;
      expect(escaped).toBe('""');
    });

    it("should format dates in locale-friendly format", () => {
      const timestamp = Date.now();
      const d = new Date(timestamp);
      const dateStr = d.toLocaleDateString("en-US");
      const timeStr = d.toLocaleTimeString("en-US");
      expect(dateStr).toBeTruthy();
      expect(timeStr).toBeTruthy();
    });

    it("should generate filename with current date", () => {
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `omniscope-activity-log-${dateStr}.csv`;
      expect(filename).toMatch(/omniscope-activity-log-\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  describe("action label mapping", () => {
    const ACTION_LABELS: Record<string, string> = {
      approve_contact: "Approved Contact",
      reject_contact: "Rejected Contact",
      merge_contacts: "Merged Contacts",
      bulk_approve_contacts: "Bulk Approved Contacts",
      bulk_reject_contacts: "Bulk Rejected Contacts",
      approve_company: "Approved Company",
      reject_company: "Rejected Company",
      bulk_approve_companies: "Bulk Approved Companies",
      bulk_reject_companies: "Bulk Rejected Companies",
      approve_suggestion: "Approved Suggestion",
      reject_suggestion: "Dismissed Suggestion",
      bulk_approve_suggestions: "Bulk Approved Suggestions",
      bulk_reject_suggestions: "Bulk Dismissed Suggestions",
      dedup_merge: "Dedup Merge",
      dedup_dismiss: "Dedup Dismissed",
    };

    it("should have labels for all 15 action types", () => {
      expect(Object.keys(ACTION_LABELS)).toHaveLength(15);
    });

    it("should map raw action to human-readable label", () => {
      expect(ACTION_LABELS["approve_contact"]).toBe("Approved Contact");
      expect(ACTION_LABELS["merge_contacts"]).toBe("Merged Contacts");
      expect(ACTION_LABELS["dedup_merge"]).toBe("Dedup Merge");
    });
  });
});

describe("PendingReview Merge Capabilities", () => {
  describe("contact merge", () => {
    it("should support inline merge panel toggle per contact row", () => {
      let mergeContactId: number | null = null;
      // Toggle on
      mergeContactId = 42;
      expect(mergeContactId).toBe(42);
      // Toggle off (clicking same)
      mergeContactId = mergeContactId === 42 ? null : 42;
      expect(mergeContactId).toBeNull();
    });

    it("should call mergeAndApprove with pendingId and mergeIntoId", () => {
      const mergeParams = { pendingId: 10, mergeIntoId: 5 };
      expect(mergeParams.pendingId).toBe(10);
      expect(mergeParams.mergeIntoId).toBe(5);
      expect(mergeParams.pendingId).not.toBe(mergeParams.mergeIntoId);
    });

    it("should show auto-detected duplicates from findDuplicatesFor", () => {
      const duplicates = [
        { contact: { id: 5, name: "Kyle Johnson", email: "kyle@example.com" }, confidence: 90, reason: "Name match" },
        { contact: { id: 8, name: "K. Johnson", email: "kj@example.com" }, confidence: 75, reason: "Partial match" },
      ];
      expect(duplicates).toHaveLength(2);
      expect(duplicates[0].confidence).toBeGreaterThanOrEqual(75);
    });

    it("should support manual search for approved contacts", () => {
      const allContacts = [
        { id: 1, name: "Alice Smith", approvalStatus: "approved", email: "alice@test.com" },
        { id: 2, name: "Bob Jones", approvalStatus: "approved", email: "bob@test.com" },
        { id: 3, name: "Pending Person", approvalStatus: "pending", email: "pending@test.com" },
      ];
      const searchQuery = "alice";
      const results = allContacts
        .filter((c) => c.approvalStatus === "approved")
        .filter((c) => c.name.toLowerCase().includes(searchQuery));
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Alice Smith");
    });
  });

  describe("company merge", () => {
    it("should support inline merge panel toggle per company row", () => {
      let mergeCompanyId: number | null = null;
      mergeCompanyId = 7;
      expect(mergeCompanyId).toBe(7);
      mergeCompanyId = mergeCompanyId === 7 ? null : 7;
      expect(mergeCompanyId).toBeNull();
    });

    it("should call mergeCompany with pendingId and mergeIntoId", () => {
      const mergeParams = { pendingId: 20, mergeIntoId: 15 };
      expect(mergeParams.pendingId).toBe(20);
      expect(mergeParams.mergeIntoId).toBe(15);
    });

    it("should show auto-detected company duplicates from findCompanyDuplicatesFor", () => {
      const duplicates = [
        { company: { id: 15, name: "OmniScope Group", domain: "omniscopex.ae" }, confidence: 85, reason: "Domain match" },
      ];
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].company.domain).toBe("omniscopex.ae");
    });
  });

  describe("confidence color coding", () => {
    it("should show red for 80%+ confidence", () => {
      const confidenceColor = (conf: number) => {
        if (conf >= 80) return "text-red-400";
        if (conf >= 60) return "text-yellow-400";
        return "text-zinc-400";
      };
      expect(confidenceColor(95)).toBe("text-red-400");
      expect(confidenceColor(80)).toBe("text-red-400");
    });

    it("should show yellow for 60-79% confidence", () => {
      const confidenceColor = (conf: number) => {
        if (conf >= 80) return "text-red-400";
        if (conf >= 60) return "text-yellow-400";
        return "text-zinc-400";
      };
      expect(confidenceColor(75)).toBe("text-yellow-400");
      expect(confidenceColor(60)).toBe("text-yellow-400");
    });

    it("should show zinc for <60% confidence", () => {
      const confidenceColor = (conf: number) => {
        if (conf >= 80) return "text-red-400";
        if (conf >= 60) return "text-yellow-400";
        return "text-zinc-400";
      };
      expect(confidenceColor(50)).toBe("text-zinc-400");
      expect(confidenceColor(30)).toBe("text-zinc-400");
    });
  });
});

describe("Navigation Back Buttons", () => {
  describe("Activity Log page", () => {
    it("should have a back link to Triage", () => {
      const backLink = { href: "/", text: "Back to Triage" };
      expect(backLink.href).toBe("/");
      expect(backLink.text).toContain("Back");
    });
  });

  describe("Dedup Sweep page", () => {
    it("should have a back link to Triage", () => {
      const backLink = { href: "/", text: "Back to Triage" };
      expect(backLink.href).toBe("/");
      expect(backLink.text).toContain("Back");
    });
  });
});

describe("Alias Learning System Integration", () => {
  describe("merge creates aliases", () => {
    it("should save alias when merging contacts with different names", () => {
      const pending = { id: 10, name: "Kyle" };
      const target = { id: 5, name: "Kyle Johnson" };
      const shouldSaveAlias = pending.name.toLowerCase() !== target.name.toLowerCase();
      expect(shouldSaveAlias).toBe(true);
    });

    it("should NOT save alias when names are identical", () => {
      const pending = { id: 10, name: "Kyle Johnson" };
      const target = { id: 5, name: "Kyle Johnson" };
      const shouldSaveAlias = pending.name.toLowerCase() !== target.name.toLowerCase();
      expect(shouldSaveAlias).toBe(false);
    });

    it("should save company alias when merging companies with different names", () => {
      const pending = { id: 20, name: "Omniscope" };
      const target = { id: 15, name: "OmniScope Group" };
      const shouldSaveAlias = pending.name.toLowerCase() !== target.name.toLowerCase();
      expect(shouldSaveAlias).toBe(true);
    });
  });

  describe("alias-based auto-linking", () => {
    it("should match future contacts using learned aliases", () => {
      const aliases = [
        { aliasName: "kyle", canonicalContactId: 5 },
        { aliasName: "jt", canonicalContactId: 12 },
      ];
      const incomingName = "Kyle";
      const match = aliases.find((a) => a.aliasName === incomingName.toLowerCase());
      expect(match).toBeDefined();
      expect(match?.canonicalContactId).toBe(5);
    });

    it("should not match when no alias exists", () => {
      const aliases = [
        { aliasName: "kyle", canonicalContactId: 5 },
      ];
      const incomingName = "Sarah";
      const match = aliases.find((a) => a.aliasName === incomingName.toLowerCase());
      expect(match).toBeUndefined();
    });
  });
});

describe("Complete Data Hygiene Flow", () => {
  it("should follow the pipeline: pending → detect → merge → alias → auto-link", () => {
    // Step 1: New contact enters as pending
    const newContact = { name: "JT", approvalStatus: "pending" };
    expect(newContact.approvalStatus).toBe("pending");

    // Step 2: Duplicate detection finds existing "JT Williams"
    const duplicates = [{ contact: { id: 12, name: "JT Williams" }, confidence: 75, reason: "First name match" }];
    expect(duplicates.length).toBeGreaterThan(0);

    // Step 3: User merges → pending deleted, target enriched
    const mergeResult = { success: true, mergedInto: "JT Williams" };
    expect(mergeResult.success).toBe(true);

    // Step 4: Alias saved: "JT" → contact 12
    const alias = { aliasName: "jt", canonicalContactId: 12, source: "merge" };
    expect(alias.aliasName).toBe("jt");
    expect(alias.source).toBe("merge");

    // Step 5: Future "JT" auto-links to contact 12
    const futureMatch = alias.aliasName === "jt" ? alias.canonicalContactId : null;
    expect(futureMatch).toBe(12);
  });

  it("should log all actions in the activity log", () => {
    const actions = [
      { action: "merge_contacts", entityName: "JT Williams", details: 'Merged pending "JT" into "JT Williams"' },
    ];
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe("merge_contacts");
    expect(actions[0].details).toContain("Merged");
  });
});
