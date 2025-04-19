import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { PrismaClient, Prisma } from "@prisma/client";

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
    
    const userId = (session.user as { id: string }).id;
    const { id } = params;
    
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId
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
    
    const userId = (session.user as { id: string }).id;
    const { id } = params;
    const body = await req.json();
    
    const { accountId, amount, description, category, date, type, notes } = body;
    
    if (!accountId || !amount || !description || !category || !date || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId
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
    
    // Verify that the account belongs to the user
    if (accountId !== existingTransaction.accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId
        }
      });
      
      if (!account) {
        return NextResponse.json(
          { error: "Account not found or doesn't belong to the user" },
          { status: 404 }
        );
      }
    }
    
    // Start a transaction to update the transaction and adjust account balances
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Reverse the effect of the old transaction on the account balance
      let oldBalanceChange = existingTransaction.amount;
      if (existingTransaction.type === "expense") {
        oldBalanceChange = -oldBalanceChange;
      }
      
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
          accountId,
          amount: parseFloat(amount.toString()),
          description,
          category,
          date: new Date(date),
          type,
          notes: notes || null
        }
      });
      
      // Apply the effect of the new transaction on the account balance
      let newBalanceChange = parseFloat(amount.toString());
      if (type === "expense") {
        newBalanceChange = -newBalanceChange;
      }
      
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
    
    const userId = (session.user as { id: string }).id;
    const { id } = params;
    
    // Check if transaction exists and belongs to user
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId
      }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    // Start a transaction to delete the transaction and adjust account balance
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Reverse the effect of the transaction on the account balance
      let balanceChange = transaction.amount;
      if (transaction.type === "expense") {
        balanceChange = -balanceChange;
      }
      
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