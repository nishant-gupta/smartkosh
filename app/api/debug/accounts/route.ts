import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Get all accounts for the current user with their IDs
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
    console.log("Session user in debug:", session.user);
    
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
    
    // Get all accounts for this user
    const accounts = await prisma.account.findMany({
      where: {
        user: {
          id: actualUserId
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        isActive: true,
        userId: true
      }
    });
    
    // Get all accounts in the system (for admin debugging)
    const allAccounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        userId: true
      }
    });
    
    return NextResponse.json({
      userId: actualUserId,
      userAccounts: accounts,
      allAccounts: allAccounts
    });
  } catch (error) {
    console.error("Error fetching debug account info:", error);
    return NextResponse.json(
      { error: "Failed to fetch account debug info" },
      { status: 500 }
    );
  }
} 