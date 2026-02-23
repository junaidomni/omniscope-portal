import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import * as db from "../db";

export const fileUploadRouter = router({
  // Upload file for message attachment
  uploadMessageAttachment: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Decode base64
      const buffer = Buffer.from(input.fileData, "base64");

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `chat-attachments/${input.channelId}/${timestamp}-${randomSuffix}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Store attachment metadata in database
      const attachment = await db.createMessageAttachment({
        messageId: null, // Will be set when message is created
        fileKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        url,
      });

      return {
        id: attachment.id,
        url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      };
    }),

  // Add reaction to message
  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        emoji: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reaction = await db.addMessageReaction({
        messageId: input.messageId,
        userId: ctx.user.id,
        emoji: input.emoji,
      });

      return reaction;
    }),

  // Remove reaction from message
  removeReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        emoji: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.removeMessageReaction({
        messageId: input.messageId,
        userId: ctx.user.id,
        emoji: input.emoji,
      });

      return { success: true };
    }),
});
