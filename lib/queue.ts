import Bull from 'bull';
import { prisma } from './prisma';
import { parse } from 'csv-parse/sync';

// Redis connection string - will need to be set in .env
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create upload queue
export const uploadQueue = new Bull('csv-uploads', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: true, // Remove jobs when complete to save Redis memory
    timeout: 300000, // 5 minutes timeout
  }
});

// Create financial summary queue
export const financialSummaryQueue = new Bull('financial-summary', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    timeout: 300000,
  }
});

// Function to parse the CSV file content
function parseCSV(content: string) {
  try {
    // Parse CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Get current year for validation
    const currentYear = new Date().getFullYear();
    
    // Validate and transform records
    return records.map((record: any) => {
      // Check for required fields
      if (!record.Date || !record.Description) {
        throw new Error('CSV must contain Date and Description columns');
      }
      
      // Parse and validate date
      let parsedDate = new Date(record.Date);
      
      // If date is invalid or year is too far in the past, default to today's date
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < (currentYear - 3)) {
        console.log(`Invalid or old date ${record.Date}, defaulting to today for record:`, record);
        parsedDate = new Date();
      }
      
      // Determine transaction type and amount
      let amount = 0;
      let type = 'expense';
      
      // Check if "Withdrawal Amount" exists and has a value
      if (record['Withdrawal Amount'] && parseFloat(record['Withdrawal Amount']) > 0) {
        amount = parseFloat(record['Withdrawal Amount']);
        type = 'expense';
      } 
      // Check if "Deposit Amount" exists and has a value
      else if (record['Deposit Amount'] && parseFloat(record['Deposit Amount']) > 0) {
        amount = parseFloat(record['Deposit Amount']);
        type = 'income';
      } else {
        throw new Error('Each row must have either Withdrawal Amount or Deposit Amount');
      }
      
      // Map CSV record to transaction model
      return {
        date: parsedDate,
        description: record.Description,
        category: record.Category || 'Uncategorized',
        amount,
        type,
        notes: record.Notes || null
      };
    });
  } catch (error: any) {
    console.error('CSV parsing error details:', error);
    throw new Error(`CSV parsing error: ${error.message}`);
  }
}

