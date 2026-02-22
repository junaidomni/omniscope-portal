/**
 * Phase H Continued Tests — Account Provisioning (H-8), Super-Admin Management (H-6),
 * Account Security / Login History (H-3e)
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPlatformOwnerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "platform-owner",
    email: "junaid@omniscopex.ae",
    name: "Junaid Qureshi",
    loginMethod: "manus",
    role: "admin",
    platformOwner: true,
    onboardingCompleted: true,
    profilePhotoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    orgId: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    platformOwner: false,
    onboardingCompleted: true,
    profilePhotoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    orgId: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    orgId: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller;

// ============================================================================
// H-8: Account Provisioning
// ============================================================================
describe("H-8: Account Provisioning (adminHub.provisionAccount)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.provisionAccount({
      accountName: "Test Account",
      plan: "starter",
      billingCycle: "monthly",
    })).rejects.toThrow();
  });

  it("rejects non-platform-owner access", async () => {
    const ctx = createRegularUserContext();
    const api = caller(ctx);
    await expect(api.adminHub.provisionAccount({
      accountName: "Test Account",
      plan: "starter",
      billingCycle: "monthly",
    })).rejects.toThrow();
  });

  it("validates required accountName field", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    await expect(api.adminHub.provisionAccount({
      accountName: "",
      plan: "starter",
      billingCycle: "monthly",
    })).rejects.toThrow();
  });

  it("validates plan field accepts valid plans", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    // Invalid plan should throw
    await expect(api.adminHub.provisionAccount({
      accountName: "Test Account",
      plan: "invalid_plan" as any,
      billingCycle: "monthly",
    })).rejects.toThrow();
  });

  it("validates billingCycle field accepts valid cycles", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    // Invalid billing cycle should throw
    await expect(api.adminHub.provisionAccount({
      accountName: "Test Account",
      plan: "starter",
      billingCycle: "invalid_cycle" as any,
    })).rejects.toThrow();
  });

  it("accepts valid provisioning input for platform owner", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    // This should not throw on input validation
    // It may throw on DB operations, but the input should be valid
    try {
      await api.adminHub.provisionAccount({
        accountName: "Acme Capital Partners",
        plan: "professional",
        billingCycle: "monthly",
        billingEmail: "billing@acme.com",
        orgName: "Acme Capital",
        orgSlug: "acme-capital",
        industry: "Financial Services",
        notes: "New client onboarding",
      });
    } catch (e: any) {
      // DB errors are acceptable (e.g., user not found), but input validation should pass
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ============================================================================
// H-6: Super-Admin Management
// ============================================================================
describe("H-6: Super-Admin Management (adminHub.listPlatformOwners)", () => {
  it("returns platform owners list for platform owner", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.adminHub.listPlatformOwners();
    expect(Array.isArray(result)).toBe(true);
    // Should include at least the current platform owner
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Each entry should have expected fields
    const owner = result[0];
    expect(owner).toHaveProperty("id");
    expect(owner).toHaveProperty("name");
    expect(owner).toHaveProperty("email");
    expect(owner).toHaveProperty("platformOwner", true);
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.listPlatformOwners()).rejects.toThrow();
  });

  it("rejects non-platform-owner access", async () => {
    const ctx = createRegularUserContext();
    const api = caller(ctx);
    await expect(api.adminHub.listPlatformOwners()).rejects.toThrow();
  });
});

describe("H-6: Super-Admin Grant/Revoke (adminHub.hubGrantPlatformOwner)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.hubGrantPlatformOwner({ userId: 999 })).rejects.toThrow();
  });

  it("rejects non-platform-owner access", async () => {
    const ctx = createRegularUserContext();
    const api = caller(ctx);
    await expect(api.adminHub.hubGrantPlatformOwner({ userId: 999 })).rejects.toThrow();
  });

  it("rejects granting to non-existent user", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    await expect(api.adminHub.hubGrantPlatformOwner({ userId: 999999 })).rejects.toThrow();
  });
});

describe("H-6: Super-Admin Revoke (adminHub.hubRevokePlatformOwner)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.hubRevokePlatformOwner({ userId: 1 })).rejects.toThrow();
  });

  it("rejects non-platform-owner access", async () => {
    const ctx = createRegularUserContext();
    const api = caller(ctx);
    await expect(api.adminHub.hubRevokePlatformOwner({ userId: 1 })).rejects.toThrow();
  });

  it("prevents revoking own platform owner access", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    // Trying to revoke own access should be prevented
    await expect(api.adminHub.hubRevokePlatformOwner({ userId: 1 })).rejects.toThrow();
  });
});

describe("H-6: Audit Trail (adminHub.getPlatformOwnerAuditTrail)", () => {
  it("returns audit trail for platform owner", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.adminHub.getPlatformOwnerAuditTrail();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.getPlatformOwnerAuditTrail()).rejects.toThrow();
  });
});

// ============================================================================
// H-3e: Account Security / Login History
// ============================================================================
describe("H-3e: Account Security (accountConsole.loginHistory)", () => {
  it("returns login history for authenticated user", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.accountConsole.loginHistory();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.accountConsole.loginHistory()).rejects.toThrow();
  });
});

describe("H-3e: Record Login (accountConsole.recordLogin)", () => {
  it("records login event for authenticated user", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.accountConsole.recordLogin({
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120",
      method: "oauth",
    });
    expect(result).toEqual({ success: true });
  });

  it("records login without optional fields", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.accountConsole.recordLogin({});
    expect(result).toEqual({ success: true });
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.accountConsole.recordLogin({})).rejects.toThrow();
  });

  it("login history includes recorded entries", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    // Record a login
    await api.accountConsole.recordLogin({
      ipAddress: "10.0.0.1",
      userAgent: "TestAgent/1.0",
      method: "oauth",
    });
    // Fetch history
    const history = await api.accountConsole.loginHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    // Check the most recent entry
    const latest = history[0];
    expect(latest).toHaveProperty("userId", 1);
    expect(latest).toHaveProperty("success", true);
  });
});

// ============================================================================
// H-6: Login History for Admin Hub (adminHub.loginHistoryForUser)
// ============================================================================
describe("H-6: Admin Login History (adminHub.getLoginHistory)", () => {
  it("returns login history for a specific user", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.adminHub.getLoginHistory({ userId: 1 });
    expect(result).toHaveProperty("entries");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.getLoginHistory({ userId: 1 })).rejects.toThrow();
  });

  it("rejects non-platform-owner access", async () => {
    const ctx = createRegularUserContext();
    const api = caller(ctx);
    await expect(api.adminHub.getLoginHistory({ userId: 1 })).rejects.toThrow();
  });
});

describe("H-6: Admin Record Login (adminHub.recordLogin)", () => {
  it("records login event for platform owner", async () => {
    const ctx = createPlatformOwnerContext();
    const api = caller(ctx);
    const result = await api.adminHub.recordLogin({
      userId: 1,
      success: true,
      ipAddress: "192.168.1.100",
      userAgent: "TestBrowser/2.0",
      loginMethod: "oauth",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthenticatedContext();
    const api = caller(ctx);
    await expect(api.adminHub.recordLogin({
      userId: 1,
      success: true,
    })).rejects.toThrow();
  });
});
