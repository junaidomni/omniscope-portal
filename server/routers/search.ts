import * as db from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const searchRouter = router({
  global: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return await db.globalSearch(input.query);
    }),
});
