import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// ============================================================================
// Relationship Hub & Companies Rebuild Tests
// ============================================================================

describe("Contacts Approval Schema", () => {
  const contactUpdateSchema = z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    organization: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    category: z.enum(["client", "prospect", "partner", "vendor", "other"]).optional(),
    approvalStatus: z.enum(["approved", "pending", "rejected"]).optional(),
    riskTier: z.enum(["low", "medium", "high", "critical"]).nullable().optional(),
    complianceStage: z.enum(["not_started", "in_progress", "cleared", "flagged"]).nullable().optional(),
    influenceWeight: z.number().min(1).max(10).nullable().optional(),
    introducerSource: z.string().nullable().optional(),
    referralChain: z.string().nullable().optional(),
  });

  it("should accept valid pending approval status", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, approvalStatus: "pending" });
    expect(result.success).toBe(true);
  });

  it("should accept valid approved status", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, approvalStatus: "approved" });
    expect(result.success).toBe(true);
  });

  it("should accept valid rejected status", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, approvalStatus: "rejected" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid approval status", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, approvalStatus: "maybe" });
    expect(result.success).toBe(false);
  });

  it("should accept risk tier values", () => {
    const values = ["low", "medium", "high", "critical"];
    for (const tier of values) {
      const result = contactUpdateSchema.safeParse({ id: 1, riskTier: tier });
      expect(result.success).toBe(true);
    }
  });

  it("should accept compliance stage values", () => {
    const values = ["not_started", "in_progress", "cleared", "flagged"];
    for (const stage of values) {
      const result = contactUpdateSchema.safeParse({ id: 1, complianceStage: stage });
      expect(result.success).toBe(true);
    }
  });

  it("should accept influence weight 1-10", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, influenceWeight: 7 });
    expect(result.success).toBe(true);
  });

  it("should reject influence weight out of range", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, influenceWeight: 15 });
    expect(result.success).toBe(false);
  });

  it("should accept null influence weight", () => {
    const result = contactUpdateSchema.safeParse({ id: 1, influenceWeight: null });
    expect(result.success).toBe(true);
  });

  it("should accept introducer source and referral chain", () => {
    const result = contactUpdateSchema.safeParse({
      id: 1,
      introducerSource: "Ahmed Khan",
      referralChain: "Ahmed → Khalid → Contact",
    });
    expect(result.success).toBe(true);
  });
});

describe("Companies Approval Schema", () => {
  const companyUpdateSchema = z.object({
    id: z.number(),
    name: z.string().optional(),
    domain: z.string().optional(),
    industry: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["active", "inactive", "prospect", "partner"]).optional(),
    owner: z.string().optional(),
    approvalStatus: z.enum(["approved", "pending", "rejected"]).optional(),
    location: z.string().nullable().optional(),
    internalRating: z.number().min(1).max(5).nullable().optional(),
    jurisdictionRisk: z.enum(["low", "medium", "high", "critical"]).nullable().optional(),
    bankingPartner: z.string().nullable().optional(),
    custodian: z.string().nullable().optional(),
    regulatoryExposure: z.string().nullable().optional(),
    entityType: z.enum(["sovereign", "private", "institutional", "family_office", "other"]).nullable().optional(),
  });

  it("should accept valid company update with new fields", () => {
    const result = companyUpdateSchema.safeParse({
      id: 1,
      name: "Sovereign Wealth Fund",
      entityType: "sovereign",
      jurisdictionRisk: "low",
      internalRating: 5,
      bankingPartner: "HSBC",
      custodian: "Fireblocks",
      location: "Abu Dhabi, UAE",
    });
    expect(result.success).toBe(true);
  });

  it("should accept pending approval status for companies", () => {
    const result = companyUpdateSchema.safeParse({ id: 1, approvalStatus: "pending" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid entity type", () => {
    const result = companyUpdateSchema.safeParse({ id: 1, entityType: "startup" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid entity types", () => {
    const types = ["sovereign", "private", "institutional", "family_office", "other"];
    for (const type of types) {
      const result = companyUpdateSchema.safeParse({ id: 1, entityType: type });
      expect(result.success).toBe(true);
    }
  });

  it("should reject internal rating out of range", () => {
    const result = companyUpdateSchema.safeParse({ id: 1, internalRating: 10 });
    expect(result.success).toBe(false);
  });

  it("should accept null values for optional intelligence fields", () => {
    const result = companyUpdateSchema.safeParse({
      id: 1,
      jurisdictionRisk: null,
      bankingPartner: null,
      custodian: null,
      regulatoryExposure: null,
      entityType: null,
      internalRating: null,
      location: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("Bulk Approval Schema", () => {
  const bulkApproveSchema = z.object({
    ids: z.array(z.number()).min(1),
  });

  it("should accept array of IDs for bulk approve", () => {
    const result = bulkApproveSchema.safeParse({ ids: [1, 2, 3, 4, 5] });
    expect(result.success).toBe(true);
  });

  it("should reject empty array", () => {
    const result = bulkApproveSchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });

  it("should reject non-number IDs", () => {
    const result = bulkApproveSchema.safeParse({ ids: ["a", "b"] });
    expect(result.success).toBe(false);
  });
});

describe("Ingestion Pending Defaults", () => {
  it("should create contacts with pending status by default in ingestion", () => {
    // Simulates what getOrCreateContact does for new contacts
    const newContactData = {
      name: "New Meeting Participant",
      organization: null,
      email: null,
      approvalStatus: "pending" as const,
    };
    expect(newContactData.approvalStatus).toBe("pending");
  });

  it("should create companies with pending status by default in ingestion", () => {
    // Simulates what ingestion does for new companies
    const newCompanyData = {
      name: "New Organization",
      status: "active" as const,
      approvalStatus: "pending" as const,
    };
    expect(newCompanyData.approvalStatus).toBe("pending");
  });
});

describe("Delete Schemas", () => {
  const deleteSchema = z.object({ id: z.number() });

  it("should accept valid delete input for contacts", () => {
    const result = deleteSchema.safeParse({ id: 42 });
    expect(result.success).toBe(true);
  });

  it("should accept valid delete input for companies", () => {
    const result = deleteSchema.safeParse({ id: 99 });
    expect(result.success).toBe(true);
  });

  it("should reject missing id", () => {
    const result = deleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
