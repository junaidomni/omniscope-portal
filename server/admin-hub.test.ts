import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@omniscopex.ae",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("adminHub", () => {
  describe("dashboardOverview", () => {
    it("returns aggregated platform metrics for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.dashboardOverview();

      expect(result).toHaveProperty("organizations");
      expect(result).toHaveProperty("users");
      expect(result).toHaveProperty("meetings");
      expect(result).toHaveProperty("tasks");
      expect(result).toHaveProperty("contacts");
      expect(result).toHaveProperty("companies");
      expect(result).toHaveProperty("integrations");
      expect(result).toHaveProperty("activity");
      expect(result).toHaveProperty("features");

      expect(typeof result.organizations.total).toBe("number");
      expect(typeof result.users.total).toBe("number");
      expect(typeof result.meetings.total).toBe("number");
      expect(typeof result.tasks.total).toBe("number");
      expect(typeof result.contacts.total).toBe("number");
      expect(typeof result.companies.total).toBe("number");
      expect(typeof result.activity.last7Days).toBe("number");
      expect(typeof result.features.enabled).toBe("number");
      expect(typeof result.features.total).toBe("number");
    });

    it("rejects non-admin users without org membership", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.adminHub.dashboardOverview()).rejects.toThrow(
        /Super Admin access required/
      );
    });
  });

  describe("listOrganizations", () => {
    it("returns a list of organizations for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.listOrganizations();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listAllUsers", () => {
    it("returns all users with their memberships", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.listAllUsers();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("email");
        expect(result[0]).toHaveProperty("memberships");
        expect(Array.isArray(result[0].memberships)).toBe(true);
      }
    });
  });

  describe("listAllIntegrations", () => {
    it("returns all integrations", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.listAllIntegrations();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listAllFeatureToggles", () => {
    it("returns all feature toggles", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.listAllFeatureToggles();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("label");
        expect(result[0]).toHaveProperty("enabled");
      }
    });
  });

  describe("getAuditLog", () => {
    it("returns paginated audit log entries", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.getAuditLog({ limit: 10, offset: 0 });

      expect(result).toHaveProperty("logs");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.logs)).toBe(true);
      expect(typeof result.total).toBe("number");
    });
  });

  describe("platformHealth", () => {
    it("returns platform health metrics", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.adminHub.platformHealth();

      expect(result).toHaveProperty("entities");
      expect(result).toHaveProperty("integrations");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.entities.meetings).toBe("number");
      expect(typeof result.entities.tasks).toBe("number");
      expect(typeof result.entities.contacts).toBe("number");
      expect(typeof result.entities.companies).toBe("number");
      expect(typeof result.entities.users).toBe("number");
      expect(Array.isArray(result.integrations)).toBe(true);
    });
  });

  describe("toggleFeature", () => {
    it("toggles a feature flag for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const features = await caller.adminHub.listAllFeatureToggles();
      if (features.length > 0) {
        const toggleable = features.find((f: any) => !f.isLocked);
        if (toggleable) {
          const result = await caller.adminHub.toggleFeature({
            id: toggleable.id,
            enabled: !toggleable.enabled,
          });
          expect(result.success).toBe(true);
          // Toggle it back
          await caller.adminHub.toggleFeature({
            id: toggleable.id,
            enabled: toggleable.enabled,
          });
        }
      }
    });
  });

  describe("getOrgDetail", () => {
    it("returns org detail with members and stats for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const orgs = await caller.adminHub.listOrganizations();
      if (orgs.length > 0) {
        const result = await caller.adminHub.getOrgDetail({ orgId: orgs[0].id });
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("slug");
        expect(result).toHaveProperty("members");
        expect(result).toHaveProperty("integrations");
        expect(result).toHaveProperty("stats");
        expect(Array.isArray(result.members)).toBe(true);
        expect(typeof result.stats.meetings).toBe("number");
        expect(typeof result.stats.tasks).toBe("number");
        expect(typeof result.stats.contacts).toBe("number");
        expect(typeof result.stats.members).toBe("number");
      }
    });

    it("throws NOT_FOUND for non-existent org", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.adminHub.getOrgDetail({ orgId: 999999 })).rejects.toThrow(
        /Organization not found/
      );
    });
  });

  describe("updateOrg", () => {
    it("updates organization name for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const orgs = await caller.adminHub.listOrganizations();
      if (orgs.length > 0) {
        const originalName = orgs[0].name;
        const result = await caller.adminHub.updateOrg({
          orgId: orgs[0].id,
          name: "Test Rename Org",
        });
        expect(result).toHaveProperty("name", "Test Rename Org");
        // Restore original name
        await caller.adminHub.updateOrg({
          orgId: orgs[0].id,
          name: originalName,
        });
      }
    });

    it("rejects empty update", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const orgs = await caller.adminHub.listOrganizations();
      if (orgs.length > 0) {
        await expect(
          caller.adminHub.updateOrg({ orgId: orgs[0].id })
        ).rejects.toThrow(/No fields to update/);
      }
    });
  });

  describe("updateOrgStatus", () => {
    it("updates org status for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const orgs = await caller.adminHub.listOrganizations();
      if (orgs.length > 0) {
        const result = await caller.adminHub.updateOrgStatus({
          orgId: orgs[0].id,
          status: "active",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("access control", () => {
    it("rejects regular users from all hub procedures", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.adminHub.listOrganizations()).rejects.toThrow();
      await expect(caller.adminHub.listAllUsers()).rejects.toThrow();
      await expect(caller.adminHub.listAllIntegrations()).rejects.toThrow();
      await expect(caller.adminHub.listAllFeatureToggles()).rejects.toThrow();
      await expect(caller.adminHub.platformHealth()).rejects.toThrow();
    });

    it("rejects regular users from mutation procedures", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.adminHub.toggleFeature({ id: 1, enabled: false })
      ).rejects.toThrow();
      await expect(
        caller.adminHub.updateOrg({ orgId: 1, name: "hack" })
      ).rejects.toThrow();
      await expect(
        caller.adminHub.updateOrgStatus({ orgId: 1, status: "suspended" })
      ).rejects.toThrow();
    });
  });
});