// Process upload jobs
uploadQueue.process(async (job: Bull.Job) => {
  const { clientJobId, fileContent, userId, fileName } = job.data;
  console.log(`[Queue] Starting processing for job ${clientJobId}`);
  let dbJob: any = null; // Declare dbJob in the outer scope
  try {
    // Create a database record for this job now that we're in the worker
    dbJob = await prisma.backgroundJob.create({
      data: {
        userId: userId,
        type: 'transaction_upload',
        status: 'processing',
        progress: 5,
        result: { 
          fileName,
          clientJobId,
          queueJobId: job.id
        }
      }
    }).catch((err: Error) => {
      console.error('Failed to create DB job record:', err);
      return null;
    });
    
    const jobId = dbJob?.id || clientJobId;
    
    // Get user and accounts
    const user = await prisma.user.findUnique({
      where: { 
        id: userId.includes('@') ? undefined : userId,
        email: userId.includes('@') ? userId : undefined
      },
      include: { accounts: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.accounts.length === 0) {
      throw new Error('No accounts found for user');
    }
    
    // Use first account
    const accountId = user.accounts[0].id;
    
    // Create notification for job started
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'CSV Upload Started',
        message: `Your file "${fileName}" is being processed in the background.`,
        type: 'info',
        relatedTo: 'transaction_upload'
      }
    }).catch((err: Error) => console.error('Failed to create notification:', err));
    
    // Update job progress
    if (dbJob) {
      await prisma.backgroundJob.update({
        where: { id: dbJob.id },
        data: {
          progress: 10
        }
      }).catch((err: Error) => console.error('Failed to update job progress:', err));
    }
    
    // Parse the CSV data
    console.log(`[Queue] Parsing CSV data for job ${jobId}`);
    const transactions = parseCSV(fileContent);
    console.log(`[Queue] Successfully parsed ${transactions.length} transactions for job ${jobId}`);
    
    // Update job progress
    if (dbJob) {
      await prisma.backgroundJob.update({
        where: { id: dbJob.id },
        data: {
          progress: 20
        }
      }).catch((err: Error) => console.error('Failed to update job progress:', err));
    }
    
    // Process transactions in smaller batches to prevent timeout issues
    const BATCH_SIZE = 50;
    const batches = [];
    
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      batches.push(transactions.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`[Queue] Split ${transactions.length} transactions into ${batches.length} batches of max ${BATCH_SIZE} for job ${jobId}`);
    
    let totalCreated = 0;
    let newBalance = 0;
    
    // Get current account balance first (outside transaction)
    console.log(`[Queue] Fetching current account balance for account: ${accountId}`);
    const currentAccount = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!currentAccount) {
      throw new Error('Account not found');
    }
    
    newBalance = currentAccount.balance;
    console.log(`[Queue] Starting balance: ${newBalance} for job ${jobId}`);
    
    // Update job progress
    if (dbJob) {
      await prisma.backgroundJob.update({
        where: { id: dbJob.id },
        data: {
          progress: 30
        }
      }).catch((err: Error) => console.error('Failed to update job progress:', err));
    }
    
    // Process each batch in a separate transaction
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[Queue] Processing batch ${batchIndex + 1} of ${batches.length} (${batch.length} transactions) for job ${jobId}`);
      
      try {
        // Use transaction with timeout option
        const result = await prisma.$transaction(async (tx) => {
          const createdTransactions = [];
          
          // Create transactions in this batch
          for (const transaction of batch) {
            console.log(`[Queue] Creating transaction: ${transaction.description}, type: ${transaction.type} for job ${jobId}`);
            
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
        if (dbJob) {
          await prisma.backgroundJob.update({
            where: { id: dbJob.id },
            data: {
              progress: progressPercentage
            }
          }).catch((err: Error) => console.error('Failed to update job progress:', err));
        }
        
        console.log(`[Queue] Batch ${batchIndex + 1} completed for job ${jobId}. Created ${result.length} transactions.`);
        
        // Every few batches, update the notification to show progress
        if (batchIndex % 5 === 0 || batchIndex === batches.length - 1) {
          if (dbJob) {
            await prisma.notification.create({
              data: {
                userId,
                title: 'CSV Upload Progress',
                message: `Processing: ${progressPercentage}% complete (${totalCreated} transactions processed)`,
                type: 'info',
                relatedTo: 'transaction_upload'
              }
            }).catch((err: Error) => console.error('Failed to create notification:', err));
          }
        }
      } catch (error: any) {
        console.error(`[Queue] Error processing batch ${batchIndex + 1} for job ${jobId}:`, error);
        
        // Update job with error
        if (dbJob) {
          await prisma.backgroundJob.update({
            where: { id: dbJob.id },
            data: {
              status: 'failed',
              error: `Error processing batch ${batchIndex + 1}: ${error.message}`
            }
          }).catch((err: Error) => console.error('Failed to update job status:', err));
        }
        
        // Create notification for the error
        if (dbJob) {
          await prisma.notification.create({
            data: {
              userId,
              title: 'CSV Upload Failed',
              message: `There was an error processing your upload: ${error.message}`,
              type: 'error',
              relatedTo: 'transaction_upload'
            }
          }).catch((err: Error) => console.error('Failed to create notification:', err));
        }
        
        throw error; // Rethrow to trigger Bull's retry mechanism if applicable
      }
    }
    
    // Update account balance in a separate transaction
    try {
      console.log(`[Queue] Updating account balance to: ${newBalance} for job ${jobId}`);
      if (dbJob) {
        await prisma.backgroundJob.update({
          where: { id: dbJob.id },
          data: {
            progress: 90
          }
        }).catch((err: Error) => console.error('Failed to update job progress:', err));
      }
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance }
      });
    } catch (error: any) {
      console.error(`[Queue] Error updating account balance for job ${jobId}:`, error);
      
      // Update job with partial success
      if (dbJob) {
        await prisma.backgroundJob.update({
          where: { id: dbJob.id },
          data: {
            status: 'completed',
            progress: 95,
            error: `Transactions were created but account balance could not be updated: ${error.message}`,
            result: {
              transactionsCreated: totalCreated,
              accountUpdateFailed: true
            }
          }
        }).catch((err: Error) => console.error('Failed to update job status:', err));
      }
      
      // Create notification for partial success
      if (dbJob) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'CSV Upload Partially Completed',
            message: `Successfully imported ${totalCreated} transactions, but account balance could not be updated.`,
            type: 'warning',
            relatedTo: 'transaction_upload'
          }
        }).catch((err: Error) => console.error('Failed to create notification:', err));
      }
      
      return { status: 'partial_success', transactionsCreated: totalCreated };
    }
    
    // Mark job as completed
    if (dbJob) {
      await prisma.backgroundJob.update({
        where: { id: dbJob.id },
        data: {
          status: 'completed',
          progress: 100,
          result: {
            transactionsCreated: totalCreated,
            accountBalanceUpdated: true,
            finalBalance: newBalance
          }
        }
      }).catch((err: Error) => console.error('Failed to update job status:', err));
    }
    
    // Create success notification only if there were transactions to create
    if (totalCreated > 0) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'CSV Upload Complete',
          message: `Successfully imported ${totalCreated} transactions from "${fileName}".`,
          type: 'info',
          relatedTo: 'transaction_upload'
        }
      }).catch((err: Error) => console.error('Failed to create notification:', err));
    }

    // Update account balance
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Balance Updated',
        message: `Your account balance has been updated to ₹${newBalance.toLocaleString()}.`,
        type: 'info',
        relatedTo: 'account_balance'
      }
    }).catch((err: Error) => console.error('Failed to create notification:', err));
    
    console.log(`[Queue] Upload job ${jobId} completed successfully. Created ${totalCreated} transactions`);
    return { status: 'success', transactionsCreated: totalCreated };
  } catch (error: any) {
    console.error(`[Queue] Error in background job:`, error);
    
    // Update job with error if not already updated
    if (dbJob) {
      await prisma.backgroundJob.update({
        where: { id: dbJob.id },
        data: {
          status: 'failed',
          error: error.message
        }
      }).catch(err => console.error('Failed to update job status:', err));
    }
    
    // Create notification for the error if not already created
    if (dbJob) {
      await prisma.notification.create({
        data: {
          userId,
          title: 'CSV Upload Failed',
          message: `There was an error processing your upload: ${error.message}`,
          type: 'error',
          relatedTo: 'transaction_upload'
        }
      }).catch(err => console.error('Failed to create notification:', err));
    }
    
    throw error; // Rethrow to trigger Bull's retry mechanism
  }
});

// Listen for completed events
uploadQueue.on('completed', (job: Bull.Job, result: any) => {
  console.log(`[Queue] Job ${job.id} completed with result:`, result);
});

// Listen for failed events
uploadQueue.on('failed', (job: Bull.Job, error: Error) => {
  console.error(`[Queue] Job ${job.id} failed with error:`, error.message);
});

// Export the queue for use in the API
export default uploadQueue; 