import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Get the user's profile
export async function GET(req: Request) {
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
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }
    
    // If we don't have ID but have email, look up the user
    if (!userId && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          profile: true // Include profile data
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          profile: true // Include profile data
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }
    
    // Format response to include profile fields at the top level
    const response = {
      ...user,
      phone: user.profile?.phone || null,
      dob: user.profile?.dob || null,
      address: user.profile?.address || null
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// Update the user's profile
export async function PUT(req: Request) {
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
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }
    
    // If we don't have ID but have email, look up the user
    if (!userId && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { profile: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }
    
    const actualUserId = userId || user.id;
    
    // Parse the request body
    const body = await req.json();
    const { name, phone, dob, address, currentPassword, newPassword } = body;
    
    // Validate the data
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    
    // Update basic information
    const updateData: { name: string; password?: string } = {
      name,
    };
    
    // Handle password change if requested
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }
    
    // Start a transaction to update both User and Profile
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      // Update the user
      const updatedUser = await tx.user.update({
        where: { id: actualUserId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true
        }
      });
      
      // Update or create profile
      let profile;
      if (user.profile) {
        // Update existing profile
        profile = await tx.profile.update({
          where: { userId: actualUserId },
          data: {
            phone: phone || null,
            dob: dob ? new Date(dob) : null,
            address: address || null,
          }
        });
      } else {
        // Create new profile
        profile = await tx.profile.create({
          data: {
            userId: actualUserId,
            phone: phone || null,
            dob: dob ? new Date(dob) : null,
            address: address || null,
          }
        });
      }
      
      return { ...updatedUser, profile };
    });
    
    // Format response to include profile fields at the top level
    const response = {
      ...result,
      phone: result.profile?.phone || null,
      dob: result.profile?.dob || null,
      address: result.profile?.address || null
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
} 