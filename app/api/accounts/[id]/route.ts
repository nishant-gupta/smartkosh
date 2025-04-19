import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Get a specific account by ID
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
    
    const userId = (session.user as { id: string }).id;
    const { id } = params;
    
    const account = await prisma.account.findUnique({
      where: {
        id,
        userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// Update an account
export async function PUT(
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
    
    const userId = (session.user as { id: string }).id;
    const { id } = params;
    const body = await req.json();
    
    const { name, type, balance, currency } = body;
    
    if (!name && !type && balance === undefined && !currency) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    
    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findUnique({
      where: {
        id,
        userId,
        isActive: true
      }
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
    
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (balance !== undefined) updateData.balance = parseFloat(balance.toString());
    if (currency) updateData.currency = currency;
    
    const updatedAccount = await prisma.account.update({
      where: {
        id
      },
      data: updateData
    });
    
    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// Delete (soft delete) an account
export async function DELETE(
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
    
    const userId = (session.user as { id: string }).id;
    const { id } = params;
    
    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findUnique({
      where: {
        id,
        userId,
        isActive: true
      }
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
    
    // Check if there are any transactions for this account
    const transactionCount = await prisma.transaction.count({
      where: {
        accountId: id,
        isActive: true
      }
    });
    
    if (transactionCount > 0) {
      // Soft delete by marking as inactive
      await prisma.account.update({
        where: {
          id
        },
        data: {
          isActive: false
        }
      });
    } else {
      // Hard delete if no transactions
      await prisma.account.delete({
        where: {
          id
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
} 