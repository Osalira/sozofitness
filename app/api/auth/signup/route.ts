import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { logger } from "@/lib/logger";

// 🔒 SECURITY: Industry standard bcrypt cost factor (2026)
const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // 🔒 SECURITY: Generic error to prevent user enumeration
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email or contact support." },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Hash password with strong cost factor
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user (role defaults to 'client' if not specified)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: role && Object.values(UserRole).includes(role) ? role : UserRole.client,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // If user is a coach, create Coach record
    if (user.role === UserRole.coach) {
      await prisma.coach.create({
        data: {
          userId: user.id,
        },
      });
    }

    // 🔒 SECURITY: Log without PII
    logger.info("User created successfully", {
      userId: user.id,
      role: user.role,
    });

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (error) {
    // 🔒 SECURITY: Log error without exposing sensitive data
    logger.error("Signup error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
