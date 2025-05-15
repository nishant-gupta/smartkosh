import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';
// @ts-ignore - csv-parser doesn't have type declarations
import csv from 'csv-parser';
import { Readable } from 'stream';
// import { z } from 'zod';
// import { financialSummaryQueue } from '@/lib/queue';
import { uploadToS3 } from '@/lib/aws/s3';
import { invokeProcessCSV } from '@/lib/aws/lambda';

// Define interfaces for type safety
interface CSVRow {
  date: string;
  description: string;
  amount: string;
  category?: string;
  notes?: string;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string | null;
  notes: string | null;
}

// Function to parse CSV data with proper validation
async function parseCSV(csvContent: string): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedTransaction[] = [];
    const stream = Readable.from([csvContent]);
    
    stream
      .pipe(csv())
      .on('data', (data: CSVRow) => {
        // Basic validation
        if (!data.date || !data.description || !data.amount) {
          console.log('Invalid row:', data);
          return; // Skip invalid rows
        }
        
        // Convert amount to number and handle different formats
        let amount = parseFloat(data.amount.replace(/,/g, '').replace(/[$₹€£¥]/g, ''));
        if (isNaN(amount)) {
          console.log('Invalid amount:', data.amount);
          return; // Skip if amount is not a valid number
        }
        
        // Add to results
        results.push({
          date: data.date,
          description: data.description,
          amount: amount,
          category: data.category || null,
          notes: data.notes || null
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('Starting transaction upload process');
  
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated, getting user details');
    
    // Get the user's email
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the database
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
    
    console.log('Getting user accounts');
    
    // Get the user's accounts
    const accountsResult = await prisma.$queryRaw`
      SELECT id, name FROM "Account"
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    
    const accounts = accountsResult as any[];
    
    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No accounts found for user' },
        { status: 404 }
      );
    }
    
    const accountId = accounts[0].id;
    
    console.log('Processing multipart form data');
    
    // Process the FormData to get the file
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing form data:', error);
      return NextResponse.json(
        { error: 'Failed to parse form data' },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are supported.' },
        { status: 400 }
      );
    }
    
    // Get the file content
    const fileContent = await file.text();
    
    // Create a new background job for processing
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
        ${user.id},
        'CSV_UPLOAD',
        'pending',
        0,
        ${JSON.stringify({ fileName: file.name })}::jsonb,
        NOW(),
        NOW()
      )
    `;

    //generate a unique id for the file
    const fileId = `${user.id}-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${file.name}`;

    //upload csv to aws s3 and send post to lamda function
    const s3Response = await uploadToS3(fileId, fileContent);

    console.debug('S3 response', s3Response);

    //check if s3 response is successful
    if (!s3Response.$metadata.httpStatusCode || s3Response.$metadata.httpStatusCode !== 200) {
      return NextResponse.json(
        { error: 'Upload to S3 failed' },
        { status: 500 }
      );
    }

    const lambdaResponse = await invokeProcessCSV(jobId, process.env.AWS_BUCKET_NAME as string, fileId, user.id, accountId);

    console.debug('Lambda function invoked', lambdaResponse);

    // check if lambda function is successful
    if (!lambdaResponse.$metadata.httpStatusCode || lambdaResponse.$metadata.httpStatusCode !== 200) {
      return NextResponse.json(
        { error: 'Upload to S3 and invoke Lambda function failed' },
        { status: 500 }
      );
    }

    // Return success immediately
    return NextResponse.json({
      message: 'Upload started successfully',
      jobId: jobId
    });
  } catch (error) {
    console.error('Error in transaction upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}