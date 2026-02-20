import * as analytics from "../analytics";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const analyticsRouter = router({
  dashboard: protectedProcedure.query(async () => {
    return await analytics.getDashboardMetrics();
  }),
  
  dailySummary: protectedProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ input }) => {
      const date = input.date ? new Date(input.date) : new Date();
      return await analytics.getDailySummary(date);
    }),
  
  weeklySummary: protectedProcedure
    .input(z.object({ weekStart: z.string().optional() }))
    .query(async ({ input }) => {
      let weekStart: Date;
      if (input.weekStart) {
        weekStart = new Date(input.weekStart);
      } else {
        const now = new Date();
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
      }
      return await analytics.getWeeklySummary(weekStart);
    }),
});
