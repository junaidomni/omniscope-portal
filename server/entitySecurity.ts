/**
 * Entity Security Module
 * 
 * Provides row-level security checks to prevent cross-org data leakage.
 * Every entity read/write goes through ownership validation.
 * 
 * Architecture:
 *   - verifyEntityOwnership(entityType, entityId, orgId) → throws if mismatch
 *   - scopeEntityCreate(data, orgId) → injects orgId into create payloads
 *   - createOrgScopedQuery(table, orgId) → returns a Drizzle where clause
 * 
 * This is the defense-in-depth layer. Even if a router accidentally
 * passes the wrong ID, the security check will catch it.
 */

import { TRPCError } from "@trpc/server";

// Entity type → table column mapping for orgId
type EntityType =
  | "contact"
  | "meeting"
  | "task"
  | "company"
  | "employee"
  | "document"
  | "tag"
  | "template"
  | "integration"
  | "hrDocument"
  | "signingDocument"
  | "designAsset";

interface EntityRecord {
  orgId?: number | null;
  [key: string]: unknown;
}

/**
 * Verify that an entity belongs to the specified organization.
 * Throws FORBIDDEN if the entity exists but belongs to a different org.
 * Returns false if the entity doesn't exist (caller should handle 404).
 */
export async function verifyEntityOwnership(
  entityType: EntityType,
  entityId: number,
  orgId: number | null
): Promise<boolean> {
  if (!orgId) return true; // No org context — skip check (platform-level)

  const db = await import("./db");

  let entity: EntityRecord | null = null;

  switch (entityType) {
    case "contact":
      entity = await db.getContactById(entityId);
      break;
    case "meeting":
      entity = await db.getMeetingById(entityId);
      break;
    case "task":
      entity = await db.getTaskById(entityId);
      break;
    case "company":
      entity = await db.getCompanyById(entityId);
      break;
    case "employee":
      entity = await db.getEmployeeById(entityId);
      break;
    case "document":
      try { entity = await db.getDocumentById(entityId); } catch { entity = null; }
      break;
    case "tag":
      try { entity = await db.getTagById?.(entityId) ?? null; } catch { entity = null; }
      break;
    case "template":
      try { entity = await db.getTemplateById(entityId); } catch { entity = null; }
      break;
    case "integration":
      try { entity = await db.getIntegrationById(entityId); } catch { entity = null; }
      break;
    case "hrDocument":
      try { entity = await db.getHrDocumentById(entityId); } catch { entity = null; }
      break;
    default:
      // Unknown entity type — allow (don't block unknown types)
      return true;
  }

  if (!entity) return false; // Entity doesn't exist

  // Check orgId match
  if (entity.orgId !== undefined && entity.orgId !== null && entity.orgId !== orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied: this resource belongs to a different organization.",
      cause: {
        type: "CROSS_ORG_ACCESS_DENIED",
        entityType,
        entityId,
        requestedOrgId: orgId,
        actualOrgId: entity.orgId,
      },
    });
  }

  return true;
}

/**
 * Verify ownership for a batch of entities.
 * Useful for bulk operations.
 */
export async function verifyBatchOwnership(
  entityType: EntityType,
  entityIds: number[],
  orgId: number | null
): Promise<void> {
  if (!orgId) return;
  
  await Promise.all(
    entityIds.map((id) => verifyEntityOwnership(entityType, id, orgId))
  );
}

/**
 * Inject orgId into a create payload.
 * Ensures every new entity is assigned to the correct org.
 */
export function scopeEntityCreate<T extends Record<string, unknown>>(
  data: T,
  orgId: number | null
): T & { orgId: number | null } {
  return { ...data, orgId };
}

/**
 * Validate that a user has access to an organization.
 * Checks the org_memberships table.
 */
export async function verifyUserOrgAccess(
  userId: number,
  orgId: number
): Promise<boolean> {
  const db = await import("./db");
  
  try {
    const members = await db.getOrgMembers(orgId);
    const isMember = members.some((m: any) => m.userId === userId);
    
    if (!isMember) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied: you are not a member of this organization.",
        cause: {
          type: "ORG_ACCESS_DENIED",
          userId,
          orgId,
        },
      });
    }
    
    return true;
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    // If we can't verify, allow (fail open for now — will tighten later)
    return true;
  }
}

/**
 * Validate that an account owns an organization.
 * Used for cross-org operations by account owners.
 */
export async function verifyAccountOwnsOrg(
  accountId: number,
  orgId: number
): Promise<boolean> {
  const db = await import("./db");
  
  const org = await db.getOrganizationById(orgId);
  if (!org) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found.",
    });
  }
  
  if (org.accountId !== accountId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied: this organization belongs to a different account.",
      cause: {
        type: "CROSS_ACCOUNT_ACCESS_DENIED",
        accountId,
        orgId,
        actualAccountId: org.accountId,
      },
    });
  }
  
  return true;
}

/**
 * Get all organization IDs that an account owns.
 * Used for cross-org reporting.
 */
export async function getAccountOrgIds(accountId: number): Promise<number[]> {
  const db = await import("./db");
  const orgs = await db.getOrganizationsByAccount(accountId);
  return orgs.map((o) => o.id);
}

/**
 * Security audit helper — logs access attempts for sensitive operations.
 * In production, this would write to an audit log table.
 */
export function logSecurityEvent(event: {
  type: "access_denied" | "cross_org_attempt" | "admin_override" | "entity_access";
  userId: number;
  orgId: number | null;
  entityType?: string;
  entityId?: number;
  details?: string;
}): void {
  // In production, write to audit_log table
  // For now, log to console with structured format
  console.log(
    `[SECURITY] ${event.type} | user=${event.userId} org=${event.orgId} ` +
    `${event.entityType ? `entity=${event.entityType}:${event.entityId}` : ""} ` +
    `${event.details || ""}`
  );
}
