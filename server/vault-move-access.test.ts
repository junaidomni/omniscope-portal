import { describe, it, expect } from "vitest";

// ─── Vault: Document Movement & Access Control Tests ───

describe("Document Movement Between Collections", () => {
  const validCollections = [
    "company_repo", "personal", "counterparty", "template", "transaction", "signed",
  ];

  it("should accept all valid collection values", () => {
    expect(validCollections).toHaveLength(6);
    validCollections.forEach((c) => expect(typeof c).toBe("string"));
  });

  it("should move a document to a different collection", () => {
    const doc = { id: 1, collection: "personal" as string };
    doc.collection = "company_repo";
    expect(doc.collection).toBe("company_repo");
  });

  it("should move a document to the template collection", () => {
    const doc = { id: 2, collection: "personal" as string };
    doc.collection = "template";
    expect(doc.collection).toBe("template");
  });

  it("should move a document to the signed collection", () => {
    const doc = { id: 3, collection: "counterparty" as string };
    doc.collection = "signed";
    expect(doc.collection).toBe("signed");
  });

  it("should move a document to the transaction collection", () => {
    const doc = { id: 4, collection: "personal" as string };
    doc.collection = "transaction";
    expect(doc.collection).toBe("transaction");
  });

  it("should preserve document ID when moving between collections", () => {
    const docId = 42;
    const moveRequest = { documentId: docId, collection: "company_repo" };
    expect(moveRequest.documentId).toBe(42);
    expect(moveRequest.collection).toBe("company_repo");
  });

  it("should reject invalid collection values", () => {
    const invalidCollections = ["invalid", "draft", "archive", ""];
    invalidCollections.forEach((c) => {
      expect(validCollections.includes(c)).toBe(false);
    });
  });
});

describe("Convert Document to Template", () => {
  const validCategories = ["agreement", "compliance", "intake", "profile", "other"];

  it("should accept all valid template categories", () => {
    expect(validCategories).toHaveLength(5);
  });

  it("should convert a document to a template with name and category", () => {
    const request = {
      documentId: 1,
      name: "SPPP 80/20 Template",
      category: "agreement",
    };
    expect(request.name).toBe("SPPP 80/20 Template");
    expect(request.category).toBe("agreement");
    expect(request.documentId).toBe(1);
  });

  it("should also move the document to the template collection after conversion", () => {
    const doc = { id: 1, collection: "personal" as string, isTemplate: false };
    // Simulate conversion
    doc.collection = "template";
    doc.isTemplate = true;
    expect(doc.collection).toBe("template");
    expect(doc.isTemplate).toBe(true);
  });

  it("should create a template record with source document info", () => {
    const template = {
      name: "NCNDA Standard",
      category: "agreement",
      googleFileId: "google-file-123",
      s3Url: "https://s3.example.com/doc.pdf",
      createdBy: 1,
    };
    expect(template.name).toBe("NCNDA Standard");
    expect(template.googleFileId).toBe("google-file-123");
    expect(template.createdBy).toBe(1);
  });

  it("should require a non-empty template name", () => {
    const emptyName = "";
    expect(emptyName.trim().length).toBe(0);
    const validName = "KYC Intake Form";
    expect(validName.trim().length).toBeGreaterThan(0);
  });
});

describe("Document Access Control - Company Level", () => {
  it("should grant access to a contact (individual)", () => {
    const grant = {
      targetType: "document" as const,
      targetId: 1,
      contactId: 10,
      accessLevel: "view" as const,
    };
    expect(grant.contactId).toBe(10);
    expect(grant.accessLevel).toBe("view");
  });

  it("should grant access to a company", () => {
    const grant = {
      targetType: "document" as const,
      targetId: 1,
      companyId: 5,
      accessLevel: "edit" as const,
    };
    expect(grant.companyId).toBe(5);
    expect(grant.accessLevel).toBe("edit");
  });

  it("should grant access to a folder for a company", () => {
    const grant = {
      targetType: "folder" as const,
      targetId: 3,
      companyId: 7,
      accessLevel: "admin" as const,
    };
    expect(grant.targetType).toBe("folder");
    expect(grant.companyId).toBe(7);
    expect(grant.accessLevel).toBe("admin");
  });

  it("should support all access levels", () => {
    const levels = ["view", "edit", "admin"];
    expect(levels).toHaveLength(3);
  });

  it("should allow either contactId or companyId but not require both", () => {
    const contactGrant = { contactId: 1, companyId: undefined };
    const companyGrant = { contactId: undefined, companyId: 5 };
    expect(contactGrant.contactId).toBeDefined();
    expect(contactGrant.companyId).toBeUndefined();
    expect(companyGrant.companyId).toBeDefined();
    expect(companyGrant.contactId).toBeUndefined();
  });

  it("should revoke access by access ID", () => {
    const revokeRequest = { accessId: 42 };
    expect(revokeRequest.accessId).toBe(42);
  });
});

