// src/auth.ts
import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
// import { PrismaAdapter } from "@auth/prisma-adapter"; // <--- ลบการนำเข้านี้

const prisma = new PrismaClient();

export const authOptions: NextAuthConfig = {
  // ลบ adapter ออกไป
  // adapter: PrismaAdapter(prisma), // <--- ลบบรรทัดนี้

  // กำหนด Session Strategy เป็น JWT
  session: {
    strategy: "jwt", // <--- สำคัญมาก: ใช้ JWT strategy
    maxAge: 365 * 24 * 60 * 60, // 30 วัน
  },
  // กำหนด Pages สำหรับ Authentication Flow
  pages: {
    signIn: "/auth/login", // หน้า Login ที่คุณจะสร้าง
  },
  // กำหนด Providers (CredentialsProvider เหมือนเดิม)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // <--- Ensure a try...catch block here
          const count = await prisma.user.count();
          if (count == 0) {
            const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
            if (!adminPassword) {
              throw new Error("ไม่ได้กำหนดรหัสผ่านเริ่มต้นสำหรับ Admin");
            }
            const hashedPassword = await hash(adminPassword, 10);
            await prisma.user.create({
              data: {
                username: "admin",
                password: hashedPassword,
                displayname: "admin",
                role: "ADMIN",
              },
            });
          }
          
          if (!credentials?.username || !credentials?.password) {
            throw new Error("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
          }

          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username as string,
            },
          });

          if (!user) {
            throw new Error("ชื่อผู้ใช้งานไม่ถูกต้อง");
          }

          const isPasswordValid = await compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("รหัสผ่านไม่ถูกต้อง");
          }

          return {
            id: user.id,
            username: user.username,
            displayname: user.displayname,
            role: user.role,
          };
        } catch (error: any) {
          // Log the error for debugging
          console.error("Authorization error:", error);
          // Rethrow the error as an Auth.js compatible Error.
          // The message will be displayed to the user.
          if (error instanceof Error) {
            throw error; // If it's already an Error, rethrow it
          }
          // For unexpected errors, throw a generic message
          throw new Error("เข้าสู่ระบบไม่สำเร็จ");
        }
      },
    }),
  ],
  // Callbacks สำหรับการปรับแต่ง JWT และ Session (สำคัญมากสำหรับ JWT strategy)
  callbacks: {
    async jwt({ token, user }) {
      // เมื่อ Login สำเร็จ (user มีค่า) หรือ Refresh Token (user ไม่มีค่า)
      if (user) {
        // เพิ่มข้อมูล User ที่ต้องการลงใน JWT Token payload
        // ต้องกำหนด Type ของ token ให้ถูกต้องด้วยใน next-auth.d.ts (ดูขั้นตอนถัดไป)
        token.id = user.id;
        token.role = user.role;
        token.displayname = user.displayname;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // เมื่อ Session ถูกสร้าง หรือมีการเรียกใช้ useSession()
      // ดึงข้อมูลจาก JWT Token มาใส่ใน session.user Object
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole; // ต้องกำหนด Type UserRole ให้กับ session.user.role
        session.user.username = token.username as string;
        session.user.displayname = token.displayname;
      }
      return session;
    },
  },
};

const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);

export { GET, POST, auth, signIn, signOut }; // <--- Export โดยตรง
