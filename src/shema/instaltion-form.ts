import z from "zod";

export const installationFormSchema = z.object({
  id: z.string(),
  ca: z.string().optional(),
  reson: z.string(),
  peaNoNew: z.string().min(1, "กรุณากรอกหมายเลข PEA No."),
  newMeterImage: z.instanceof(File),
  peaNoOld: z.string().min(1, "กรุณากรอกหมายเลข PEA No."),
  installationName: z.string(),
  installationDate: z.date(), // เปลี่ยนจาก string เป็น date
  oldMeterImage: z.instanceof(File),
  unitOld: z.coerce.number().min(0, "กรุณาระบุหน่วยมิเตอร์เก่าที่ถูกต้อง"),
  unitNew: z.coerce.number().min(0, "กรุณาระบุหน่วยมิเตอร์ใหม่ที่ถูกต้อง"),
  installationLocation: z.string(),
});

export type InstallationFormData = z.infer<typeof installationFormSchema>;
