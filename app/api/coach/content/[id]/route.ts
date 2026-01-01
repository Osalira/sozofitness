import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/coach/content/[id]
 * Update content item (publish/unpublish, edit)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: contentId } = await params;
    const body = await req.json();

    // Verify content ownership
    const content = await prisma.contentItem.findFirst({
      where: {
        id: contentId,
        coachId: coach.id,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found or access denied" }, { status: 404 });
    }

    // Update content
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.mediaUrl !== undefined) {
      updateData.mediaUrl = body.mediaUrl?.trim() || null;
    }
    if (body.mediaType !== undefined) {
      updateData.mediaType = body.mediaType;
    }
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      // Set publishedAt when publishing
      if (body.isPublished && !content.publishedAt) {
        updateData.publishedAt = new Date();
      }
      // Clear publishedAt when unpublishing
      if (!body.isPublished) {
        updateData.publishedAt = null;
      }
    }

    const updated = await prisma.contentItem.update({
      where: { id: contentId },
      data: updateData,
      include: {
        product: {
          select: { name: true, type: true },
        },
      },
    });

    return NextResponse.json({ content: updated }, { status: 200 });
  } catch (error) {
    console.error("Update content error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coach/content/[id]
 * Delete content item
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const { id: contentId } = await params;

    // Verify ownership and delete
    const content = await prisma.contentItem.findFirst({
      where: {
        id: contentId,
        coachId: coach.id,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found or access denied" }, { status: 404 });
    }

    await prisma.contentItem.delete({
      where: { id: contentId },
    });

    return NextResponse.json({ message: "Content deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete content error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
