import { describe, it, expect } from "vitest";

const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";

describe("Fathom API Key Validation", () => {
  it("should authenticate with the Fathom API using the stored key", async () => {
    const apiKey = process.env.FATHOM_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);

    // Call the Fathom API to list meetings (limit 1) to validate the key
    const response = await fetch(`${FATHOM_API_BASE}/meetings?limit=1`, {
      headers: {
        "X-Api-Key": apiKey!,
        "Content-Type": "application/json",
      },
    });

    // A valid key should return 200; invalid returns 401/403
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);

    console.log(`[Fathom] API key valid. Found ${data.items.length} meeting(s).`);
    if (data.items.length > 0) {
      const meeting = data.items[0];
      console.log(`[Fathom] Latest meeting: "${meeting.title || meeting.meeting_title}" at ${meeting.created_at}`);
      console.log(`[Fathom] Recorded by: ${meeting.recorded_by?.name} (${meeting.recorded_by?.email})`);
    }
  }, 15000);

  it("should fetch a meeting with transcript and summary when requested", async () => {
    const apiKey = process.env.FATHOM_API_KEY;
    expect(apiKey).toBeDefined();

    // Fetch meetings with transcript and summary included
    const response = await fetch(
      `${FATHOM_API_BASE}/meetings?limit=1&include_transcript=true&include_summary=true&include_action_items=true`,
      {
        headers: {
          "X-Api-Key": apiKey!,
          "Content-Type": "application/json",
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.items.length).toBeGreaterThan(0);

    const meeting = data.items[0];
    console.log(`[Fathom] Meeting with details: "${meeting.title}"`);
    console.log(`[Fathom] Has transcript: ${!!meeting.transcript}`);
    console.log(`[Fathom] Has summary: ${!!meeting.default_summary}`);
    console.log(`[Fathom] Has action items: ${!!meeting.action_items}`);
    console.log(`[Fathom] Invitees: ${meeting.calendar_invitees?.length || 0}`);
  }, 30000);
});
