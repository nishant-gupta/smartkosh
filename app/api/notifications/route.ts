import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

// Get notifications for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user ID from session or look it up by email
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: 'User not properly authenticated' },
        { status: 401 }
      )
    }
    
    // If we don't have ID but have email, look up the user
    let actualUserId;
    if (!userId && userEmail) {
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
      
      actualUserId = user.id;
    } else {
      actualUserId = userId;
    }
    
    // Get the notification ID from the query string if present
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Define the where clause based on parameters
    const whereClause: any = { userId: actualUserId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }
    
    if (notificationId) {
      // Get a specific notification
      const notification = await prisma.notification.findUnique({
        where: { 
          id: notificationId
        }
      });
      
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      
      // Ensure the notification belongs to the current user
      if (notification.userId !== actualUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(notification);
    } else {
      // Get all notifications for the user, ordered by creation date descending
      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { 
          createdAt: 'desc' 
        }
      });
      
      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: actualUserId,
          isRead: false
        }
      });
      
      return NextResponse.json({
        notifications,
        unreadCount
      });
    }
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Create a new notification
export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Admin check can be added here if you want to restrict notification creation
    
    // Parse request body
    const body = await req.json();
    const { userId, title, message, type, relatedTo, data } = body;
    
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'UserId, title, message, and type are required' },
        { status: 400 }
      );
    }
    
    // Create a new notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedTo,
        data: data || undefined,
        isRead: false
      }
    });
    
    return NextResponse.json(notification);
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user ID from session or look it up by email
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: 'User not properly authenticated' },
        { status: 401 }
      )
    }
    
    // If we don't have ID but have email, look up the user
    let actualUserId;
    if (!userId && userEmail) {
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
      
      actualUserId = user.id;
    } else {
      actualUserId = userId;
    }
    
    // Parse request body
    const body = await req.json();
    const { id, markAllRead } = body;
    
    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: actualUserId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else if (id) {
      // Mark a specific notification as read
      const notification = await prisma.notification.findUnique({
        where: { id }
      });
      
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      
      // Ensure the notification belongs to the current user
      if (notification.userId !== actualUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Update the notification
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      return NextResponse.json(
        { error: 'Either id or markAllRead is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
} 