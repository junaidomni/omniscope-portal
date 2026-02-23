import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const notificationsRouter = router({
  // Subscribe to push notifications
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Check if subscription already exists
      const existing = await db.select()
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.endpoint, input.endpoint)
        ))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, message: 'Already subscribed' };
      }

      // Insert new subscription
      await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        createdAt: Date.now()
      });

      return { success: true, message: 'Subscribed to push notifications' };
    }),

  // Unsubscribe from push notifications
  unsubscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      await db.delete(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.endpoint, input.endpoint)
        ));

      return { success: true, message: 'Unsubscribed from push notifications' };
    }),

  // Get notification preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user.id)
      });

      return user?.notificationPreferences || {
        callNotifications: true,
        soundVolume: 80,
        deliveryMethod: 'both'
      };
    }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      callNotifications: z.boolean().optional(),
      soundVolume: z.number().min(0).max(100).optional(),
      deliveryMethod: z.enum(['browser', 'in-app', 'both']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Get current preferences
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user.id)
      });

      const currentPrefs = user?.notificationPreferences || {
        callNotifications: true,
        soundVolume: 80,
        deliveryMethod: 'both'
      };

      // Merge with new preferences
      const newPrefs = {
        ...currentPrefs,
        ...input
      };

      // Update in database
      await db.update(users)
        .set({ notificationPreferences: JSON.stringify(newPrefs) })
        .where(eq(users.id, ctx.user.id));

      return { success: true, preferences: newPrefs };
    })
});
