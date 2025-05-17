import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

import { invokeProcessFinancialSummary } from "@/lib/aws/lambda";
import { TRANSACTION_TYPE } from "@/utils/constants";

async function triggerFinancialSummaryLambda(userId: string, accountId: string) {
  const jobId = `job-summary-${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  await prisma.$executeRaw`
    INSERT INTO "BackgroundJob" (
      id,
      "userId",
      "type",
      "status",
      "progress",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${jobId},
      ${userId},
      'financial_summary',
      'pending',
      0,
      NOW(),
      NOW()
    )
  `;

  const lambdaResponse = await invokeProcessFinancialSummary(jobId, userId, accountId);

  console.log('Lambda response', lambdaResponse);
}

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
    
    // Log session information for debugging
    console.log("Session user in GET:", session.user);
    
    // Get user info either by ID or email
    let user;
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      console.error("Neither user ID nor email available in session:", session);
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }
    
    // If we don't have ID but have email, look up the user
    if (!userId && userEmail) {
      console.log("Looking up user by email:", userEmail);
      user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "date-desc";
    
    // Use the user ID from the database lookup if needed
    const actualUserId = userId || user?.id;
    
    // Build the where clause with optional filtering
    const where: any = {
      user: {
        id: actualUserId
      }
    };
    
    // Add date filtering if provided
    if (startDate || endDate) {
      where.date = {};
      
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set to end of day for the end date
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        where.date.lte = endDateObj;
      }
    }
    
    // Add category filter if provided
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Add type filter if provided
    if (type && type !== 'all') {
      where.type = type;
    }
    
    // Define orderBy based on sort parameter
    let orderBy: any = { date: "desc" };
    
    if (sort === 'date-asc') {
      orderBy = { date: "asc" };
    } else if (sort === 'amount-desc') {
      orderBy = { amount: "desc" };
    } else if (sort === 'amount-asc') {
      orderBy = { amount: "asc" };
    } else if (sort === 'category') {
      orderBy = { category: "asc" };
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
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
      where,
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
    
    // Log session information for debugging
    console.log("Session user:", session.user);
    
    // Get user info either by ID or email
    let user;
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      console.error("Neither user ID nor email available in session:", session);
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }
    
    // If we don't have ID but have email, look up the user
    if (!userId && userEmail) {
      console.log("Looking up user by email:", userEmail);
      user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }
    
    // Use the user ID from the database lookup if needed
    const actualUserId = userId || user?.id;
    
    const body = await req.json();
    console.log("Request body:", body);
    
    const { accountId, amount, description, category, date, type, notes } = body;
    
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
        user: {
          id: actualUserId
        }
      },
    });
    
    console.log("Account lookup result:", account ? "Found" : "Not found");
    
    if (!account) {
      console.log("Account not found - user ID:", actualUserId, "account ID:", accountId);
      return NextResponse.json(
        { error: "Account not found or doesn't belong to the user" },
        { status: 404 }
      );
    }
    
    console.log("Creating transaction with user ID:", actualUserId, "account ID:", accountId);
    
    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        user: {
          connect: {
            id: actualUserId
          }
        },
        account: {
          connect: {
            id: accountId
          }
        },
        amount: (type === TRANSACTION_TYPE.INCOME ? 1 : -1) * parseFloat(amount.toString()),
        description,
        category,
        date: new Date(date),
        type,
        notes: notes || null
      },
    });
    
    console.log("Transaction created successfully:", transaction.id);
    
    // Update account balance
    let balanceChange = transaction.amount;
    if (transaction.type === TRANSACTION_TYPE.EXPENSE) {
      balanceChange = -balanceChange;
    } else if (transaction.type === TRANSACTION_TYPE.SAVING) {
      // For savings transactions, we treat them as money moved or set aside
      // This approach might vary based on your app's financial model
      // Options:
      // 1. Treat like expenses (reducing available balance): balanceChange = -balanceChange;
      // 2. Treat like income (increasing balance): keep as is
      // 3. No effect on balance (neutral): balanceChange = 0;
      
      // Current implementation: treat savings like expenses
      balanceChange = -balanceChange;
    }
    
    console.log("Updating account balance, change:", balanceChange);
    
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

    // trigger financial summary lambda function
    triggerFinancialSummaryLambda(actualUserId, accountId);
    
    console.log("Account balance updated successfully");
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    console.error("Transaction creation error details:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
} 