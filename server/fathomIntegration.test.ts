import { describe, it, expect } from "vitest";
import { isFathomWebhookPayload } from "./fathomIntegration";

describe("Fathom Integration", () => {
  describe("isFathomWebhookPayload", () => {
    it("should accept a valid Fathom webhook payload", () => {
      const payload = {
        title: "Test Meeting",
        meeting_title: "Test Meeting",
        url: "https://fathom.video/xyz123",
        share_url: "https://fathom.video/share/xyz123",
        created_at: "2025-03-01T17:01:30Z",
        recorded_by: {
          name: "Junaid Qureshi",
          email: "junaid@omniscopex.ae",
        },
        calendar_invitees: [
          {
            name: "Test User",
            email: "test@example.com",
            is_external: true,
            email_domain: "example.com",
          },
        ],
        transcript: [
          {
            speaker: { display_name: "Junaid Qureshi" },
            text: "Hello, let's discuss the deal.",
            timestamp: "00:01:00",
          },
        ],
        default_summary: {
          template_name: "general",
          markdown_formatted: "## Summary\nDiscussed the deal.",
        },
        action_items: [
          {
            description: "Send proposal",
            user_generated: false,
            completed: false,
          },
        ],
      };

      expect(isFathomWebhookPayload(payload)).toBe(true);
    });

    it("should accept a minimal Fathom payload with just title and recorded_by", () => {
      const payload = {
        title: "Quick Call",
        recorded_by: {
          name: "Junaid Qureshi",
          email: "junaid@omniscopex.ae",
        },
      };

      expect(isFathomWebhookPayload(payload)).toBe(true);
    });

    it("should accept a payload with meeting_title instead of title", () => {
      const payload = {
        meeting_title: "Quick Call",
        share_url: "https://fathom.video/share/abc",
      };

      expect(isFathomWebhookPayload(payload)).toBe(true);
    });

    it("should reject null", () => {
      expect(isFathomWebhookPayload(null)).toBe(false);
    });

    it("should reject undefined", () => {
      expect(isFathomWebhookPayload(undefined)).toBe(false);
    });

    it("should reject an empty object", () => {
      expect(isFathomWebhookPayload({})).toBe(false);
    });

    it("should reject a string", () => {
      expect(isFathomWebhookPayload("hello")).toBe(false);
    });

    it("should reject an object without title or meeting_title", () => {
      const payload = {
        recorded_by: { name: "Test", email: "test@test.com" },
      };
      expect(isFathomWebhookPayload(payload)).toBe(false);
    });

    it("should reject a standard intelligence data payload", () => {
      const payload = {
        meetingDate: "2025-03-01",
        primaryLead: "Junaid",
        participants: ["Junaid"],
        executiveSummary: "Test summary",
        sourceType: "plaud",
      };
      expect(isFathomWebhookPayload(payload)).toBe(false);
    });
  });

  describe("Fathom API connectivity", () => {
    it("should successfully call the Fathom API", async () => {
      const apiKey = process.env.FATHOM_API_KEY;
      expect(apiKey).toBeDefined();

      const response = await fetch(
        "https://api.fathom.ai/external/v1/meetings?limit=1",
        {
          headers: {
            "X-Api-Key": apiKey!,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("items");
      expect(Array.isArray(data.items)).toBe(true);
    }, 15000);

    it("should list webhooks from Fathom API", async () => {
      const apiKey = process.env.FATHOM_API_KEY;
      expect(apiKey).toBeDefined();

      const response = await fetch(
        "https://api.fathom.ai/external/v1/webhooks",
        {
          headers: {
            "X-Api-Key": apiKey!,
            "Content-Type": "application/json",
          },
        }
      );

      // May return 200 with list or 404 if no webhooks endpoint
      expect([200, 404]).toContain(response.status);
    }, 15000);
  });
});
