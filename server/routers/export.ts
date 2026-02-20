import * as reportExporter from "../reportExporter";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const exportRouter = router({
  dailySummary: protectedProcedure
    .input(z.object({ date: z.string().optional() }))
    .mutation(async ({ input }) => {
      const date = input.date ? new Date(input.date) : new Date();
      return await reportExporter.exportDailySummaryMarkdown(date);
    }),
  
  weeklySummary: protectedProcedure
    .input(z.object({ weekStart: z.string().optional() }))
    .mutation(async ({ input }) => {
      let weekStart: Date;
      if (input.weekStart) {
        weekStart = new Date(input.weekStart);
      } else {
        const now = new Date();
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
      }
      return await reportExporter.exportWeeklySummaryMarkdown(weekStart);
    }),
  
  customRange: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .mutation(async ({ input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await reportExporter.exportCustomRangeMarkdown(startDate, endDate);
    }),
});
