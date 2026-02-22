import "dotenv/config";
// Force UTC timezone for consistent timestamp handling across all environments.
// Without this, mysql2 serializes Date objects using the local timezone (e.g. EST),
// causing a 5-hour offset when the production server uses a different timezone.
process.env.TZ = 'UTC';

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { webhookRouter } from "../webhookRoute";
import { calendarRouter } from "../calendarRoute";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Webhook endpoint for Plaud/Fathom integration
  app.use("/api", webhookRouter);
  // Auth middleware for non-tRPC API routes
  app.use("/api/google", async (req: any, _res, next) => {
    try {
      req.user = await sdk.authenticateRequest(req);
    } catch {
      req.user = null;
    }
    next();
  });
  app.use("/api/calendar", async (req: any, _res, next) => {
    try {
      req.user = await sdk.authenticateRequest(req);
    } catch {
      req.user = null;
    }
    next();
  });
  app.use("/api/gmail", async (req: any, _res, next) => {
    try {
      req.user = await sdk.authenticateRequest(req);
    } catch {
      req.user = null;
    }
    next();
  });
  // Google Calendar API proxy
  app.use("/api", calendarRouter);
  // Impersonation endpoint — sets httpOnly cookie server-side
  app.get("/api/impersonate", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ error: "Missing token parameter" });
      }
      // Check if current user is platform owner OR if the token itself belongs to a platform owner
      // (the latter allows returning to admin session from an impersonated user)
      let authorized = false;
      try {
        const currentUser = await sdk.authenticateRequest(req);
        if (currentUser?.platformOwner) authorized = true;
      } catch { /* current session may be invalid/expired */ }
      if (!authorized) {
        // Verify the target token belongs to a platform owner (for return-to-admin flow)
        try {
          const { jwtVerify } = await import("jose");
          const { ENV } = await import("./env");
          const secret = new TextEncoder().encode(ENV.cookieSecret);
          const { payload } = await jwtVerify(token, secret) as any;
          if (payload.openId) {
            const dbModule = await import("../db");
            const database = await dbModule.getDb();
            if (database) {
              const { users } = await import("../../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const [targetUser] = await database.select({ platformOwner: users.platformOwner }).from(users).where(eq(users.openId, payload.openId)).limit(1);
              if (targetUser?.platformOwner) authorized = true;
            }
          }
        } catch { /* token verification failed */ }
      }
      if (!authorized) {
        return res.status(403).json({ error: "Platform owner access required" });
      }
      const { getSessionCookieOptions } = await import("./cookies");
      const { COOKIE_NAME } = await import("@shared/const");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 4 }); // 4 hours
      res.redirect(302, "/");
    } catch (err: any) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  });

  // tRPC API with centralized error handling
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, type }) {
        // Centralized server-side error logging for all tRPC procedures
        const severity = error.code === "INTERNAL_SERVER_ERROR" ? "ERROR" : "WARN";
        console[severity === "ERROR" ? "error" : "warn"](
          `[tRPC ${severity}] ${type} ${path ?? "unknown"}: ${error.message}`
        );
        // Log stack trace for internal server errors only
        if (error.code === "INTERNAL_SERVER_ERROR" && error.cause) {
          console.error(`[tRPC] Stack:`, error.cause);
        }
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Seed built-in integrations and feature toggles
  try {
    const { seedBuiltInIntegrations, seedFeatureToggles } = await import("../db");
    await seedBuiltInIntegrations();
    await seedFeatureToggles();
    console.log("[Seed] Built-in integrations and feature toggles seeded");
  } catch (e) {
    console.warn("[Seed] Failed to seed integrations/toggles:", e);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
