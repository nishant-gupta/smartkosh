import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import uploadQueue from '@/lib/queue';

export async function GET(req: Request) {
  // Skip auth for easier debugging
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get('debug') === 'true';
  
  // Only check auth if not in debug mode
  if (!debug) {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  const result: any = {
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    redisUrl: process.env.REDIS_URL ? 'Configured' : 'Not configured',
    queueStatus: {
      name: uploadQueue.name,
    }
  };
  
  // Try to check Redis connection
  try {
    result.redisConnection = {
      status: uploadQueue.client ? uploadQueue.client.status : 'unknown',
      connection: 'attempted'
    };
    
    // Only try these if Redis seems connected
    if (uploadQueue.client && uploadQueue.client.status === 'ready') {
      try {
        result.queueStatus.counts = {
          waiting: await uploadQueue.getWaitingCount(),
          active: await uploadQueue.getActiveCount(),
          completed: await uploadQueue.getCompletedCount(),
          failed: await uploadQueue.getFailedCount(),
        };
        result.queueStatus.isReady = await uploadQueue.isReady();
        result.redisConnection.connection = 'successful';
      } catch (countsError) {
        result.redisConnection.countsError = debug ? String(countsError) : 'Error getting counts';
      }
    } else {
      result.redisConnection.error = 'Redis client not ready';
    }
  } catch (redisError) {
    result.redisConnection = {
      status: 'error',
      error: debug ? String(redisError) : 'Could not connect to Redis',
      connection: 'failed'
    };
  }
  
  // Try to get database info separately (might work even if Redis fails)
  try {
    // Get server stats from the database
    const dbInfo = {
      backgroundJobs: await prisma.$queryRaw`SELECT COUNT(*) FROM "BackgroundJob"`,
      notifications: await prisma.$queryRaw`SELECT COUNT(*) FROM "Notification"`,
    };
    result.database = {
      connected: true,
      stats: dbInfo
    };
  } catch (dbError) {
    result.database = {
      connected: false,
      error: debug ? String(dbError) : 'Could not connect to database'
    };
  }
  
  // Return available info even if some parts failed
  return NextResponse.json(result);
} 