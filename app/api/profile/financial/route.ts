import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Currently we don't have a financial information model in the database schema
// This is a simulated endpoint that would need to be enhanced with
// a proper model when financial information storage is implemented

// Get the user's financial profile
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }
    
    // Find the user either by ID or email
    let user;
    
    if (!userId && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          financialProfile: true
        }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          financialProfile: true
        }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Format response to include financial profile fields
    const response = {
      yearlyIncome: user.financialProfile?.yearlyIncome || "",
      occupation: user.financialProfile?.occupation || "",
      incomeSource: user.financialProfile?.incomeSource || "",
      taxBracket: user.financialProfile?.taxBracket || "",
      savingsGoal: user.financialProfile?.savingsGoal || "",
      financialGoals: user.financialProfile?.financialGoals || ""
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching financial profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial profile" },
      { status: 500 }
    );
  }
}

// Update the user's financial profile
export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }
    
    // Find the user either by ID or email
    let user;
    
    if (!userId && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { financialProfile: true }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { financialProfile: true }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const actualUserId = userId || user.id;
    
    // Parse the request body
    const body = await req.json();
    const { yearlyIncome, occupation, incomeSource, taxBracket, savingsGoal, financialGoals } = body;
    
    // Update or create the financial profile using a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (user.financialProfile) {
        // Update existing financial profile
        const updatedFinancialProfile = await tx.financialProfile.update({
          where: { userId: actualUserId },
          data: {
            yearlyIncome: yearlyIncome || null,
            occupation: occupation || null,
            incomeSource: incomeSource || null,
            taxBracket: taxBracket || null,
            savingsGoal: savingsGoal || null,
            financialGoals: financialGoals || null,
          }
        });
        return updatedFinancialProfile;
      } else {
        // Create new financial profile
        const newFinancialProfile = await tx.financialProfile.create({
          data: {
            userId: actualUserId,
            yearlyIncome: yearlyIncome || null,
            occupation: occupation || null,
            incomeSource: incomeSource || null,
            taxBracket: taxBracket || null,
            savingsGoal: savingsGoal || null,
            financialGoals: financialGoals || null,
          }
        });
        return newFinancialProfile;
      }
    });
    
    // Format response to include updated financial profile fields
    const response = {
      yearlyIncome: result.yearlyIncome || "",
      occupation: result.occupation || "",
      incomeSource: result.incomeSource || "",
      taxBracket: result.taxBracket || "",
      savingsGoal: result.savingsGoal || "",
      financialGoals: result.financialGoals || "",
      updated: true
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating financial profile:", error);
    return NextResponse.json(
      { error: "Failed to update financial profile" },
      { status: 500 }
    );
  }
} 