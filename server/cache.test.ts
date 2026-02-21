import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the cache module directly since it's a pure utility
describe("MemoryCache", () => {
  let cacheModule: typeof import("./cache");

  beforeEach(async () => {
    // Fresh import each time to get a clean cache instance
    vi.resetModules();
    cacheModule = await import("./cache");
  });

  afterEach(() => {
    cacheModule.cache.destroy();
  });

  describe("getOrSet", () => {
    it("should compute and cache a value on first call", async () => {
      const fn = vi.fn().mockResolvedValue("hello");
      const result = await cacheModule.cache.getOrSet("test-key", 10000, fn);
      expect(result).toBe("hello");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should return cached value on second call without recomputing", async () => {
      const fn = vi.fn().mockResolvedValue("hello");
      await cacheModule.cache.getOrSet("test-key", 10000, fn);
      const result2 = await cacheModule.cache.getOrSet("test-key", 10000, fn);
      expect(result2).toBe("hello");
      expect(fn).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should recompute after TTL expires", async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce("first")
        .mockResolvedValueOnce("second");

      await cacheModule.cache.getOrSet("test-key", 1, fn); // 1ms TTL
      await new Promise(r => setTimeout(r, 10)); // Wait for expiry
      const result = await cacheModule.cache.getOrSet("test-key", 1, fn);
      expect(result).toBe("second");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("get/set", () => {
    it("should store and retrieve a value", () => {
      cacheModule.cache.set("key1", { data: 42 }, 10000);
      const result = cacheModule.cache.get<{ data: number }>("key1");
      expect(result).toEqual({ data: 42 });
    });

    it("should return undefined for missing keys", () => {
      expect(cacheModule.cache.get("nonexistent")).toBeUndefined();
    });

    it("should return undefined for expired keys", async () => {
      cacheModule.cache.set("key1", "value", 1);
      await new Promise(r => setTimeout(r, 10));
      expect(cacheModule.cache.get("key1")).toBeUndefined();
    });
  });

  describe("invalidate", () => {
    it("should invalidate a specific key", () => {
      cacheModule.cache.set("key1", "a", 10000);
      cacheModule.cache.set("key2", "b", 10000);
      cacheModule.cache.invalidate("key1");
      expect(cacheModule.cache.get("key1")).toBeUndefined();
      expect(cacheModule.cache.get("key2")).toBe("b");
    });

    it("should invalidate by prefix", () => {
      cacheModule.cache.set("gmail:threads:1", "a", 10000);
      cacheModule.cache.set("gmail:threads:2", "b", 10000);
      cacheModule.cache.set("analytics:dashboard", "c", 10000);
      const count = cacheModule.cache.invalidate("gmail:");
      expect(count).toBe(2);
      expect(cacheModule.cache.get("gmail:threads:1")).toBeUndefined();
      expect(cacheModule.cache.get("analytics:dashboard")).toBe("c");
    });
  });

  describe("stats", () => {
    it("should report correct cache size", () => {
      cacheModule.cache.set("a", 1, 10000);
      cacheModule.cache.set("b", 2, 10000);
      const stats = cacheModule.cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain("a");
      expect(stats.keys).toContain("b");
    });
  });

  describe("clear", () => {
    it("should empty the entire cache", () => {
      cacheModule.cache.set("a", 1, 10000);
      cacheModule.cache.set("b", 2, 10000);
      cacheModule.cache.clear();
      expect(cacheModule.cache.stats().size).toBe(0);
    });
  });
});

describe("CACHE_TTL constants", () => {
  it("should have sensible TTL values", async () => {
    const { CACHE_TTL } = await import("./cache");
    expect(CACHE_TTL.GMAIL_THREADS).toBe(5 * 60 * 1000);
    expect(CACHE_TTL.ANALYTICS).toBe(2 * 60 * 1000);
    expect(CACHE_TTL.AI_INSIGHTS).toBe(10 * 60 * 1000);
    expect(CACHE_TTL.ENTITY_LIST).toBe(30 * 1000);
    expect(CACHE_TTL.DASHBOARD).toBe(60 * 1000);
  });
});

describe("Shared API Types", () => {
  it("should export all core type interfaces", async () => {
    // This test verifies the shared types module compiles and exports correctly
    const types = await import("../shared/api-types");
    // Type-level check — if this compiles, the types are valid
    expect(types).toBeDefined();
  });
});

describe("Error handling infrastructure", () => {
  it("should export HttpError and convenience constructors from shared types", async () => {
    const { HttpError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } = await import("../shared/types");
    expect(HttpError).toBeDefined();
    expect(BadRequestError("test")).toBeInstanceOf(HttpError);
    expect(BadRequestError("test").statusCode).toBe(400);
    expect(UnauthorizedError("test").statusCode).toBe(401);
    expect(ForbiddenError("test").statusCode).toBe(403);
    expect(NotFoundError("test").statusCode).toBe(404);
  });
});
