import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }

    const insight = await prisma.insight.findUnique({
      where: {
        id: params.id,
        userId
      },
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

    if (!insight) {
      return NextResponse.json(
        { error: "Insight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(insight);
  } catch (error) {
    console.error("Error fetching insight:", error);
    return NextResponse.json(
      { error: "Failed to fetch insight" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const insight = await prisma.insight.update({
      where: {
        id: params.id,
        userId
      },
      data: {
        status
      },
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

    return NextResponse.json(insight);
  } catch (error) {
    console.error("Error updating insight:", error);
    return NextResponse.json(
      { error: "Failed to update insight" },
      { status: 500 }
    );
  }
} 