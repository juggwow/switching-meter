import { NextResponse, NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { UserRole } from "@prisma/client";

// This function can be marked `async` if using `await` inside
export default auth((req) => {
  // console.log("===============start=============")
  // console.log(req.nextUrl)
  // console.log(req.auth)
  // console.log("===============end=============")

  const isAuthenticated = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/auth/login";
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin"); // <--- แก้ไขตรงนี้ให้แม่นยำขึ้น

  // 1. Redirect ผู้ใช้ที่ยังไม่ Login ไปหน้า Login
  if (!isAuthenticated && !isLoginPage) {
    const url = new URL("/auth/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 2. Redirect ผู้ใช้ที่ Login แล้ว แต่พยายามเข้าหน้า Login
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // 3. ตรวจสอบสิทธิ์ ADMIN สำหรับหน้า Admin
  // ต้องมั่นใจว่า req.auth มี user และ user.role (ซึ่งเรากำหนดใน JWT callback)
  // และ user.role นั้นเป็น enum ที่ถูกต้อง (ADMIN, PEA, OUTSOURCE)
  if (isAdminPath && (!isAuthenticated || req.auth?.user?.role !== UserRole.ADMIN)) { // <--- ใช้ UserRole.ADMIN
      // ถ้าเข้าถึง Path Admin และ
      //    (ยังไม่ Login หรือ Login แล้วแต่ Role ไม่ใช่ ADMIN)
      return NextResponse.redirect(new URL("/", req.nextUrl.origin)); // Redirect ไปหน้าหลัก
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/picker",
    "/picker/:path",
    "/list",
    "/installation/:path",
    "/installlation/:path",
    "/admin/:path",
    // "/api/:path",
  ],
};
