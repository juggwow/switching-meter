// src/app/admin/users/actions.ts
'use server';

import { userFormSchema } from '@/shema/user-form';
import { Prisma, PrismaClient, User, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs'; // สำหรับ Hash รหัสผ่าน
import { z } from 'zod'; // สำหรับ Input Validation

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "12345678"; // รหัสผ่านเริ่มต้นสำหรับผู้ใช้งานใหม่

// Interface สำหรับพารามิเตอร์การดึงผู้ใช้งาน (สำหรับ Pagination/Filter)
interface FetchUsersParams {
  page: number;
  pageSize: number;
  searchUsername?: string; // ค้นหาตาม username
  filterRole?: UserRole;   // กรองตามบทบาท
  sortBy?: 'username' | 'createdAt'; // จัดเรียงตาม username หรือ createdAt
  sortOrder?: 'asc' | 'desc'; // ลำดับการจัดเรียง
}

// Interface สำหรับผลลัพธ์การดึงผู้ใช้งานหลายคน
export interface FetchUsersResult {
  users: User[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

// --- Fetch Users (ดึงข้อมูลผู้ใช้งานทั้งหมดพร้อม Pagination/Filter) ---
export async function fetchUsers({
  page,
  pageSize,
  searchUsername,
  filterRole,
  sortBy = 'createdAt', // ค่าเริ่มต้น
  sortOrder = 'desc',   // ค่าเริ่มต้น
}: FetchUsersParams): Promise<FetchUsersResult> {
  try {
    const skip = (page - 1) * pageSize;
    let where: Prisma.UserWhereInput = {};
    let orderBy: Prisma.UserOrderByWithRelationInput = {};

    if (searchUsername) {
      where.username = { contains: searchUsername, mode: 'insensitive' };
    }
    if (filterRole) {
      where.role = filterRole;
    }

    if (sortBy && (sortOrder === 'asc' || sortOrder === 'desc')) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc'; // จัดเรียงตามวันที่สร้างล่าสุด
    }

    const users = await prisma.user.findMany({
      skip,
      take: pageSize,
      where,
      orderBy,
    });

    const totalCount = await prisma.user.count({ where });

    // ทำความสะอาดข้อมูลผู้ใช้งานก่อนส่งไปยัง Client (เช่น ลบ password hash)
    const sanitizedUsers = users.map(user => {
      const { password, ...rest } = user; // แยก password ออกไป
      return {
        ...rest,
      };
    }) as User[]; // Cast กลับเป็น User[] (โดยไม่มี password hash)

    return {
      users: sanitizedUsers,
      totalCount,
      currentPage : page,
      pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
  }
}

// --- Fetch Single User by ID (ดึงข้อมูลผู้ใช้งานคนเดียว) ---
export async function fetchUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    // ทำความสะอาดข้อมูลผู้ใช้งานก่อนส่ง
    const { password, ...rest } = user;
    return {
      ...rest,
    } as User;
  } catch (error) {
    console.error("Failed to fetch user by ID:", error);
    throw new Error("ไม่สามารถดึงรายละเอียดผู้ใช้งานได้");
  }
}

// --- Create User (สร้างผู้ใช้งานใหม่) ---
export async function createUser(data: z.infer<typeof userFormSchema>): Promise<User> {
  try {
    // Validate Input ด้วย Zod
    const validatedData = userFormSchema.parse(data);

    // Hash รหัสผ่านเริ่มต้น
    const hashedPassword = await hash(DEFAULT_PASSWORD, 10); // 10 คือจำนวนรอบของ Salt

    const newUser = await prisma.user.create({
      data: {
        username: validatedData.username,
        displayname: validatedData.displayname,
        password: hashedPassword,
        role: validatedData.role,
      },
    });

    // ทำความสะอาดข้อมูลและคืนค่า
    const { password, ...rest } = newUser;
    return {
      ...rest,
    } as User;
  } catch (error: any) {
    console.error("Failed to create user:", error);
    if (error instanceof z.ZodError) {
        // ข้อผิดพลาดจากการ Validate ของ Zod
        throw new Error("ข้อมูลไม่ถูกต้อง: " + error.errors.map(e => e.message).join(', '));
    }
    if (error.code === 'P2002' && error.meta?.target && (error.meta.target as string[]).includes('username')) {
        // ข้อผิดพลาดจาก Prisma (Unique Constraint violation)
        throw new Error('ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว');
    }
    throw new Error("ไม่สามารถสร้างผู้ใช้งานได้");
  }
}

// --- Update User (อัปเดตข้อมูลผู้ใช้งาน) ---
export async function updateUser(id: string, data: z.infer<typeof userFormSchema>): Promise<User> {
  try {
    const validatedData = userFormSchema.parse(data); // Validate Input

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username: validatedData.username,
        role: validatedData.role,
        // รหัสผ่านจะ **ไม่** ถูกอัปเดตผ่าน Form นี้ เพื่อความปลอดภัย ควรมี Flow Reset Password แยกต่างหาก
      },
    });

    // ทำความสะอาดข้อมูลและคืนค่า
    const { password, ...rest } = updatedUser;
    return {
      ...rest
    } as User;
  } catch (error: any) {
    console.error("Failed to update user:", error);
    if (error instanceof z.ZodError) {
        throw new Error("ข้อมูลไม่ถูกต้อง: " + error.errors.map(e => e.message).join(', '));
    }
    if (error.code === 'P2002' && error.meta?.target && (error.meta.target as string[]).includes('username')) {
        throw new Error('ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว');
    }
    throw new Error("ไม่สามารถอัปเดตผู้ใช้งานได้");
  }
}

// --- Delete User (ลบผู้ใช้งาน) ---
export async function deleteUser(id: string): Promise<User> {
  try {
    const deletedUser = await prisma.user.delete({ where: { id } });
    // ทำความสะอาดข้อมูลและคืนค่า
    const { password, ...rest } = deletedUser;
    return {
      ...rest,
    } as User;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("ไม่สามารถลบผู้ใช้งานได้");
  }
}