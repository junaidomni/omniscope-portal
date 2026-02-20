import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the organizations tRPC router.
 * We mock the db module to isolate router logic from database calls.
 */

// Mock the db module
vi.mock("./db", () => {
  const mockAccount = {
    id: 10,
    name: "Test Account",
    ownerUserId: 1,
    plan: "starter",
    status: "active",
    maxOrganizations: 5,
    maxUsersPerOrg: 25,
    billingEmail: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrg = {
    id: 100,
    accountId: 10,
    name: "Test Org",
    slug: "test-org",
    logoUrl: null,
    accentColor: "#d4af37",
    industry: "Financial Services",
    domain: "test.com",
    timezone: "America/New_York",
    status: "active",
    settings: null,
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership = {
    membership: {
      id: 1,
      userId: 1,
      organizationId: 100,
      role: "account_owner",
      isDefault: true,
      invitedBy: null,
      joinedAt: new Date(),
      updatedAt: new Date(),
    },
    org: mockOrg,
  };

  return {
    getAccountByOwner: vi.fn().mockResolvedValue(mockAccount),
    getUserOrgMemberships: vi.fn().mockResolvedValue([mockMembership]),
    autoProvisionUserAccount: vi.fn().mockResolvedValue(mockAccount),
    createAccount: vi.fn().mockResolvedValue(10),
    getAccountById: vi.fn().mockResolvedValue(mockAccount),
    getOrganizationsByAccount: vi.fn().mockResolvedValue([mockOrg]),
    isOrgSlugAvailable: vi.fn().mockResolvedValue(true),
    createOrganization: vi.fn().mockResolvedValue(200),
    addOrgMembership: vi.fn().mockResolvedValue(1),
    getOrganizationById: vi.fn().mockResolvedValue(mockOrg),
    updateOrganization: vi.fn().mockResolvedValue(undefined),
    getOrgMembership: vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      organizationId: 100,
      role: "account_owner",
      isDefault: true,
      invitedBy: null,
      joinedAt: new Date(),
      updatedAt: new Date(),
    }),
    setDefaultOrg: vi.fn().mockResolvedValue(undefined),
    getOrgMembers: vi.fn().mockResolvedValue([]),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-open-id",
    email: "test@omniscopex.ae",
    name: "Test User",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("organizations router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    caller = appRouter.createCaller(createTestContext());
  });

  describe("getMyOrgs", () => {
    it("returns account and memberships for authenticated user", async () => {
      const result = await caller.organizations.getMyOrgs();

      expect(result).toHaveProperty("account");
      expect(result).toHaveProperty("memberships");
      expect(result.account).toBeTruthy();
      expect(result.account!.id).toBe(10);
      expect(result.memberships).toHaveLength(1);
      expect(result.memberships[0].org.name).toBe("Test Org");
      expect(result.memberships[0].role).toBe("account_owner");
    });
  });

  describe("autoProvision", () => {
    it("provisions account and returns bootstrap data", async () => {
      const result = await caller.organizations.autoProvision();

      expect(result).toHaveProperty("account");
      expect(result).toHaveProperty("memberships");
      expect(result.account).toBeTruthy();
      expect(result.account!.id).toBe(10);
    });
  });

  describe("checkSlug", () => {
    it("returns available=true for unused slug", async () => {
      const result = await caller.organizations.checkSlug({ slug: "new-org" });
      expect(result).toEqual({ available: true });
    });

    it("returns available=false for taken slug", async () => {
      const db = await import("./db");
      (db.isOrgSlugAvailable as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const result = await caller.organizations.checkSlug({ slug: "test-org" });
      expect(result).toEqual({ available: false });
    });
  });

  describe("create", () => {
    it("creates a new organization with valid input", async () => {
      const result = await caller.organizations.create({
        name: "New Org",
        slug: "new-org",
        accentColor: "#3b82f6",
        timezone: "Europe/London",
      });

      expect(result).toBeTruthy();
    });

    it("throws CONFLICT when slug is taken", async () => {
      const db = await import("./db");
      (db.isOrgSlugAvailable as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      await expect(
        caller.organizations.create({
          name: "Dupe Org",
          slug: "taken-slug",
        })
      ).rejects.toThrow("This slug is already taken");
    });

    it("throws FORBIDDEN when org limit reached", async () => {
      const db = await import("./db");
      const orgs = Array(5).fill({
        id: 1,
        accountId: 10,
        name: "Org",
        slug: "org",
      });
      (db.getOrganizationsByAccount as ReturnType<typeof vi.fn>).mockResolvedValueOnce(orgs);

      await expect(
        caller.organizations.create({
          name: "Over Limit",
          slug: "over-limit",
        })
      ).rejects.toThrow("Organization limit reached");
    });
  });

  describe("update", () => {
    it("updates org name when user has permission", async () => {
      const result = await caller.organizations.update({
        orgId: 100,
        name: "Updated Org Name",
      });

      expect(result).toBeTruthy();
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      const db = await import("./db");
      (db.getOrgMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 1,
        userId: 1,
        organizationId: 100,
        role: "viewer",
        isDefault: true,
      });

      await expect(
        caller.organizations.update({
          orgId: 100,
          name: "Hacked Name",
        })
      ).rejects.toThrow("You don't have permission");
    });
  });

  describe("getById", () => {
    it("returns org and membership for a member", async () => {
      const result = await caller.organizations.getById({ orgId: 100 });
      expect(result).toHaveProperty("org");
      expect(result).toHaveProperty("membership");
      expect(result.org!.id).toBe(100);
    });

    it("throws FORBIDDEN when user is not a member", async () => {
      const db = await import("./db");
      (db.getOrgMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        caller.organizations.getById({ orgId: 999 })
      ).rejects.toThrow("You are not a member");
    });
  });

  describe("switchOrg", () => {
    it("switches default org for a member", async () => {
      const result = await caller.organizations.switchOrg({ orgId: 100 });
      expect(result).toBeTruthy();
    });

    it("throws FORBIDDEN when switching to non-member org", async () => {
      const db = await import("./db");
      (db.getOrgMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        caller.organizations.switchOrg({ orgId: 999 })
      ).rejects.toThrow("You are not a member");
    });
  });

  describe("getMembers", () => {
    it("returns members for an org the user belongs to", async () => {
      const result = await caller.organizations.getMembers({ orgId: 100 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("throws FORBIDDEN when user is not a member", async () => {
      const db = await import("./db");
      (db.getOrgMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        caller.organizations.getMembers({ orgId: 999 })
      ).rejects.toThrow("You are not a member");
    });
  });
});
