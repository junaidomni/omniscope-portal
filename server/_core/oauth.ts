import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if this is the owner (always allowed)
      const isOwner = userInfo.openId === ENV.ownerOpenId;
      
      // Check if user already exists in the system
      const existingUser = await db.getUserByOpenId(userInfo.openId);
      
      if (!isOwner && !existingUser) {
        // New user — check if they have an invitation
        const email = userInfo.email?.toLowerCase();
        let invitation = null;
        
        if (email) {
          invitation = await db.getInvitationByEmail(email);
        }
        
        if (!invitation) {
          // No invitation found — redirect to access denied page
          res.redirect(302, "/access-denied");
          return;
        }
        
        // Invitation found — create user with the invited role
        await db.upsertUser({
          openId: userInfo.openId,
          name: invitation.fullName || userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          role: invitation.role,
          lastSignedIn: new Date(),
        });
        
        // Link the invitation to the new user
        const newUser = await db.getUserByOpenId(userInfo.openId);
        if (newUser) {
          await db.acceptInvitation(invitation.id, newUser.id);
        }
      } else {
        // Existing user or owner — update as normal
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        });
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
