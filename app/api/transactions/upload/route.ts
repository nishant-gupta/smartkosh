import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

// Function to parse the CSV file content
function parseCSV(content: string) {
  try {
    // Parse CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    // Get current year for validation
    const currentYear = new Date().getFullYear()
    
    // Validate and transform records
    return records.map((record: any) => {
      // Check for required fields
      if (!record.Date || !record.Description) {
        throw new Error('CSV must contain Date and Description columns')
      }
      
      // Parse and validate date
      let parsedDate = new Date(record.Date)
      
      // If date is invalid or year is too far in the past, default to today's date
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < (currentYear - 3)) {
        console.log(`Invalid or old date ${record.Date}, defaulting to today for record:`, record)
        parsedDate = new Date()
      }
      
      // Determine transaction type and amount
      let amount = 0
      let type = 'expense'
      
      // Check if "Withdrawal Amount" exists and has a value
      if (record['Withdrawal Amount'] && parseFloat(record['Withdrawal Amount']) > 0) {
        amount = parseFloat(record['Withdrawal Amount'])
        type = 'expense'
      } 
      // Check if "Deposit Amount" exists and has a value
      else if (record['Deposit Amount'] && parseFloat(record['Deposit Amount']) > 0) {
        amount = parseFloat(record['Deposit Amount'])
        type = 'income'
      } else {
        throw new Error('Each row must have either Withdrawal Amount or Deposit Amount')
      }
      
      // Map CSV record to transaction model
      return {
        date: parsedDate,
        description: record.Description,
        category: record.Category || 'Uncategorized',
        amount,
        type,
        notes: record.Notes || null
      }
    })
  } catch (error: any) {
    console.error('CSV parsing error details:', error)
    throw new Error(`CSV parsing error: ${error.message}`)
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      console.log('Upload failed: No session user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Session user data:', {
      name: session.user.name,
      email: session.user.email,
      id: (session.user as any).id
    })
    
    // Get user ID from session or look it up by email
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      console.log('Upload failed: No user ID or email in session')
      return NextResponse.json(
        { error: 'User not properly authenticated' },
        { status: 401 }
      )
    }
    
    // If we don't have ID but have email, look up the user
    let actualUserId;
    if (!userId && userEmail) {
      console.log('Looking up user by email:', userEmail)
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      });
      
      if (!user) {
        console.log('Upload failed: User not found by email:', userEmail)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      actualUserId = user.id;
      console.log('Found user ID from email lookup:', actualUserId)
    } else {
      actualUserId = userId;
      console.log('Using user ID from session:', actualUserId)
    }
    
    // Verify user exists and get accounts
    console.log('Fetching user accounts for ID:', actualUserId)
    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: { accounts: true }
    })
    
    if (!user) {
      console.log('Upload failed: User not found by ID:', actualUserId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if user has any accounts
    if (user.accounts.length === 0) {
      console.log('Upload failed: User has no accounts:', actualUserId)
      return NextResponse.json(
        { error: 'Please create an account before importing transactions' },
        { status: 400 }
      )
    }
    
    // Use the first account as default
    const defaultAccountId = user.accounts[0].id
    console.log('Using account for import:', defaultAccountId, 'Account name:', user.accounts[0].name)
    
    // Process multipart form data to get file
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('Upload failed: No file in request')
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }
    
    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type)
    
    // Check file type (should be CSV)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      console.log('Upload failed: Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      )
    }
    
    try {
      // Read file content
      const fileContent = await file.text()
      const fileName = file.name
      
      // Validate by parsing a sample (just to check format is correct)
      console.log('Validating CSV format')
      const sampleLines = fileContent.split('\n').slice(0, 5).join('\n')
      parseCSV(sampleLines)
      
      // Create a background job for processing
      const job = await prisma.backgroundJob.create({
        data: {
          userId: actualUserId,
          type: 'transaction_upload',
          status: 'pending',
          progress: 0,
          result: {
            fileName,
            accountId: defaultAccountId,
            totalLines: fileContent.split('\n').length - 1 // Subtract header
          }
        }
      })
      
      // Start background processing (normally this would be done by a worker)
      // For demonstration, we'll use setTimeout to simulate a background process
      setTimeout(() => {
        processUploadJob(job.id, fileContent, actualUserId, defaultAccountId);
      }, 100);
      
      // Create initial notification
      await prisma.notification.create({
        data: {
          userId: actualUserId,
          title: 'CSV Upload Started',
          message: `Your file "${fileName}" is being processed in the background.`,
          type: 'info',
          relatedTo: 'transaction_upload',
          data: { jobId: job.id }
        }
      });
      
      // Return the job ID to the client
      return NextResponse.json({
        success: true,
        message: 'File upload started and is being processed',
        jobId: job.id
      });
      
    } catch (error: any) {
      console.error('Error in file processing or validation:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to process file' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error importing transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import transactions' },
      { status: 500 }
    )
  }
}

