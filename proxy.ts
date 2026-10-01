import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// Define which paths require authentication
const protectedPaths = ["/dashboard", "/period", "/schoolYear", "/users"];

// Define which paths require ADMIN role
const adminOnlyPaths = [
  "/admin",
  "/period/add",
  "/period/update",
  "/schoolYear/add",
  "/schoolYear/update",
  "users/add",
  "/users/update",
];

// Define public paths that should skip authentication
const publicPaths = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
];

export async function proxy(
  request: NextRequest,
): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl;

  // Get user from token
  const user = await getUserFromRequest(request);

  // If user is already authenticated and trying to access login/signup, redirect to dashboard
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if path needs protection
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAdminOnly) {
    return NextResponse.next();
  }

  console.log(
    `Middleware: ${pathname} | Token present: ${!!request.cookies.get("token")} | User: ${user?.email || "none"}`,
  );

  // If no user, redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminOnly && user.role !== "ADMIN") {
    // Redirect to home or show forbidden
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // User is authenticated and authorized
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
