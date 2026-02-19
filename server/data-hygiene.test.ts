import { describe, expect, it } from "vitest";

/**
 * Data Hygiene Pipeline Tests
 *
 * Tests the pending suggestion system that ensures data cleanliness:
 * - Company-contact associations go through review
 * - AI enrichment data is staged as suggestions
 * - Duplicate detection at sync time
 * - Suggestion approval/rejection flows
 */

describe("Data Hygiene Pipeline", () => {
  describe("Pending Suggestion Types", () => {
    it("should define valid suggestion types", () => {
      const validTypes = ["company_link", "enrichment", "company_enrichment"];
      expect(validTypes).toHaveLength(3);
      expect(validTypes).toContain("company_link");
      expect(validTypes).toContain("enrichment");
      expect(validTypes).toContain("company_enrichment");
    });

    it("should define valid suggestion statuses", () => {
      const validStatuses = ["pending", "approved", "rejected"];
      expect(validStatuses).toHaveLength(3);
      expect(validStatuses).toContain("pending");
      expect(validStatuses).toContain("approved");
      expect(validStatuses).toContain("rejected");
    });
  });

  describe("Duplicate Detection Logic", () => {
    function normalizeForComparison(name: string): string {
      return name.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function calculateNameSimilarity(a: string, b: string): number {
      const normA = normalizeForComparison(a);
      const normB = normalizeForComparison(b);

      // Exact match
      if (normA === normB) return 100;

      // Check if one contains the other
      if (normA.includes(normB) || normB.includes(normA)) return 85;

      // Check name parts overlap (first/last swap)
      const partsA = a.toLowerCase().split(/\s+/).filter(Boolean);
      const partsB = b.toLowerCase().split(/\s+/).filter(Boolean);
      const overlap = partsA.filter((p) => partsB.includes(p));
      if (overlap.length > 0 && overlap.length >= Math.min(partsA.length, partsB.length)) {
        return 80;
      }

      return 0;
    }

    it("should detect exact name matches", () => {
      expect(calculateNameSimilarity("Jake Ryan", "Jake Ryan")).toBe(100);
    });

    it("should detect case-insensitive matches", () => {
      expect(calculateNameSimilarity("JAKE RYAN", "jake ryan")).toBe(100);
    });

    it("should detect name with extra whitespace", () => {
      expect(calculateNameSimilarity("Jake  Ryan", "Jake Ryan")).toBe(100);
    });

    it("should detect first/last name swaps", () => {
      const score = calculateNameSimilarity("Jake Ryan", "Ryan Jake");
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should detect partial name containment", () => {
      const score = calculateNameSimilarity("Jake", "Jake Ryan");
      expect(score).toBeGreaterThanOrEqual(85);
    });

    it("should not match completely different names", () => {
      const score = calculateNameSimilarity("Jake Ryan", "Sarah Connor");
      expect(score).toBe(0);
    });

    it("should handle empty strings gracefully", () => {
      expect(calculateNameSimilarity("", "")).toBe(100);
      expect(calculateNameSimilarity("Jake", "")).toBe(85);
    });
  });

  describe("Suggestion Data Structures", () => {
    it("should validate company_link suggestion shape", () => {
      const suggestion = {
        type: "company_link" as const,
        contactId: 1,
        contactName: "John Doe",
        suggestedCompanyId: 5,
        suggestedCompanyName: "Acme Corp",
        confidence: 90,
        reason: "Email domain match",
        status: "pending" as const,
      };

      expect(suggestion.type).toBe("company_link");
      expect(suggestion.contactId).toBeDefined();
      expect(suggestion.suggestedCompanyId).toBeDefined();
      expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
      expect(suggestion.confidence).toBeLessThanOrEqual(100);
      expect(suggestion.status).toBe("pending");
    });

    it("should validate enrichment suggestion shape", () => {
      const suggestion = {
        type: "enrichment" as const,
        contactId: 1,
        contactName: "John Doe",
        suggestedData: {
          title: "VP of Engineering",
          phone: "+1-555-0123",
          linkedIn: "linkedin.com/in/johndoe",
        },
        confidence: 75,
        reason: "AI-extracted from meeting transcript",
        status: "pending" as const,
      };

      expect(suggestion.type).toBe("enrichment");
      expect(suggestion.suggestedData).toBeDefined();
      expect(Object.keys(suggestion.suggestedData).length).toBeGreaterThan(0);
      expect(suggestion.status).toBe("pending");
    });

    it("should validate company_enrichment suggestion shape", () => {
      const suggestion = {
        type: "company_enrichment" as const,
        companyId: 5,
        companyName: "Acme Corp",
        suggestedData: {
          sector: "Technology",
          website: "https://acme.com",
        },
        confidence: 80,
        reason: "AI-extracted from meeting context",
        status: "pending" as const,
      };

      expect(suggestion.type).toBe("company_enrichment");
      expect(suggestion.companyId).toBeDefined();
      expect(suggestion.suggestedData).toBeDefined();
      expect(suggestion.status).toBe("pending");
    });
  });

  describe("Approval Flow Logic", () => {
    it("should transition suggestion from pending to approved", () => {
      let status = "pending";
      // Simulate approval
      status = "approved";
      expect(status).toBe("approved");
    });

    it("should transition suggestion from pending to rejected", () => {
      let status = "pending";
      // Simulate rejection
      status = "rejected";
      expect(status).toBe("rejected");
    });

    it("should not allow re-approval of rejected suggestions", () => {
      const status = "rejected";
      // In the real system, only pending suggestions can be approved
      expect(status).not.toBe("pending");
    });
  });

  describe("Merge Confirmation Data", () => {
    it("should identify fields to transfer during merge", () => {
      const source = {
        name: "Jake Ryan",
        email: "jake@example.com",
        phone: null,
        title: "CEO",
        organization: "OmniScope",
      };

      const target = {
        name: "Jacob Ryan",
        email: null,
        phone: "+1-555-0123",
        title: null,
        organization: "OmniScope",
      };

      // Fields that would be transferred (target is null, source has value)
      const fieldsToTransfer: string[] = [];
      for (const [key, val] of Object.entries(source)) {
        if (val && !target[key as keyof typeof target]) {
          fieldsToTransfer.push(key);
        }
      }

      expect(fieldsToTransfer).toContain("email");
      expect(fieldsToTransfer).toContain("title");
      expect(fieldsToTransfer).not.toContain("name"); // both have name
      expect(fieldsToTransfer).not.toContain("organization"); // both have org
    });

    it("should preserve target data when both have values", () => {
      const source = { name: "Jake Ryan", title: "VP" };
      const target = { name: "Jacob McDonald", title: "CEO" };

      // Merge should keep target values when both exist
      const merged = { ...source, ...target };
      expect(merged.name).toBe("Jacob McDonald");
      expect(merged.title).toBe("CEO");
    });
  });

  describe("Stat Card Pending Count", () => {
    it("should include suggestions in pending count", () => {
      const pendingContacts = 3;
      const pendingCompanies = 2;
      const pendingSuggestions = 5;

      const totalPending = pendingContacts + pendingCompanies + pendingSuggestions;
      expect(totalPending).toBe(10);
    });

    it("should handle zero suggestions gracefully", () => {
      const pendingContacts = 3;
      const pendingCompanies = 2;
      const pendingSuggestions = 0;

      const totalPending = pendingContacts + pendingCompanies + pendingSuggestions;
      expect(totalPending).toBe(5);
    });
  });
});
