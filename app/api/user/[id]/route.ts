import type { Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

const getSession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

const isAdminRole = (role: string) =>
  role === "ADMIN" || role === "SUPER_ADMIN";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    // Only an administrator or the user themselves can view full details
    if (!isAdminRole(session.role) && session.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/user/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    // Only an administrator or the user themselves can update
    if (!isAdminRole(session.role) && session.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, status, oldPassword, newPassword } = body;

    const currentUser = await prisma.user.findUnique({
      where: { userId },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // CDC 2.1: administrator accounts are managed by the super administrator only
    const sessionIsSuper = session.role === "SUPER_ADMIN";
    const targetIsAdmin = isAdminRole(currentUser.role);
    if (targetIsAdmin && !sessionIsSuper && session.userId !== userId) {
      return NextResponse.json(
        {
          message:
            "Only a super administrator can manage an administrator account",
        },
        { status: 403 },
      );
    }

    const updateData: {
      name?: string;
      email?: string;
      role?: Role;
      status?: Status;
      password?: string;
    } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();

    // CDC 3.2: activation and deactivation of accounts
    if (status) {
      if (status !== "ACTIVE" && status !== "INACTIVE") {
        return NextResponse.json(
          { message: "Invalid status" },
          { status: 400 },
        );
      }
      if (!isAdminRole(session.role)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (session.userId === userId) {
        return NextResponse.json(
          { message: "You cannot change your own account status" },
          { status: 400 },
        );
      }
      if (targetIsAdmin && !sessionIsSuper) {
        return NextResponse.json(
          {
            message:
              "Only a super administrator can manage an administrator account",
          },
          { status: 403 },
        );
      }
      updateData.status = status;
    }

    if (role && role !== currentUser.role) {
      if (!isAdminRole(session.role)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if ((targetIsAdmin || isAdminRole(role)) && !sessionIsSuper) {
        return NextResponse.json(
          {
            message:
              "Only a super administrator can grant or change administrator roles",
          },
          { status: 403 },
        );
      }
      updateData.role = role;
    }

    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json(
          { message: "Old password is required to set a new password" },
          { status: 400 },
        );
      }

      const isMatch = await bcrypt.compare(oldPassword, currentUser.password);
      if (!isMatch) {
        return NextResponse.json(
          { message: "Current password (old password) is incorrect" },
          { status: 400 },
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT /api/user/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    // CDC 2.1: prevent self-deletion
    if (session.userId === userId) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });
    if (!target) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // CDC 2.1: only the super administrator can delete an administrator account
    if (isAdminRole(target.role) && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          message:
            "Only a super administrator can delete an administrator account",
        },
        { status: 403 },
      );
    }

    await prisma.user.delete({
      where: { userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/user/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
