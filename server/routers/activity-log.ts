import * as db from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const activityLogRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      action: z.string().optional(),
      entityType: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getActivityLog({
        limit: input?.limit || 50,
        offset: input?.offset || 0,
        action: input?.action,
        entityType: input?.entityType,
        startDate: input?.startDate ? new Date(input.startDate) : undefined,
        endDate: input?.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  exportAll: protectedProcedure
    .input(z.object({
      action: z.string().optional(),
      entityType: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Fetch ALL entries (no limit) for CSV export
      return await db.getActivityLog({
        limit: 10000,
        offset: 0,
        action: input?.action,
        entityType: input?.entityType,
      });
    }),

  actions: protectedProcedure.query(async () => {
    // Return distinct action types for filter dropdown
    return [
      "approve_contact", "reject_contact", "merge_contacts",
      "bulk_approve_contacts", "bulk_reject_contacts",
      "approve_company", "reject_company",
      "bulk_approve_companies", "bulk_reject_companies",
      "approve_suggestion", "reject_suggestion",
      "bulk_approve_suggestions", "bulk_reject_suggestions",
      "dedup_merge", "dedup_dismiss",
    ];
  }),
});
