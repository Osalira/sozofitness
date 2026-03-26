import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailSender, isEmailConfigured } from "@/lib/notifications/email";

/**
 * POST /api/dev/test-email
 * Test email sending (dev-only endpoint)
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

    // Check email configuration
    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Email not configured. Set EMAIL_PROVIDER=resend and RESEND_API_KEY in .env. See documentation for setup instructions.",
        },
        { status: 400 }
      );
    }

    // Send test email
    const result = await EmailSender.send({
      to: session.user.email,
      subject: "Test Email from SOZOFITNESS",
      text: `Hello ${session.user.name || "there"},\n\nThis is a test email to verify your email notifications are working correctly.\n\nSent at: ${new Date().toLocaleString()}\n\nBest regards,\nSOZOFITNESS Team`,
    });

    if (result.success) {
      return NextResponse.json(
        {
          message: "Test email sent successfully!",
          to: session.user.email,
          providerMessageId: result.providerMessageId,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: `Failed to send email: ${result.error}` }, { status: 500 });
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
