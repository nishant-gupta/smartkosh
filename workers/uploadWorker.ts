import uploadQueue from '../lib/queue';

// This file is meant to be run in a separate process from the web server
// It will process jobs added to the queue

console.log('CSV Upload Worker started. Waiting for jobs...');

// Listen for queue events
uploadQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

uploadQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error.message);
});

// Process errors
uploadQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

// Keep the process running
process.on('SIGTERM', async () => {
  console.log('Worker received SIGTERM signal, closing queue...');
  await uploadQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker received SIGINT signal, closing queue...');
  await uploadQueue.close();
  process.exit(0);
});

// The queue processor is defined in the queue.ts file
// This file just starts the worker process 