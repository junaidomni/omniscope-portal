import * as db from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { z } from "zod";

export const payrollRouter = router({
  list: protectedProcedure
    .input(z.object({ employeeId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const records = await db.getAllPayrollRecords(input ?? undefined);
      // Enrich with employee name
      const enriched = await Promise.all(records.map(async (r: any) => {
        const emp = await db.getEmployeeById(r.employeeId);
        return { ...r, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown' };
      }));
      return enriched;
    }),

  getForEmployee: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPayrollForEmployee(input.employeeId);
    }),

  create: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      payPeriodStart: z.string(),
      payPeriodEnd: z.string(),
      amount: z.string(),
      currency: z.string().default("USD"),
      paymentMethod: z.enum(["bank_transfer", "check", "crypto", "cash", "wire", "other"]).default("bank_transfer"),
      paymentDate: z.string().optional(),
      status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await db.createPayrollRecord({
        employeeId: input.employeeId,
        payPeriodStart: input.payPeriodStart,
        payPeriodEnd: input.payPeriodEnd,
        amount: input.amount,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate ?? null,
        status: input.status,
        notes: input.notes ?? null,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      payPeriodStart: z.string().optional(),
      payPeriodEnd: z.string().optional(),
      amount: z.string().optional(),
      currency: z.string().optional(),
      paymentMethod: z.enum(["bank_transfer", "check", "crypto", "cash", "wire", "other"]).optional(),
      paymentDate: z.string().nullable().optional(),
      status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
      notes: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const cleanUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) cleanUpdates[key] = value;
      }
      await db.updatePayrollRecord(id, cleanUpdates);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePayrollRecord(input.id);
      return { success: true };
    }),

  uploadReceipt: protectedProcedure
    .input(z.object({ id: z.number(), base64: z.string(), fileName: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, 'base64');
      const key = `payroll/receipts/${input.id}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.updatePayrollRecord(input.id, { receiptUrl: url, receiptKey: key });
      return { url };
    }),

  uploadInvoice: protectedProcedure
    .input(z.object({ id: z.number(), base64: z.string(), fileName: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, 'base64');
      const key = `payroll/invoices/${input.id}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.updatePayrollRecord(input.id, { invoiceUrl: url, invoiceKey: key });
      return { url };
    }),
});
