import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const templateRouter = router({
  list: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.listTemplates(input || undefined);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const template = await db.getTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      return template;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(["agreement", "compliance", "intake", "profile", "other"]).default("agreement"),
      subcategory: z.string().optional(),
      googleFileId: z.string().optional(),
      s3Url: z.string().optional(),
      mergeFieldSchema: z.string().optional(), // JSON string
      defaultRecipientRoles: z.string().optional(), // JSON string
    }))
    .mutation(async ({ input, ctx }) => {
      return db.createTemplate({ ...input, createdBy: ctx.user!.id });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(["agreement", "compliance", "intake", "profile", "other"]).optional(),
      subcategory: z.string().optional(),
      mergeFieldSchema: z.string().optional(),
      defaultRecipientRoles: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateTemplate(id, data);
    }),

  // Generate a document from a template with merge fields
  generate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      mergeFields: z.record(z.string()), // { "{{client_name}}": "Wintermute", ... }
      title: z.string(), // generated document title
      entityLinks: z.array(z.object({
        entityType: z.enum(["company", "contact", "meeting"]),
        entityId: z.number(),
        linkType: z.enum(["primary", "related", "mentioned", "generated_for", "signed_by"]).default("generated_for"),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const template = await db.getTemplateById(input.templateId);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      // Create document record
      const doc = await db.createDocument({
        title: input.title,
        sourceType: "generated",
        collection: "counterparty",
        category: template.category as any,
        subcategory: template.subcategory || undefined,
        status: "draft",
        visibility: "organization",
        ownerId: ctx.user!.id,
        isTemplate: false,
      });
      if (!doc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create document" });

      // Add entity links
      if (input.entityLinks) {
        for (const link of input.entityLinks) {
          await db.addDocumentEntityLink({ documentId: doc.id!, entityType: link.entityType, entityId: link.entityId, linkType: link.linkType });
        }
      }

      // Increment template usage
      await db.incrementTemplateUsage(input.templateId);

      // Log activity
      await db.logActivity({
        userId: ctx.user!.id,
        action: "document_generated",
        entityType: "document",
        entityId: String(doc.id),
        entityName: input.title,
        details: JSON.stringify({ templateId: input.templateId, templateName: template.name }),
      });

      return doc;
    }),
});
