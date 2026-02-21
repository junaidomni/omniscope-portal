/**
 * Digest Router — manages digest preferences and generates daily/weekly reports.
 * 
 * Endpoints:
 *   - getPreferences: Get current user's digest preferences
 *   - updatePreferences: Update digest frequency, sections, delivery method
 *   - previewDaily: Generate and preview a daily digest
 *   - previewWeekly: Generate and preview a weekly digest
 *   - generateDaily: Generate and deliver a daily digest
 *   - generateWeekly: Generate and deliver a weekly digest
 */

import { orgScopedProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as digestGenerator from "../digestGenerator";
import * as db from "../db";
import { digestPreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";



export const digestRouter = router({
  /**
   * Get current user's digest preferences.
   * Creates default preferences if none exist.
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");
    
    const existing = await database
      .select()
      .from(digestPreferences)
      .where(eq(digestPreferences.userId, ctx.user.id))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create default preferences
    const account = await db.autoProvisionUserAccount(ctx.user.id, ctx.user.name || "User");
    const [created] = await database
      .insert(digestPreferences)
      .values({
        userId: ctx.user.id,
        accountId: account.id,
        dailyDigestEnabled: true,
        weeklyDigestEnabled: true,
        dailyDigestTime: "08:00",
        weeklyDigestDay: "monday",
        weeklyDigestTime: "09:00",
        timezone: "America/New_York",
        crossOrgConsolidated: true,
        includeMeetingSummaries: true,
        includeTaskOverview: true,
        includeContactActivity: true,
        includeAiInsights: true,
        includeUpcomingCalendar: true,
        includeKpiMetrics: true,
        deliveryMethod: "both",
      })
      .$returningId();

    const [newPrefs] = await database
      .select()
      .from(digestPreferences)
      .where(eq(digestPreferences.id, created.id))
      .limit(1);

    return newPrefs;
  }),

  /**
   * Update digest preferences.
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        dailyDigestEnabled: z.boolean().optional(),
        weeklyDigestEnabled: z.boolean().optional(),
        dailyDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        weeklyDigestDay: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
        weeklyDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        timezone: z.string().optional(),
        crossOrgConsolidated: z.boolean().optional(),
        includeMeetingSummaries: z.boolean().optional(),
        includeTaskOverview: z.boolean().optional(),
        includeContactActivity: z.boolean().optional(),
        includeAiInsights: z.boolean().optional(),
        includeUpcomingCalendar: z.boolean().optional(),
        includeKpiMetrics: z.boolean().optional(),
        deliveryMethod: z.enum(["in_app", "email", "both"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      
      // Ensure preferences exist
      const existing = await database
        .select()
        .from(digestPreferences)
        .where(eq(digestPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Digest preferences not found. Call getPreferences first.");
      }

      const updateData: Record<string, any> = {};
      if (input.dailyDigestEnabled !== undefined) updateData.dailyDigestEnabled = input.dailyDigestEnabled;
      if (input.weeklyDigestEnabled !== undefined) updateData.weeklyDigestEnabled = input.weeklyDigestEnabled;
      if (input.dailyDigestTime !== undefined) updateData.dailyDigestTime = input.dailyDigestTime;
      if (input.weeklyDigestDay !== undefined) updateData.weeklyDigestDay = input.weeklyDigestDay;
      if (input.weeklyDigestTime !== undefined) updateData.weeklyDigestTime = input.weeklyDigestTime;
      if (input.timezone !== undefined) updateData.timezone = input.timezone;
      if (input.crossOrgConsolidated !== undefined) updateData.crossOrgConsolidated = input.crossOrgConsolidated;
      if (input.includeMeetingSummaries !== undefined) updateData.includeMeetingSummaries = input.includeMeetingSummaries;
      if (input.includeTaskOverview !== undefined) updateData.includeTaskOverview = input.includeTaskOverview;
      if (input.includeContactActivity !== undefined) updateData.includeContactActivity = input.includeContactActivity;
      if (input.includeAiInsights !== undefined) updateData.includeAiInsights = input.includeAiInsights;
      if (input.includeUpcomingCalendar !== undefined) updateData.includeUpcomingCalendar = input.includeUpcomingCalendar;
      if (input.includeKpiMetrics !== undefined) updateData.includeKpiMetrics = input.includeKpiMetrics;
      if (input.deliveryMethod !== undefined) updateData.deliveryMethod = input.deliveryMethod;

      if (Object.keys(updateData).length > 0) {
        await database
          .update(digestPreferences)
          .set(updateData)
          .where(eq(digestPreferences.userId, ctx.user.id));
      }

      const [updated] = await database
        .select()
        .from(digestPreferences)
        .where(eq(digestPreferences.userId, ctx.user.id))
        .limit(1);

      return updated;
    }),

  /**
   * Preview daily digest — generates without sending.
   * For account owners: cross-org consolidated.
   * For org members: single-org.
   */
  previewDaily: orgScopedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const date = input?.date ? new Date(input.date) : new Date();
      
      // Check if user is account owner (gets cross-org digest)
      const account = await db.autoProvisionUserAccount(ctx.user.id, ctx.user.name || "User");
      const orgs = await db.getOrganizationsByAccount(account.id);
      
      if (orgs.length > 1) {
        // Account owner with multiple orgs — cross-org digest
        return await digestGenerator.generateDailyDigest(account.id, date);
      } else {
        // Single org — org-specific digest
        return await digestGenerator.generateSingleOrgDailyDigest(ctx.orgId, date);
      }
    }),

  /**
   * Preview weekly digest.
   */
  previewWeekly: orgScopedProcedure
    .input(z.object({ weekStart: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      let weekStart: Date;
      if (input?.weekStart) {
        weekStart = new Date(input.weekStart);
      } else {
        const now = new Date();
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
      }
      
      const account = await db.autoProvisionUserAccount(ctx.user.id, ctx.user.name || "User");
      const orgs = await db.getOrganizationsByAccount(account.id);
      
      if (orgs.length > 1) {
        return await digestGenerator.generateWeeklyDigest(account.id, weekStart);
      } else {
        // For single org, generate via the account but it will only have one section
        return await digestGenerator.generateWeeklyDigest(account.id, weekStart);
      }
    }),

  /**
   * Get digest history — list of previously generated digests.
   * (Placeholder for future implementation with stored digests)
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx }) => {
      // Future: query stored digest records
      return {
        digests: [],
        total: 0,
      };
    }),
});
