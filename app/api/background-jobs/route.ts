import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Define the schema for creating a background job
const CreateJobSchema = z.object({
  type: z.string(),
  result: z.record(z.any()).optional()
})

// Get background jobs for the current user
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user's email
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
    const jobId = url.searchParams.get('jobId');
    
    // If job ID is provided, return that specific job
    if (jobId) {
      // Use raw SQL to get job details
      const jobs = await prisma.$queryRaw`
        SELECT 
          id, 
          type, 
          status, 
          progress, 
          result,
          error,
          "createdAt", 
          "updatedAt"
        FROM "BackgroundJob"
        WHERE id = ${jobId} AND "userId" = ${userId}
      `;
      
      const jobsArray = jobs as any[];
      if (!jobsArray.length) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(jobsArray[0]);
    }
    
    // Otherwise, return all jobs for this user
    const jobs = await prisma.$queryRaw`
      SELECT 
        id, 
        type, 
        status, 
        progress, 
        result, 
        error,
        "createdAt", 
        "updatedAt"
      FROM "BackgroundJob"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching background jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new background job
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user's email
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
    const body = await request.json();
    
    // Validate request body
    const validationResult = CreateJobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { type, result } = validationResult.data;
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Insert job record using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "BackgroundJob" (
        id,
        "userId",
        type,
        status,
        progress,
        result,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${jobId},
        ${userId},
        ${type},
        'pending',
        0,
        ${result ? JSON.stringify(result) : null}::jsonb,
        NOW(),
        NOW()
      )
    `;
    
    // Return job ID
    return NextResponse.json({
      message: 'Background job created',
      jobId: jobId
    });
  } catch (error) {
    console.error('Error creating background job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 