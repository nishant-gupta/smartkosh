import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating notifications
const CreateNotificationSchema = z.object({
  userId: z.string().optional(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  relatedTo: z.string().optional()
})

// Schema for updating notification read status
const UpdateNotificationSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional()
})

// Get notifications for the current user
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }
    
    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userId = user.id;
    
    // Get query parameters
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    const unreadOnly = url.searchParams.get('unread') === 'true';
    
    // If notification ID is provided, return that specific notification
    if (notificationId) {
      const notifications = await prisma.$queryRaw`
        SELECT 
          id, "userId", title, message, type, "relatedTo", read, "createdAt", "updatedAt"
        FROM "Notification"
        WHERE id = ${notificationId} AND "userId" = ${userId}
        LIMIT 1
      `;
      
      if (!notifications || (notifications as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Notification not found or does not belong to you' },
          { status: 404 }
        );
      }
      
      return NextResponse.json((notifications as any[])[0]);
    }
    
    // Otherwise, return all notifications for this user with pagination
    const limit = Number(url.searchParams.get('limit') || '20');
    const offset = Number(url.searchParams.get('offset') || '0');
    
    // Build the query based on filter criteria
    let notificationsQuery = `
      SELECT 
        id, "userId", title, message, type, "relatedTo", read, "createdAt", "updatedAt"
      FROM "Notification"
      WHERE "userId" = '${userId}'
      ${unreadOnly ? "AND read = false" : ""}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Count unread notifications
    const unreadCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Notification"
      WHERE "userId" = ${userId} AND read = false
    `;
    
    const unreadCount = Number((unreadCountResult as any[])[0]?.count || 0);
    
    // Get notifications
    const notifications = await prisma.$queryRawUnsafe(notificationsQuery);
    
    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated for certain operations
    const session = await getServerSession(authOptions);
    
    // Parse request body
    const requestBody = await request.json();
    const validationResult = CreateNotificationSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const { userId, title, message, type, relatedTo } = validationResult.data;
    
    // If creating a notification for another user, require auth
    let targetUserId = userId;
    
    if (!targetUserId) {
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      targetUserId = currentUser.id;
    }
    
    // Generate a unique ID for the notification
    const notificationId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Create notification using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Notification" (
        id,
        "userId",
        title,
        message,
        type,
        "relatedTo",
        read,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${notificationId},
        ${targetUserId},
        ${title},
        ${message},
        ${type},
        ${relatedTo || null},
        false,
        NOW(),
        NOW()
      )
    `;
    
    // Get the created notification
    const notifications = await prisma.$queryRaw`
      SELECT 
        id, "userId", title, message, type, "relatedTo", read, "createdAt", "updatedAt"
      FROM "Notification"
      WHERE id = ${notificationId}
      LIMIT 1
    `;
    
    if (!notifications || (notifications as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Notification created',
      notification: (notifications as any[])[0]
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }
    
    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userId = user.id;
    
    // Parse request body
    const requestBody = await request.json();
    const validationResult = UpdateNotificationSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const { id, markAll } = validationResult.data;
    
    // If markAll is true, mark all notifications as read
    if (markAll) {
      await prisma.$executeRaw`
        UPDATE "Notification"
        SET read = true, "updatedAt" = NOW()
        WHERE "userId" = ${userId} AND read = false
      `;
      
      return NextResponse.json({
        message: 'All notifications marked as read'
      });
    }
    
    // Otherwise mark a specific notification as read
    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required when not marking all as read' },
        { status: 400 }
      );
    }
    
    // Update notification using raw SQL
    const result = await prisma.$executeRaw`
      UPDATE "Notification"
      SET read = true, "updatedAt" = NOW()
      WHERE id = ${id} AND "userId" = ${userId}
    `;
    
    if (result === 0) {
      return NextResponse.json(
        { error: 'Notification not found or already read' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 