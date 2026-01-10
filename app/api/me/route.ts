import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateE164Phone } from "@/lib/notifications/sms";

/**
 * GET /api/me
 * Get current user's profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneE164: true,
        smsOptIn: true,
        phoneVerifiedAt: true,
        emailOptIn: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/me
 * Update current user's profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phoneE164, smsOptIn, emailOptIn, name, preferredLocale } = body;

    const updateData: any = {};

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }

    // Update phone number if provided
    if (phoneE164 !== undefined) {
      if (phoneE164 && !validateE164Phone(phoneE164)) {
        return NextResponse.json(
          { error: "Invalid phone number format. Must be E.164 format (e.g., +16045551234)" },
          { status: 400 }
        );
      }
      updateData.phoneE164 = phoneE164?.trim() || null;
      // Clear verification if phone changed
      if (phoneE164 !== session.user.id) {
        updateData.phoneVerifiedAt = null;
      }
    }

    // Update SMS opt-in if provided
    if (smsOptIn !== undefined) {
      updateData.smsOptIn = smsOptIn;
    }

    // Update email opt-in if provided
    if (emailOptIn !== undefined) {
      updateData.emailOptIn = emailOptIn;
    }

    // Update preferred locale if provided
    if (preferredLocale !== undefined) {
      if (preferredLocale === "en" || preferredLocale === "fr") {
        updateData.preferredLocale = preferredLocale;
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneE164: true,
        smsOptIn: true,
        phoneVerifiedAt: true,
        emailOptIn: true,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
