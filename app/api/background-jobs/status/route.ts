import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import uploadQueue from '@/lib/queue';

export async function GET(req: Request) {
  // Check auth for admin-only access
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get queue stats
    const queueStatus = {
      counts: {
        waiting: await uploadQueue.getWaitingCount(),
        active: await uploadQueue.getActiveCount(),
        completed: await uploadQueue.getCompletedCount(),
        failed: await uploadQueue.getFailedCount(),
        delayed: await uploadQueue.getDelayedCount(),
        paused: await uploadQueue.getPausedCount(),
      },
      isReady: await uploadQueue.isReady(),
      name: uploadQueue.name,
      redis: {
        connected: uploadQueue.client.status === 'ready',
        status: uploadQueue.client.status,
      }
    };

    // Get recent jobs from database
    const recentJobs = await prisma.backgroundJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get unread notifications count
    const notifications = await prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      queueStatus,
      recentJobs,
      notificationsCount: notifications.length,
      recentNotifications: notifications,
      serverTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    });
  } catch (error: any) {
    console.error('Error getting background job status:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error getting status',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
      }, 
      { status: 500 }
    );
  }
} 