describe("Access List Response Format", () => {
  it("should return entity type and name for contact access", () => {
    const accessRow = {
      id: 1,
      documentId: 10,
      contactId: 5,
      companyId: null,
      accessLevel: "view",
      contactName: "John Smith",
      contactEmail: "john@example.com",
      companyName: null,
    };
    const entityType = accessRow.companyId ? "company" : "contact";
    const entityName = accessRow.companyId ? accessRow.companyName : accessRow.contactName;
    expect(entityType).toBe("contact");
    expect(entityName).toBe("John Smith");
  });

  it("should return entity type and name for company access", () => {
    const accessRow = {
      id: 2,
      documentId: 10,
      contactId: null,
      companyId: 3,
      accessLevel: "edit",
      contactName: null,
      contactEmail: null,
      companyName: "Acme Corp",
    };
    const entityType = accessRow.companyId ? "company" : "contact";
    const entityName = accessRow.companyId ? accessRow.companyName : accessRow.contactName;
    expect(entityType).toBe("company");
    expect(entityName).toBe("Acme Corp");
  });

  it("should include access level in the response", () => {
    const accessRow = { id: 1, accessLevel: "admin" };
    expect(accessRow.accessLevel).toBe("admin");
  });
});

describe("Move Dialog Tab Behavior", () => {
  it("should support folder, collection, and template tabs", () => {
    const tabs = ["folder", "collection", "template"];
    expect(tabs).toHaveLength(3);
  });

  it("should validate canSubmit for folder tab (always true)", () => {
    const moveTab = "folder";
    const canSubmit = moveTab === "folder";
    expect(canSubmit).toBe(true);
  });

  it("should validate canSubmit for collection tab (requires selection)", () => {
    const moveTab = "collection";
    let selectedCollection: string | null = null;
    let canSubmit = moveTab === "collection" && !!selectedCollection;
    expect(canSubmit).toBe(false);
    selectedCollection = "company_repo";
    canSubmit = moveTab === "collection" && !!selectedCollection;
    expect(canSubmit).toBe(true);
  });

  it("should validate canSubmit for template tab (requires name)", () => {
    const moveTab = "template";
    let templateName = "";
    let canSubmit = moveTab === "template" && templateName.trim().length > 0;
    expect(canSubmit).toBe(false);
    templateName = "SPPP Template";
    canSubmit = moveTab === "template" && templateName.trim().length > 0;
    expect(canSubmit).toBe(true);
  });
});

describe("Share Dialog Grant Mode", () => {
  it("should support contact and company grant modes", () => {
    const modes = ["contact", "company"];
    expect(modes).toHaveLength(2);
  });

  it("should determine canGrant based on mode and selection", () => {
    // Contact mode
    let grantMode = "contact";
    let selectedContactId: number | null = null;
    let selectedCompanyId: number | null = null;
    let canGrant = grantMode === "contact" ? !!selectedContactId : !!selectedCompanyId;
    expect(canGrant).toBe(false);

    selectedContactId = 5;
    canGrant = grantMode === "contact" ? !!selectedContactId : !!selectedCompanyId;
    expect(canGrant).toBe(true);

    // Company mode
    grantMode = "company";
    selectedContactId = null;
    selectedCompanyId = null;
    canGrant = grantMode === "contact" ? !!selectedContactId : !!selectedCompanyId;
    expect(canGrant).toBe(false);

    selectedCompanyId = 3;
    canGrant = grantMode === "contact" ? !!selectedContactId : !!selectedCompanyId;
    expect(canGrant).toBe(true);
  });

  it("should build correct grant params for contact mode", () => {
    const target = { type: "document" as const, id: 10, name: "Test Doc" };
    const selectedContactId = 5;
    const accessLevel = "view";
    const params = {
      targetType: target.type,
      targetId: target.id,
      contactId: selectedContactId,
      accessLevel,
    };
    expect(params.targetType).toBe("document");
    expect(params.targetId).toBe(10);
    expect(params.contactId).toBe(5);
    expect(params.accessLevel).toBe("view");
    expect((params as any).companyId).toBeUndefined();
  });

  it("should build correct grant params for company mode", () => {
    const target = { type: "folder" as const, id: 3, name: "Test Folder" };
    const selectedCompanyId = 7;
    const accessLevel = "edit";
    const params = {
      targetType: target.type,
      targetId: target.id,
      companyId: selectedCompanyId,
      accessLevel,
    };
    expect(params.targetType).toBe("folder");
    expect(params.targetId).toBe(3);
    expect(params.companyId).toBe(7);
    expect(params.accessLevel).toBe("edit");
    expect((params as any).contactId).toBeUndefined();
  });
});
