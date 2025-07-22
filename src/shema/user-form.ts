// src/schemas/user-form.ts
import { z } from "zod";

// กำหนด Zod Enum ที่ตรงกับ Prisma Enum
export const userRoleEnum = z.enum(["PEA", "OUTSOURCE", "ADMIN"]);

// Schema สำหรับข้อมูล Form ที่ผู้ใช้กรอก
export const userFormSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร").max(50, "ชื่อผู้ใช้งานต้องไม่เกิน 50 ตัวอักษร"),
  displayname: z.string().min(3, "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร").max(50, "ชื่อผู้ใช้งานต้องไม่เกิน 50 ตัวอักษร"),
  role: userRoleEnum, // ใช้ enum ที่กำหนดไว้
});

// Type ที่ใช้สำหรับข้อมูลจาก Form
export type UserFormData = z.infer<typeof userFormSchema>;

// Note: รหัสผ่านจะไม่ถูกใส่ใน userFormSchema เพราะไม่ได้ให้ผู้ใช้กรอกโดยตรง
// แต่จะถูกจัดการใน Server Action