// Background processing function
async function processUploadJob(jobId: string, fileContent: string, userId: string, accountId: string) {
  console.log(`Starting background job ${jobId} for user ${userId} and account ${accountId}`);
  
  try {
    // Update job status to processing
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        progress: 10
      }
    });
    
    // Parse the CSV data
    console.log('Parsing CSV data');
    const transactions = parseCSV(fileContent);
    console.log('Successfully parsed', transactions.length, 'transactions');
    
    // Update job progress
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        progress: 20
      }
    });
    
    // Process transactions in smaller batches to prevent timeout issues
    const BATCH_SIZE = 50;
    const batches = [];
    
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      batches.push(transactions.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Split ${transactions.length} transactions into ${batches.length} batches of max ${BATCH_SIZE}`);
    
    let totalCreated = 0;
    let newBalance = 0;
    
    // Get current account balance first (outside transaction)
    console.log('Fetching current account balance for account:', accountId);
    const currentAccount = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!currentAccount) {
      throw new Error('Account not found');
    }
    
    newBalance = currentAccount.balance;
    console.log('Starting balance:', newBalance);
    
    // Update job progress
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        progress: 30
      }
    });
    
    // Process each batch in a separate transaction
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1} of ${batches.length} (${batch.length} transactions)`);
      
      try {
        // Use transaction with timeout option
        const result = await prisma.$transaction(async (tx) => {
          const createdTransactions = [];
          
          // Create transactions in this batch
          for (const transaction of batch) {
            console.log('Creating transaction:', {
              userId,
              accountId,
              description: transaction.description,
              type: transaction.type
            });
            
            const createdTransaction = await tx.transaction.create({
              data: {
                userId,
                accountId,
                date: transaction.date,
                description: transaction.description,
                category: transaction.category,
                amount: transaction.amount,
                type: transaction.type,
                notes: transaction.notes
              }
            });
            
            createdTransactions.push(createdTransaction);
            
            // Update running balance calculation
            if (transaction.type === 'income') {
              newBalance += transaction.amount;
            } else if (transaction.type === 'expense') {
              newBalance -= transaction.amount;
            }
          }
          
          return createdTransactions;
        }, {
          timeout: 30000, // 30 second timeout for each batch transaction
          maxWait: 5000,  // Max 5 seconds waiting for transaction to start
          isolationLevel: 'ReadCommitted' // Less strict isolation level
        });
        
        totalCreated += result.length;
        
        // Update job progress
        const progressPercentage = 30 + Math.floor(60 * (batchIndex + 1) / batches.length);
        await prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            progress: progressPercentage
          }
        });
        
        console.log(`Batch ${batchIndex + 1} completed. Created ${result.length} transactions.`);
      } catch (error: any) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error);
        
        // Update job with error
        await prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: `Error processing batch ${batchIndex + 1}: ${error.message}`
          }
        });
        
        // Create notification for the error
        await prisma.notification.create({
          data: {
            userId,
            title: 'CSV Upload Failed',
            message: `There was an error processing your upload: ${error.message}`,
            type: 'error',
            relatedTo: 'transaction_upload',
            data: { jobId }
          }
        });
        
        return; // Exit the function
      }
    }
    
    // Update account balance in a separate transaction
    try {
      console.log('Updating account balance to:', newBalance);
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance }
      });
    } catch (error: any) {
      console.error('Error updating account balance:', error);
      
      // Update job with partial success
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 95,
          error: `Transactions were created but account balance could not be updated: ${error.message}`,
          result: {
            transactionsCreated: totalCreated,
            accountUpdateFailed: true
          }
        }
      });
      
      // Create notification for partial success
      await prisma.notification.create({
        data: {
          userId,
          title: 'CSV Upload Partially Completed',
          message: `Successfully imported ${totalCreated} transactions, but account balance could not be updated.`,
          type: 'warning',
          relatedTo: 'transaction_upload',
          data: { jobId, transactionsCreated: totalCreated }
        }
      });
      
      return;
    }
    
    // Mark job as completed
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        result: {
          transactionsCreated: totalCreated,
          accountBalanceUpdated: true,
          finalBalance: newBalance
        }
      }
    });
    
    // Create success notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'CSV Upload Completed',
        message: `Successfully imported ${totalCreated} transactions.`,
        type: 'success',
        relatedTo: 'transaction_upload',
        data: { jobId, transactionsCreated: totalCreated }
      }
    });
    
    console.log('Upload job completed successfully. Created', totalCreated, 'transactions');
  } catch (error: any) {
    console.error('Error in background job:', error);
    
    // Update job with error
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: error.message
      }
    });
    
    // Create notification for the error
    await prisma.notification.create({
      data: {
        userId,
        title: 'CSV Upload Failed',
        message: `There was an error processing your upload: ${error.message}`,
        type: 'error',
        relatedTo: 'transaction_upload',
        data: { jobId }
      }
    });
  }
} 