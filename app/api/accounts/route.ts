import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Get all accounts for the current user
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
    console.log("Session user in accounts GET:", session.user);
    
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
    
    const accounts = await prisma.account.findMany({
      where: {
        user: {
          id: actualUserId
        },
        isActive: true
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true
      }
    });
    
    console.log(`Found ${accounts.length} accounts for user ${actualUserId}`);
    
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// Create a new account
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
    console.log("Session user in accounts POST:", session.user);
    
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
    
    const { name, type, balance, currency = "USD" } = body;
    
    if (!name || !type || balance === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const account = await prisma.account.create({
      data: {
        user: {
          connect: {
            id: actualUserId
          }
        },
        name,
        type,
        balance: parseFloat(balance.toString()),
        currency
      }
    });
    
    console.log(`Created account ${account.id} for user ${actualUserId}`);
    
    return NextResponse.json(account);
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
} 