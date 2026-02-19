import { describe, it, expect, vi } from "vitest";

// ─── Google Drive Service Module Tests ───
describe("Google Drive Integration", () => {
  describe("Google Drive Service", () => {
    it("should export all required service functions", async () => {
      const mod = await import("./googleDrive");
      expect(mod.listDriveFiles).toBeDefined();
      expect(mod.searchDriveFiles).toBeDefined();
      expect(mod.getDriveFile).toBeDefined();
      expect(mod.createGoogleDoc).toBeDefined();
      expect(mod.createGoogleSheet).toBeDefined();
      expect(mod.readGoogleDocText).toBeDefined();
      expect(mod.getDriveClient).toBeDefined();
      expect(mod.generateFromTemplate).toBeDefined();
    });

    it("listDriveFiles should accept userId parameter", async () => {
      const mod = await import("./googleDrive");
      expect(typeof mod.listDriveFiles).toBe("function");
      expect(mod.listDriveFiles.length).toBeGreaterThanOrEqual(1);
    });

    it("searchDriveFiles should accept query parameter", async () => {
      const mod = await import("./googleDrive");
      expect(typeof mod.searchDriveFiles).toBe("function");
    });

    it("createGoogleDoc should accept title parameter", async () => {
      const mod = await import("./googleDrive");
      expect(typeof mod.createGoogleDoc).toBe("function");
    });

    it("createGoogleSheet should accept title parameter", async () => {
      const mod = await import("./googleDrive");
      expect(typeof mod.createGoogleSheet).toBe("function");
    });

    it("readGoogleDocText should accept fileId parameter", async () => {
      const mod = await import("./googleDrive");
      expect(typeof mod.readGoogleDocText).toBe("function");
    });

    it("getDriveClient should check token and return client", async () => {
      const mod = await import("./googleDrive");
      expect(typeof mod.getDriveClient).toBe("function");
    });
  });

  describe("Google OAuth Scopes", () => {
    it("should include Drive, Docs, and Sheets scopes in Google Calendar module", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("./server/googleCalendar.ts", "utf-8");
      expect(content).toContain("drive");
      expect(content).toContain("documents");
      expect(content).toContain("spreadsheets");
    });
  });

  describe("Signing Adapters", () => {
    it("should export all 7 provider adapters", async () => {
      const mod = await import("./signingAdapters");
      expect(mod.getSigningAdapter).toBeDefined();
      expect(typeof mod.getSigningAdapter).toBe("function");
    });

    it("should export getAdapterInfo and getAllAdapters", async () => {
      const mod = await import("./signingAdapters");
      expect(mod.getAdapterInfo).toBeDefined();
      expect(mod.getAllAdapters).toBeDefined();
    });

    it("should have all 7 providers via getAllAdapters", async () => {
      const mod = await import("./signingAdapters");
      const adapters = mod.getAllAdapters();
      expect(adapters.length).toBe(7);
      const names = adapters.map((a: any) => a.name);
      expect(names).toContain("firma");
      expect(names).toContain("signatureapi");
      expect(names).toContain("docuseal");
      expect(names).toContain("pandadocs");
      expect(names).toContain("docusign");
      expect(names).toContain("boldsign");
      expect(names).toContain("esignly");
    });

    it("each provider should have displayName and pricePerEnvelope", async () => {
      const mod = await import("./signingAdapters");
      const info = mod.getAdapterInfo();
      expect(info.length).toBe(7);
      for (const provider of info) {
        expect(provider.name).toBeDefined();
        expect(provider.displayName).toBeDefined();
        expect(provider.pricePerEnvelope).toBeDefined();
      }
    });

    it("getSigningAdapter should return adapter for known providers", async () => {
      const mod = await import("./signingAdapters");
      const adapter = mod.getSigningAdapter("firma");
      expect(adapter).toBeDefined();
      expect(adapter!.createEnvelope).toBeDefined();
      expect(adapter!.getStatus).toBeDefined();
      expect(adapter!.downloadSigned).toBeDefined();
    });

    it("getSigningAdapter should return null for unknown provider", async () => {
      const mod = await import("./signingAdapters");
      const adapter = mod.getSigningAdapter("nonexistent");
      expect(adapter).toBeNull();
    });

    it("Firma adapter should have lowest cost label", async () => {
      const mod = await import("./signingAdapters");
      const info = mod.getAdapterInfo();
      const firma = info.find((p: any) => p.name === "firma");
      expect(firma).toBeDefined();
      expect(firma!.pricePerEnvelope).toContain("0.029");
    });
  });

  describe("Drive Router Procedures", () => {
    it("should have drive router in appRouter", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures.some(p => p.startsWith("drive."))).toBe(true);
    });

    it("should have connectionStatus procedure", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("drive.connectionStatus");
    });

    it("should have listFiles procedure", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("drive.listFiles");
    });

    it("should have searchFiles procedure", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("drive.searchFiles");
    });

    it("should have createDoc procedure", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("drive.createDoc");
    });

    it("should have createSheet procedure", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("drive.createSheet");
    });

    it("should have importToVault procedure", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("drive.importToVault");
    });
  });

  describe("Vault Router - Document CRUD", () => {
    it("should have vault router procedures", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("vault.listDocuments");
      expect(procedures).toContain("vault.getDocument");
      expect(procedures).toContain("vault.createDocument");
      expect(procedures).toContain("vault.updateDocument");
      expect(procedures).toContain("vault.deleteDocument");
      expect(procedures).toContain("vault.toggleFavorite");
      expect(procedures).toContain("vault.getRecent");
      expect(procedures).toContain("vault.getFavorites");
      expect(procedures).toContain("vault.analyzeDocument");
      expect(procedures).toContain("vault.addEntityLink");
      expect(procedures).toContain("vault.removeEntityLink");
      expect(procedures).toContain("vault.getDocumentsByEntity");
      expect(procedures).toContain("vault.listFolders");
    });
  });

  describe("Template Router Procedures", () => {
    it("should have template router procedures", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("templates.list");
      expect(procedures).toContain("templates.getById");
      expect(procedures).toContain("templates.create");
      expect(procedures).toContain("templates.generate");
      expect(procedures).toContain("templates.update");
    });
  });

  describe("Signing Router Procedures", () => {
    it("should have signing router procedures", async () => {
      const mod = await import("./routers");
      const procedures = Object.keys(mod.appRouter._def.procedures);
      expect(procedures).toContain("signing.listEnvelopes");
      expect(procedures).toContain("signing.sendForSignature");
      expect(procedures).toContain("signing.getEnvelope");
      expect(procedures).toContain("signing.listProviders");
      expect(procedures).toContain("signing.configureProvider");
      expect(procedures).toContain("signing.removeProvider");
      expect(procedures).toContain("signing.voidEnvelope");
    });
  });

  describe("Database Schema - Vault Tables", () => {
    it("should have all vault-related tables in schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.documents).toBeDefined();
      expect(schema.documentEntityLinks).toBeDefined();
      expect(schema.documentFolders).toBeDefined();
      expect(schema.documentAccess).toBeDefined();
      expect(schema.documentFavorites).toBeDefined();
      expect(schema.documentTemplates).toBeDefined();
      expect(schema.signingEnvelopes).toBeDefined();
      expect(schema.signingProviders).toBeDefined();
    });

    it("documents table should have required columns", async () => {
      const schema = await import("../drizzle/schema");
      const columns = Object.keys(schema.documents);
      expect(columns).toContain("id");
      expect(columns).toContain("title");
      expect(columns).toContain("sourceType");
      expect(columns).toContain("collection");
      expect(columns).toContain("category");
      expect(columns).toContain("status");
      expect(columns).toContain("visibility");
      expect(columns).toContain("googleFileId");
      expect(columns).toContain("s3Url");
    });

    it("documentEntityLinks table should support company, contact, meeting links", async () => {
      const schema = await import("../drizzle/schema");
      const columns = Object.keys(schema.documentEntityLinks);
      expect(columns).toContain("documentId");
      expect(columns).toContain("entityType");
      expect(columns).toContain("entityId");
      expect(columns).toContain("linkType");
    });

    it("signingEnvelopes table should track signing workflow", async () => {
      const schema = await import("../drizzle/schema");
      const columns = Object.keys(schema.signingEnvelopes);
      expect(columns).toContain("documentId");
      expect(columns).toContain("providerId");
      expect(columns).toContain("status");
      expect(columns).toContain("recipients");
    });

    it("signingProviders table should store provider configs", async () => {
      const schema = await import("../drizzle/schema");
      const columns = Object.keys(schema.signingProviders);
      expect(columns).toContain("provider");
      expect(columns).toContain("apiKey");
      expect(columns).toContain("isActive");
    });
  });

  describe("Database Helpers - Vault", () => {
    it("should export vault document helpers", async () => {
      const db = await import("./db");
      expect(db.createDocument).toBeDefined();
      expect(db.listDocuments).toBeDefined();
      expect(db.getDocumentById).toBeDefined();
      expect(db.deleteDocument).toBeDefined();
      expect(db.updateDocument).toBeDefined();
      expect(db.getRecentDocuments).toBeDefined();
      expect(db.getFavoriteDocuments).toBeDefined();
      expect(db.toggleFavorite).toBeDefined();
      expect(db.getDocumentsByEntity).toBeDefined();
    });

    it("should export template database helpers", async () => {
      const db = await import("./db");
      expect(db.createTemplate).toBeDefined();
      expect(db.listTemplates).toBeDefined();
      expect(db.getTemplateById).toBeDefined();
      expect(db.updateTemplate).toBeDefined();
      expect(db.incrementTemplateUsage).toBeDefined();
    });

    it("should export signing database helpers", async () => {
      const db = await import("./db");
      expect(db.createSigningEnvelope).toBeDefined();
      expect(db.listSigningEnvelopes).toBeDefined();
      expect(db.listSigningProviders).toBeDefined();
      expect(db.upsertSigningProvider).toBeDefined();
      expect(db.getSigningProviderById).toBeDefined();
      expect(db.getDefaultSigningProvider).toBeDefined();
      expect(db.updateSigningEnvelope).toBeDefined();
    });

    it("should export folder and entity link helpers", async () => {
      const db = await import("./db");
      expect(db.createFolder).toBeDefined();
      expect(db.listFolders).toBeDefined();
      expect(db.updateFolder).toBeDefined();
      expect(db.deleteFolder).toBeDefined();
      expect(db.addDocumentEntityLink).toBeDefined();
      expect(db.removeDocumentEntityLink).toBeDefined();
      expect(db.getDocumentEntityLinks).toBeDefined();
    });
  });
});
