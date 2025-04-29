"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const prisma_1 = require("./prisma");
const sync_1 = require("csv-parse/sync");
// Redis connection string - will need to be set in .env
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// Create upload queue
exports.uploadQueue = new bull_1.default('csv-uploads', REDIS_URL, {
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
// Function to parse the CSV file content
function parseCSV(content) {
    try {
        // Parse CSV content
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        // Get current year for validation
        const currentYear = new Date().getFullYear();
        // Validate and transform records
        return records.map((record) => {
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
            }
            else {
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
    }
    catch (error) {
        console.error('CSV parsing error details:', error);
        throw new Error(`CSV parsing error: ${error.message}`);
    }
}
// Process upload jobs
exports.uploadQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId, fileContent, userId, accountId } = job.data;
    console.log(`[Queue] Starting processing for job ${jobId}`);
    try {
        // Update job status to processing
        yield prisma_1.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'processing',
                progress: 10
            }
        });
        // Parse the CSV data
        console.log(`[Queue] Parsing CSV data for job ${jobId}`);
        const transactions = parseCSV(fileContent);
        console.log(`[Queue] Successfully parsed ${transactions.length} transactions for job ${jobId}`);
        // Update job progress
        yield prisma_1.prisma.backgroundJob.update({
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
        console.log(`[Queue] Split ${transactions.length} transactions into ${batches.length} batches of max ${BATCH_SIZE} for job ${jobId}`);
        let totalCreated = 0;
        let newBalance = 0;
        // Get current account balance first (outside transaction)
        console.log(`[Queue] Fetching current account balance for account: ${accountId}`);
        const currentAccount = yield prisma_1.prisma.account.findUnique({
            where: { id: accountId }
        });
        if (!currentAccount) {
            throw new Error('Account not found');
        }
        newBalance = currentAccount.balance;
        console.log(`[Queue] Starting balance: ${newBalance} for job ${jobId}`);
        // Update job progress
        yield prisma_1.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                progress: 30
            }
        });
        // Process each batch in a separate transaction
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`[Queue] Processing batch ${batchIndex + 1} of ${batches.length} (${batch.length} transactions) for job ${jobId}`);
            try {
                // Use transaction with timeout option
                const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    const createdTransactions = [];
                    // Create transactions in this batch
                    for (const transaction of batch) {
                        console.log(`[Queue] Creating transaction: ${transaction.description}, type: ${transaction.type} for job ${jobId}`);
                        const createdTransaction = yield tx.transaction.create({
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
                        }
                        else if (transaction.type === 'expense') {
                            newBalance -= transaction.amount;
                        }
                    }
                    return createdTransactions;
                }), {
                    timeout: 30000, // 30 second timeout for each batch transaction
                    maxWait: 5000, // Max 5 seconds waiting for transaction to start
                    isolationLevel: 'ReadCommitted' // Less strict isolation level
                });
                totalCreated += result.length;
                // Update job progress
                const progressPercentage = 30 + Math.floor(60 * (batchIndex + 1) / batches.length);
                yield prisma_1.prisma.backgroundJob.update({
                    where: { id: jobId },
                    data: {
                        progress: progressPercentage
                    }
                });
                console.log(`[Queue] Batch ${batchIndex + 1} completed for job ${jobId}. Created ${result.length} transactions.`);
                // Every few batches, update the notification to show progress
                if (batchIndex % 5 === 0 || batchIndex === batches.length - 1) {
                    yield prisma_1.prisma.notification.create({
                        data: {
                            userId,
                            title: 'CSV Upload Progress',
                            message: `Processing: ${progressPercentage}% complete (${totalCreated} transactions processed)`,
                            type: 'info',
                            relatedTo: 'transaction_upload',
                            data: { jobId, transactionsCreated: totalCreated }
                        }
                    });
                }
            }
            catch (error) {
                console.error(`[Queue] Error processing batch ${batchIndex + 1} for job ${jobId}:`, error);
                // Update job with error
                yield prisma_1.prisma.backgroundJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'failed',
                        error: `Error processing batch ${batchIndex + 1}: ${error.message}`
                    }
                });
                // Create notification for the error
                yield prisma_1.prisma.notification.create({
                    data: {
                        userId,
                        title: 'CSV Upload Failed',
                        message: `There was an error processing your upload: ${error.message}`,
                        type: 'error',
                        relatedTo: 'transaction_upload',
                        data: { jobId }
                    }
                });
                throw error; // Rethrow to trigger Bull's retry mechanism if applicable
            }
        }
        // Update account balance in a separate transaction
        try {
            console.log(`[Queue] Updating account balance to: ${newBalance} for job ${jobId}`);
            yield prisma_1.prisma.account.update({
                where: { id: accountId },
                data: { balance: newBalance }
            });
        }
        catch (error) {
            console.error(`[Queue] Error updating account balance for job ${jobId}:`, error);
            // Update job with partial success
            yield prisma_1.prisma.backgroundJob.update({
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
            yield prisma_1.prisma.notification.create({
                data: {
                    userId,
                    title: 'CSV Upload Partially Completed',
                    message: `Successfully imported ${totalCreated} transactions, but account balance could not be updated.`,
                    type: 'warning',
                    relatedTo: 'transaction_upload',
                    data: { jobId, transactionsCreated: totalCreated }
                }
            });
            return { status: 'partial_success', transactionsCreated: totalCreated };
        }
        // Mark job as completed
        yield prisma_1.prisma.backgroundJob.update({
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
        yield prisma_1.prisma.notification.create({
            data: {
                userId,
                title: 'CSV Upload Completed',
                message: `Successfully imported ${totalCreated} transactions.`,
                type: 'success',
                relatedTo: 'transaction_upload',
                data: { jobId, transactionsCreated: totalCreated }
            }
        });
        console.log(`[Queue] Upload job ${jobId} completed successfully. Created ${totalCreated} transactions`);
        return { status: 'success', transactionsCreated: totalCreated };
    }
    catch (error) {
        console.error(`[Queue] Error in background job ${jobId}:`, error);
        // Update job with error if not already updated
        yield prisma_1.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                error: error.message
            }
        });
        // Create notification for the error if not already created
        yield prisma_1.prisma.notification.create({
            data: {
                userId,
                title: 'CSV Upload Failed',
                message: `There was an error processing your upload: ${error.message}`,
                type: 'error',
                relatedTo: 'transaction_upload',
                data: { jobId }
            }
        });
        throw error; // Rethrow to trigger Bull's retry mechanism
    }
}));
// Listen for completed events
exports.uploadQueue.on('completed', (job, result) => {
    console.log(`[Queue] Job ${job.id} completed with result:`, result);
});
// Listen for failed events
exports.uploadQueue.on('failed', (job, error) => {
    console.error(`[Queue] Job ${job.id} failed with error:`, error.message);
});
// Export the queue for use in the API
exports.default = exports.uploadQueue;
