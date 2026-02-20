import * as askOmniScope from "../askOmniScope";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const askRouter = router({
  ask: protectedProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ input }) => {
      return await askOmniScope.askOmniScope(input.query);
    }),

  // Full chat procedure with multi-turn conversation and full database context
  chat: protectedProcedure
    .input(z.object({
      query: z.string(),
      context: z.string().optional(), // current page context
      entityId: z.string().optional(), // current entity being viewed
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      return await askOmniScope.chat(
        input.query,
        input.history || [],
        input.context,
        input.entityId
      );
    }),
  
  findByParticipant: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return await askOmniScope.findMeetingsByParticipant(input.name);
    }),
  
  findByOrganization: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return await askOmniScope.findMeetingsByOrganization(input.name);
    }),
});


const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});
