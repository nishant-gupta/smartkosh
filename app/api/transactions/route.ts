import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Get all transactions for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    // Type assertion for the user ID
    const userId = (session.user as { id: string }).id;
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take: limit,
      include: {
        account: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });
    
    const total = await prisma.transaction.count({
      where: {
        userId,
      },
    });
    
    return NextResponse.json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// Create a new transaction
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    
    const { accountId, amount, description, category, date, type } = body;
    
    if (!accountId || !amount || !description || !category || !date || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Verify that the account belongs to the user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });
    
    if (!account) {
      return NextResponse.json(
        { error: "Account not found or doesn't belong to the user" },
        { status: 404 }
      );
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId,
        amount: parseFloat(amount.toString()),
        description,
        category,
        date: new Date(date),
        type,
      },
    });
    
    // Update account balance
    let balanceChange = transaction.amount;
    if (transaction.type === "expense") {
      balanceChange = -balanceChange;
    }
    
    await prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
} 