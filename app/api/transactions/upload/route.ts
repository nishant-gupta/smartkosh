import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';
// @ts-ignore - csv-parser doesn't have type declarations
import csv from 'csv-parser';
import { Readable } from 'stream';
import { z } from 'zod';

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
          return; // Skip invalid rows
        }
        
        // Convert amount to number and handle different formats
        let amount = parseFloat(data.amount.replace(/,/g, '').replace(/[$₹€£¥]/g, ''));
        if (isNaN(amount)) {
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
    
    // Start processing in the background
    console.log('Starting background processing');
    
    // Use setTimeout to simulate background processing without blocking the response
    setTimeout(async () => {
      try {
        console.log('Processing CSV file in background');
        
        // Update job status to processing
        await prisma.$executeRaw`
          UPDATE "BackgroundJob"
          SET status = 'processing', progress = 10, "updatedAt" = NOW()
          WHERE id = ${jobId}
        `;
        
        // Parse the CSV file
        const transactions = await parseCSV(fileContent);
        
        if (transactions.length === 0) {
          // Update job status to failed
          await prisma.$executeRaw`
            UPDATE "BackgroundJob"
            SET status = 'failed', progress = 100, "updatedAt" = NOW(),
                error = 'No valid transactions found in CSV'
            WHERE id = ${jobId}
          `;
          
          // Create notification for failure
          await prisma.$executeRaw`
            INSERT INTO "Notification" (
              id,
              "userId",
              title,
              message,
              type,
              read,
              "createdAt",
              "updatedAt"
            )
            VALUES (
              ${`notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`},
              ${user.id},
              'Upload Failed',
              'No valid transactions found in the CSV file.',
              'ERROR',
              false,
              NOW(),
              NOW()
            )
          `;
          
          console.log('No valid transactions found in CSV');
          return;
        }
        
        // Update job progress
        await prisma.$executeRaw`
          UPDATE "BackgroundJob"
          SET progress = 30, "updatedAt" = NOW()
          WHERE id = ${jobId}
        `;
        
        console.log(`Processing ${transactions.length} transactions`);
        
        // Process transactions in smaller batches to reduce memory usage
        const batchSize = 100;
        let successCount = 0;
        let failureCount = 0;
        
        for (let i = 0; i < transactions.length; i += batchSize) {
          const batch = transactions.slice(i, i + batchSize);
          const progress = Math.min(30 + Math.floor(60 * (i / transactions.length)), 90);
          
          // Update job progress
          await prisma.$executeRaw`
            UPDATE "BackgroundJob"
            SET progress = ${progress}, "updatedAt" = NOW()
            WHERE id = ${jobId}
          `;
          
          // Process each transaction in the batch
          for (const transaction of batch) {
            try {
              // Generate a unique ID for each transaction
              const transactionId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
              
              // Format date correctly
              let transactionDate;
              try {
                // Try to parse date from various formats
                const dateParts = transaction.date.split(/[\/\-\.]/);
                if (dateParts.length === 3) {
                  // Assume MM/DD/YYYY or DD/MM/YYYY format
                  // If first part is > 12, assume DD/MM/YYYY
                  const month = parseInt(dateParts[0]) > 12 ? dateParts[1] : dateParts[0];
                  const day = parseInt(dateParts[0]) > 12 ? dateParts[0] : dateParts[1];
                  const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
                  transactionDate = new Date(`${year}-${month}-${day}`);
                } else {
                  // Try direct parsing
                  transactionDate = new Date(transaction.date);
                }
                
                // Check if date is valid
                if (isNaN(transactionDate.getTime())) {
                  throw new Error('Invalid date');
                }
              } catch (error) {
                // Default to today if date parsing fails
                transactionDate = new Date();
              }
              
              // Insert transaction using raw SQL
              await prisma.$executeRaw`
                INSERT INTO "Transaction" (
                  id,
                  "accountId",
                  date,
                  description,
                  amount,
                  category,
                  notes,
                  "createdAt",
                  "updatedAt"
                )
                VALUES (
                  ${transactionId},
                  ${accountId},
                  ${transactionDate.toISOString()},
                  ${transaction.description},
                  ${transaction.amount},
                  ${transaction.category || null},
                  ${transaction.notes || null},
                  NOW(),
                  NOW()
                )
              `;
              
              successCount++;
            } catch (error) {
              console.error('Error inserting transaction:', error);
              failureCount++;
            }
          }
        }
        
        // Update job status to completed
        await prisma.$executeRaw`
          UPDATE "BackgroundJob"
          SET status = 'completed', progress = 100, "updatedAt" = NOW(),
              result = ${JSON.stringify({
                totalProcessed: transactions.length,
                successCount,
                failureCount
              })}::jsonb
          WHERE id = ${jobId}
        `;
        
        // Create notification for success
        await prisma.$executeRaw`
          INSERT INTO "Notification" (
            id,
            "userId",
            title,
            message,
            type,
            read,
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${`notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`},
            ${user.id},
            'Upload Complete',
            ${`Successfully processed ${successCount} transactions from your CSV file.`},
            'SUCCESS',
            false,
            NOW(),
            NOW()
          )
        `;
        
        console.log(`Background processing completed. Success: ${successCount}, Failures: ${failureCount}`);
      } catch (error) {
        console.error('Error in background processing:', error);
        
        // Update job status to failed
        await prisma.$executeRaw`
          UPDATE "BackgroundJob"
          SET status = 'failed', progress = 100, "updatedAt" = NOW(),
              error = ${error instanceof Error ? error.message : 'Unknown error'}
          WHERE id = ${jobId}
        `;
        
        // Create notification for failure
        await prisma.$executeRaw`
          INSERT INTO "Notification" (
            id,
            "userId",
            title,
            message,
            type,
            read,
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${`notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`},
            ${user.id},
            'Upload Failed',
            'An error occurred while processing your CSV file. Please try again.',
            'ERROR',
            false,
            NOW(),
            NOW()
          )
        `;
      }
    }, 100); // Small delay to ensure response is sent first
    
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