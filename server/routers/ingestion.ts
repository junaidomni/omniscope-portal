import * as fathomIntegration from "../fathomIntegration";
import { TRPCError } from "@trpc/server";
import { processIntelligenceData, validateIntelligenceData } from "../ingestion";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const ingestionRouter = router({
  webhook: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      const data = validateIntelligenceData(input);
      if (!data) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid intelligence data format" });
      const result = await processIntelligenceData(data);
      return result;
    }),

  syncFathom: protectedProcedure
    .mutation(async () => {
      try {
        const result = await fathomIntegration.importFathomMeetings({ limit: 10 });
        return { success: true, imported: result.imported, skipped: result.skipped, errors: result.errors };
      } catch (error: any) {
        console.error("[Fathom Sync] Error:", error.message);
        return { success: false, imported: 0, skipped: 0, errors: 1 };
      }
    }),
});
