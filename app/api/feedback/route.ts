import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeedbackCategory } from "@prisma/client";

// In-memory rate limiting (simple map of userId -> last submission time)
const rateLimitMap = new Map<string, number>();

/**
 * POST /api/feedback
 * Submit user feedback
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 30 seconds between submissions per user
    const now = Date.now();
    const lastSubmit = rateLimitMap.get(session.user.id) || 0;

    if (now - lastSubmit < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - lastSubmit)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before submitting again` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, category, rating, pagePath } = body;

    // Validation
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Validate category if provided
    const validCategories: FeedbackCategory[] = ["bug", "feature", "other"];
    const feedbackCategory =
      category && validCategories.includes(category) ? category : FeedbackCategory.other;

    // Validate rating if provided
    let feedbackRating: number | null = null;
    if (rating !== null && rating !== undefined) {
      const numRating = parseInt(rating, 10);
      if (numRating >= 1 && numRating <= 5) {
        feedbackRating = numRating;
      }
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        role: session.user.role,
        message: trimmedMessage,
        category: feedbackCategory,
        rating: feedbackRating,
        pagePath: pagePath || "/unknown",
      },
    });

    // Update rate limit map
    rateLimitMap.set(session.user.id, now);

    // Clean up old entries from rate limit map (keep last 1000)
    if (rateLimitMap.size > 1000) {
      const entries = Array.from(rateLimitMap.entries());
      entries.sort((a, b) => a[1] - b[1]);
      const toDelete = entries.slice(0, entries.length - 1000);
      toDelete.forEach(([userId]) => rateLimitMap.delete(userId));
    }

    return NextResponse.json({ success: true, feedbackId: feedback.id });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting feedback" },
      { status: 500 }
    );
  }
}

