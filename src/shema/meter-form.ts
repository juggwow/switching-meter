import z from "zod";

export const meterFormSchema = z.object({
  peaNoNew: z.string().min(1, "กรุณากรอกหมายเลข PEA No."),
  issuerName: z.string(),
  issueDate: z.date(), // เปลี่ยนจาก string เป็น date
  ca: z.string().optional(),
  newMeterPhoto: z.instanceof(File),
});

export type MeterFormData = z.infer<typeof meterFormSchema>;
