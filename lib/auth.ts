import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "ACCOUNTANT"
  | "INSTRUCTOR"
  | "STUDENT"
  | "PARENT";

export interface JWTPayload {
  userId: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

/**
 * Get the JWT_SECRET from environment variables as a Uint8Array.
 */
function getEncodedSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a new JWT token.
 * @param payload - The user data to encode in the token.
 * @param expiresInSeconds - Token expiration time in seconds (default: 3600 = 1h).
 */
export async function signToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresInSeconds: number = 3600,
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getEncodedSecret());
}

/**
 * Verify a JWT token and return its payload.
 * @param token - The JWT string to verify.
 * @returns The decoded payload or null if invalid.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Get the current user from cookies (for Server Components / API Routes).
 * @returns The user payload or null if not authenticated.
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Get the current user from a NextRequest (for Middleware / API Routes).
 * @param request - The incoming NextRequest.
 * @returns The user payload or null if not authenticated.
 */
export async function getUserFromRequest(
  request: NextRequest,
): Promise<JWTPayload | null> {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Check if a user has one of the required roles.
 * @param user - The JWT payload.
 * @param allowedRoles - An array of allowed roles.
 */
export function hasRole(
  user: JWTPayload | null,
  allowedRoles: Role[],
): boolean {
  if (!user) {
    return false;
  }
  return allowedRoles.includes(user.role);
}

/**
 * Check if the current user (from request or cookies) is an administrator.
 * @param request - Optional NextRequest for use in middleware or API routes.
 */
export async function isAdminUser(
  request?: NextRequest | Request,
): Promise<boolean> {
  let user: JWTPayload | null;

  if (request instanceof Request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];
    // Note: getUserFromRequest expects NextRequest, but Request is often compatible enough
    // or we can handle cookie extraction manually if needed.
    // For API routes, using cookies() is usually sufficient.
    user = token ? await verifyToken(token) : null;
  } else {
    user = await getCurrentUser();
  }

  return user?.role === "ADMIN";
}

export async function verifyAccess(
  req: NextRequest,
  allowedRoles: Role[],
): Promise<JWTPayload | null> {
  const user = await getUserFromRequest(req);
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }
  return user;
}
