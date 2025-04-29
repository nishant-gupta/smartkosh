import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

// Get background jobs for the current user
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
    
    // Get the job ID from the query string if present
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('id');
    
    if (jobId) {
      // Get a specific job
      const job = await prisma.backgroundJob.findUnique({
        where: { 
          id: jobId,
        }
      });
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      // Ensure the job belongs to the current user
      if (job.userId !== actualUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(job);
    } else {
      // Get all jobs for the user, ordered by creation date descending
      const jobs = await prisma.backgroundJob.findMany({
        where: { 
          userId: actualUserId 
        },
        orderBy: { 
          createdAt: 'desc' 
        }
      });
      
      return NextResponse.json(jobs);
    }
  } catch (error: any) {
    console.error('Error fetching background jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch background jobs' },
      { status: 500 }
    );
  }
}

// Create a new background job
export async function POST(req: Request) {
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
    const { type } = body;
    
    if (!type) {
      return NextResponse.json(
        { error: 'Job type is required' },
        { status: 400 }
      );
    }
    
    // Create a new background job
    const job = await prisma.backgroundJob.create({
      data: {
        userId: actualUserId,
        type,
        status: 'pending',
        progress: 0
      }
    });
    
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error creating background job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create background job' },
      { status: 500 }
    );
  }
} 