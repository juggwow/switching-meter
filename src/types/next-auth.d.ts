// src/types/next-auth.d.ts
// ต้องมี namespace "next-auth"
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client"; // นำเข้า UserRole จาก Prisma

declare module "next-auth" {
  /**
   * ขยาย interface Session เพื่อรวมคุณสมบัติที่กำหนดเอง
   */
  interface Session {
    user: {
      id: string; // เพิ่ม id
      username: string; // เพิ่ม username
      displayname: string;
      role: UserRole; // เพิ่ม role
      // คุณสมบัติอื่นๆ จาก NextAuth.User (name, email, image) ก็จะรวมอยู่ด้วย
    } & DefaultSession["user"];
  }

  /**
   * ขยาย interface User เพื่อรวมคุณสมบัติที่กำหนดเอง (จาก authorize callback)
   */
  interface User {
    id: string;
    username: string;
    displayname: string;
    role: UserRole;
    // name, email, image ก็จะรวมอยู่ด้วย (ถ้ามี)
  }
}

declare module "next-auth/jwt" {
  /**
   * ขยาย interface JWT เพื่อรวมคุณสมบัติที่กำหนดเอง (จาก jwt callback)
   */
  interface JWT {
    id: string;
    username: string;
    displayname: string;
    role: UserRole;
    // name, email, picture, sub, iat, exp, jti ก็จะรวมอยู่ด้วย
  }
}
