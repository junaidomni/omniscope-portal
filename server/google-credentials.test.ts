import { describe, it, expect } from "vitest";

describe("Google OAuth2 Credentials", () => {
  it("should have GOOGLE_CLIENT_ID set", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId!.length).toBeGreaterThan(10);
    // Google Client IDs typically end with .apps.googleusercontent.com
    console.log(`GOOGLE_CLIENT_ID is set (length: ${clientId!.length})`);
  });

  it("should have GOOGLE_CLIENT_SECRET set", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret!.length).toBeGreaterThan(5);
    console.log(`GOOGLE_CLIENT_SECRET is set (length: ${clientSecret!.length})`);
  });

  it("should be able to create OAuth2 client", async () => {
    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://example.com/api/google/callback"
    );
    expect(oauth2Client).toBeDefined();

    // Generate auth URL to verify credentials format is valid
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
    });
    expect(authUrl).toContain("accounts.google.com");
    expect(authUrl).toContain(process.env.GOOGLE_CLIENT_ID);
    console.log("OAuth2 client created successfully, auth URL generated");
  });
});
