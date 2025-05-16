import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// trigger financial summary lambda function
import { invokeProcessFinancialSummary } from "@/lib/aws/lambda";

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

// Get a single transaction by ID
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
    
    // Get user info either by ID or email
    let user;
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    console.log("Session user in GET [id]:", session.user);
    
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
    
    const { id } = params;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        user: {
          id: actualUserId
        }
      },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// Update a transaction
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
    
    // Get user info either by ID or email
    let user;
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    console.log("Session user in PUT:", session.user);
    
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
    
    const { id } = params;
    const body = await req.json();
    console.log("Update transaction request body:", body);
    
    const { accountId, amount, description, category, date, type, notes } = body;
    
    if (!accountId || !amount || !description || !category || !date || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        user: {
          id: actualUserId
        }
      },
      include: {
        account: true
      }
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    console.log("Found existing transaction:", existingTransaction.id);
    
    // Verify that the account belongs to the user
    if (accountId !== existingTransaction.accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          user: {
            id: actualUserId
          }
        }
      });
      
      if (!account) {
        return NextResponse.json(
          { error: "Account not found or doesn't belong to the user" },
          { status: 404 }
        );
      }
      
      console.log("Verified new account belongs to user:", account.id);
    }
    
    // Start a transaction to update the transaction and adjust account balances
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Reverse the effect of the old transaction on the account balance
      let oldBalanceChange = existingTransaction.amount;
      if (existingTransaction.type === "expense") {
        oldBalanceChange = -oldBalanceChange;
      } else if (existingTransaction.type === "saving") {
        // Consistent with our POST handler, treat savings like expenses
        oldBalanceChange = -oldBalanceChange;
      }
      
      console.log("Reversing old balance change:", oldBalanceChange);
      
      await tx.account.update({
        where: {
          id: existingTransaction.accountId
        },
        data: {
          balance: {
            decrement: oldBalanceChange
          }
        }
      });
      
      // Update the transaction
      const updatedTransaction = await tx.transaction.update({
        where: {
          id
        },
        data: {
          account: {
            connect: {
              id: accountId
            }
          },
          amount: (type === "expense" ? -1 : 1) * parseFloat(amount.toString()),
          description,
          category,
          date: new Date(date),
          type,
          notes: notes || null
        }
      });
      
      console.log("Updated transaction:", updatedTransaction.id);
      
      // Apply the effect of the new transaction on the account balance
      let newBalanceChange = parseFloat(amount.toString());
      if (type === "expense") {
        newBalanceChange = -newBalanceChange;
      } else if (type === "saving") {
        // Consistent with our POST handler, treat savings like expenses
        newBalanceChange = -newBalanceChange;
      }
      
      console.log("Applying new balance change:", newBalanceChange);
      
      await tx.account.update({
        where: {
          id: accountId
        },
        data: {
          balance: {
            increment: newBalanceChange
          }
        }
      });

      // trigger financial summary lambda function
      triggerFinancialSummaryLambda(actualUserId, accountId);
      
      return updatedTransaction;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// Delete a transaction
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
    
    // Get user info either by ID or email
    let user;
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    console.log("Session user in DELETE:", session.user);
    
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
    
    const { id } = params;
    
    // Check if transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        user: {
          id: actualUserId
        }
      }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    console.log("Found transaction to delete:", transaction.id);
    
    // Start a transaction to delete the transaction and adjust account balance
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Reverse the effect of the transaction on the account balance
      let balanceChange = transaction.amount;
      if (transaction.type === "expense") {
        balanceChange = -balanceChange;
      } else if (transaction.type === "saving") {
        // Consistent with our other handlers, treat savings like expenses
        balanceChange = -balanceChange;
      }
      
      console.log("Reversing balance change:", balanceChange);
      
      await tx.account.update({
        where: {
          id: transaction.accountId
        },
        data: {
          balance: {
            decrement: balanceChange
          }
        }
      });
      
      // Delete the transaction
      await tx.transaction.delete({
        where: {
          id
        }
      });

      // trigger financial summary lambda function
      triggerFinancialSummaryLambda(actualUserId, transaction.accountId);
      
      console.log("Transaction deleted successfully");
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
} 