import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/coach/content
 * Get all content items for the authenticated coach
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get coach record
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const content = await prisma.contentItem.findMany({
      where: { coachId: coach.id },
      include: {
        product: {
          select: { name: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    console.error("Get content error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/coach/content
 * Create a new content item
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get coach record
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, mediaUrl, mediaType, productId, isPublished } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 });
    }

    // Verify product exists and belongs to coach
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        coachId: coach.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }

    // Create content item
    const content = await prisma.contentItem.create({
      data: {
        coachId: coach.id,
        productId,
        title: title.trim(),
        description: description?.trim() || null,
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType || null,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        product: {
          select: { name: true, type: true },
        },
      },
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    console.error("Create content error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
