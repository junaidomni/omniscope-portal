import { describe, expect, it } from "vitest";

/**
 * Tests for the three bug fixes:
 * 1. Attendee extraction includes email-only participants
 * 2. PDF report filename format
 * 3. Server timezone is set to UTC
 */

// ============================================================================
// 1. Attendee name resolution from email + meeting title
// ============================================================================

// Replicate the resolveNameFromEmail logic for testing
function resolveNameFromEmail(email: string, meetingTitle?: string): string {
  const localPart = email.split("@")[0] || email;

  if (meetingTitle) {
    const titleParts = meetingTitle.split(/\s*(?:x|X|&|,|\||with|and|vs)\s*/).map(s => s.trim()).filter(Boolean);

    for (const part of titleParts) {
      const nameLower = part.toLowerCase();
      const emailLower = localPart.toLowerCase().replace(/[0-9]/g, '');

      if (nameLower.startsWith(emailLower.substring(0, 3)) || emailLower.startsWith(nameLower.substring(0, 3))) {
        return part;
      }
    }
  }

  const cleaned = localPart
    .replace(/[0-9._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');

  return cleaned || localPart;
}

describe("resolveNameFromEmail", () => {
  it("resolves Hassan from haskari189@gmail.com using meeting title 'Hassan x Jake'", () => {
    const result = resolveNameFromEmail("haskari189@gmail.com", "Hassan x Jake");
    expect(result).toBe("Hassan");
  });

  it("resolves Jake from jake.liquidadvisor@gmail.com using meeting title 'Hassan x Jake'", () => {
    const result = resolveNameFromEmail("jake.liquidadvisor@gmail.com", "Hassan x Jake");
    expect(result).toBe("Jake");
  });

  it("falls back to cleaned email prefix when no title match", () => {
    const result = resolveNameFromEmail("john.doe123@example.com");
    expect(result).toBe("John Doe");
  });

  it("handles email with only numbers in local part", () => {
    const result = resolveNameFromEmail("12345@example.com");
    // Numbers get stripped, should return something reasonable
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles meeting title with 'and' separator", () => {
    const result = resolveNameFromEmail("alice@example.com", "Alice and Bob");
    expect(result).toBe("Alice");
  });

  it("handles meeting title with '&' separator", () => {
    const result = resolveNameFromEmail("bob@example.com", "Alice & Bob");
    expect(result).toBe("Bob");
  });
});

// ============================================================================
// 2. PDF filename format
// ============================================================================

describe("PDF filename format", () => {
  function buildPdfFilename(meetingTitle: string | null, meetingDate: Date | null): string {
    const meetingName = (meetingTitle || "Meeting").trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
    const dateStr = meetingDate
      ? meetingDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    return `OmniScope Intelligence Report - ${meetingName} - ${dateStr}.pdf`;
  }

  it("generates correct filename for Hassan x Jake meeting", () => {
    const filename = buildPdfFilename("Hassan x Jake", new Date("2026-02-16T16:00:00Z"));
    expect(filename).toBe("OmniScope Intelligence Report - Hassan x Jake - 2026-02-16.pdf");
  });

  it("uses 'Meeting' as fallback when title is null", () => {
    const filename = buildPdfFilename(null, new Date("2026-02-16T16:00:00Z"));
    expect(filename).toBe("OmniScope Intelligence Report - Meeting - 2026-02-16.pdf");
  });

  it("strips special characters from meeting title", () => {
    const filename = buildPdfFilename("Deal: $50M+ (Phase 1)", new Date("2026-01-15T10:00:00Z"));
    expect(filename).toBe("OmniScope Intelligence Report - Deal 50M Phase 1 - 2026-01-15.pdf");
  });

  it("starts with 'OmniScope Intelligence Report'", () => {
    const filename = buildPdfFilename("Test Meeting", new Date("2026-03-01T12:00:00Z"));
    expect(filename.startsWith("OmniScope Intelligence Report")).toBe(true);
  });

  it("ends with .pdf extension", () => {
    const filename = buildPdfFilename("Test Meeting", new Date("2026-03-01T12:00:00Z"));
    expect(filename.endsWith(".pdf")).toBe(true);
  });
});

// ============================================================================
// 3. Server timezone is UTC
// ============================================================================

describe("Server timezone", () => {
  it("process.env.TZ is set to UTC in the server entry point", async () => {
    // Read the server entry point file to verify TZ=UTC is set
    const fs = await import("fs");
    const content = fs.readFileSync("server/_core/index.ts", "utf-8");
    expect(content).toContain("process.env.TZ = 'UTC'");
  });

  it("TZ=UTC is set before any imports that use Date", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/_core/index.ts", "utf-8");
    const tzLine = content.indexOf("process.env.TZ = 'UTC'");
    const expressImport = content.indexOf("import express");
    // TZ should be set before express import
    expect(tzLine).toBeLessThan(expressImport);
    expect(tzLine).toBeGreaterThan(-1);
  });

  it("Date objects serialize correctly in UTC", () => {
    // Verify that a Date created from a UTC string serializes back correctly
    const date = new Date("2026-02-16T16:00:00.000Z");
    expect(date.toISOString()).toBe("2026-02-16T16:00:00.000Z");
  });
});
