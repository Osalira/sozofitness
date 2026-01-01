import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SmsSender, isSmsConfigured } from "@/lib/notifications/sms";

/**
 * POST /api/dev/test-sms
 * Test SMS sending (dev-only endpoint)
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check SMS configuration
    if (!isSmsConfigured()) {
      return NextResponse.json(
        {
          error:
            "SMS not configured. Set SMS_PROVIDER=twilio and TWILIO_* credentials in .env. See documentation for setup instructions.",
        },
        { status: 400 }
      );
    }

    // Check user has phone and opted in
    if (!user.smsOptIn) {
      return NextResponse.json(
        { error: "SMS notifications are not enabled. Enable in your account settings." },
        { status: 400 }
      );
    }

    if (!user.phoneE164) {
      return NextResponse.json(
        { error: "No phone number on file. Add your phone number in account settings." },
        { status: 400 }
      );
    }

    // Send test SMS
    const result = await SmsSender.send({
      to: user.phoneE164,
      message: `Test SMS from SOZOFITNESS! Your notifications are working. This is a test message sent at ${new Date().toLocaleTimeString()}. Reply STOP to opt out.`,
    });

    if (result.success) {
      return NextResponse.json(
        {
          message: "Test SMS sent successfully!",
          to: user.phoneE164,
          providerMessageId: result.providerMessageId,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: `Failed to send SMS: ${result.error}` }, { status: 500 });
    }
  } catch (error) {
    console.error("Test SMS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
