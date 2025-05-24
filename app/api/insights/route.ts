import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/lib/auth-options";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Build the where clause
    const where: any = {
      userId,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Get insights
    const insights = await prisma.insight.findMany({
      where,
      orderBy: {
        generatedAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            status: true,
            currentAmount: true,
            targetAmount: true,
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.insight.count({ where });

    return NextResponse.json({
      insights,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      }
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
} 