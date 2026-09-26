import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid email or password",
        },
        { status: 400 },
      );
    }
    const isMatching = await bcrypt.compare(password, user.password);
    if (!isMatching) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 400 },
      );
    }

    // CDC 3.1: inactive accounts must not be able to sign in
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { message: "This account is deactivated. Contact the administration." },
        { status: 403 },
      );
    }

    const token = await signToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      { message: "Login successful", role: user.role },
      { status: 200 },
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 3600,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
