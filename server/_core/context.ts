import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  orgId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Extract org ID from X-Org-Id header (sent by frontend OrgContext)
  const rawOrgId = opts.req.headers["x-org-id"];
  const orgId = rawOrgId ? parseInt(String(rawOrgId), 10) : null;

  return {
    req: opts.req,
    res: opts.res,
    user,
    orgId: orgId && !isNaN(orgId) ? orgId : null,
  };
}
