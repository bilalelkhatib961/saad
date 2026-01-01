import { NextResponse, type NextRequest } from "next/server";
import { adminAuthCookieName, verifyAdminToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin/signin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(adminAuthCookieName)?.value;

  if (!token) {
    const redirectUrl = new URL("/admin/signin", request.url);
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await verifyAdminToken(token);
    return NextResponse.next();
  } catch (error) {
    console.warn("Invalid admin token", error);
    const redirectUrl = new URL("/admin/signin", request.url);
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
