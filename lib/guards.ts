import { type NextRequest, NextResponse } from "next/server";
import { verifyAccess } from "./auth";

export async function verifyAdminAccess(req: NextRequest) {
  const user = await verifyAccess(req, ["SUPER_ADMIN", "ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  return null;
}

export async function verifyAccountingAccess(req: NextRequest) {
  const user = await verifyAccess(req, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);
  if (!user) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  return null;
}

export async function verifyUserAccess(req: NextRequest) {
  const user = await verifyAccess(req, ["INSTRUCTOR", "ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  return null;
}
