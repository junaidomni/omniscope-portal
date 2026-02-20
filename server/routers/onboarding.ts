import * as db from "../db";
import { getGoogleAuthUrl, isGoogleConnected, syncGoogleCalendarEvents } from "../googleCalendar";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

export const onboardingRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const googleStatus = await isGoogleConnected(ctx.user.id);
    return {
      onboardingCompleted: ctx.user.onboardingCompleted ?? false,
      googleConnected: googleStatus.connected,
      hasGmailScopes: googleStatus.hasGmailScopes ?? false,
      hasCalendarScopes: googleStatus.hasCalendarScopes ?? false,
      googleEmail: googleStatus.email ?? null,
    };
  }),

  complete: protectedProcedure.mutation(async ({ ctx }) => {
    await db.completeOnboarding(ctx.user.id);
    return { success: true };
  }),
});

// PROFILE ROUTER (Signature System)
