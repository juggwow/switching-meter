import { NextResponse, NextRequest } from "next/server";
import { auth } from "./lib/auth";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (
    session.user.role != "ADMIN" &&
    request.nextUrl.pathname.match(/^\/admin/)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/picker",
    "/picker/:path",
    "/list",
    "/installation/:path",
    "/installlation/:path",
    "/admin/:path",
    "/api/:path",
  ],
};
