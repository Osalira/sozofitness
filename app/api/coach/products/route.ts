import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProductService } from "@/lib/services/product-service";
import { UserRole, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/coach/products
 * Get all products for the authenticated coach
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

    const products = await ProductService.getCoachProducts(coach.id);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/coach/products
 * Create a new product
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
    const { name, description, type } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (!type || !Object.values(ProductType).includes(type)) {
      return NextResponse.json(
        { error: "Valid product type is required (subscription or one_on_one)" },
        { status: 400 }
      );
    }

    // Create product
    const product = await ProductService.createProduct({
      coachId: coach.id,
      name: name.trim(),
      description: description?.trim() || null,
      type,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
