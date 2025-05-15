# Financial Summary Background Queue System

This document describes the architecture and setup for the background financial summary update system using Bull, Upstash Redis, Vercel, and cron-job.org.

---

## Architecture Overview

1. **Enqueue on User Action**
   - When a user uploads a statement or adds/updates a transaction, their userId is added to a Bull queue (`financialSummaryQueue`) backed by Upstash Redis.

2. **Background Worker**
   - A Node.js script (`scripts/processFinancialSummaryQueue.ts`) runs as a worker, processing jobs from the queue.
   - For each userId, it:
     - Updates the financial summary for that user.
     - Tracks the job in the `BackgroundJob` table.
     - Notifies the user when the summary is updated.

3. **Cron Trigger**
   - An API route (`/api/cron/process-financial-summary-queue`) is available for cron-job.org to ping every 10 minutes.
   - The route is protected by a secret token (`CRON_SECRET` in your environment variables).
   - The actual processing is handled by the worker script, which should be running on a VM, Docker, or your local machine (not on Vercel serverless).

---

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env`:

```
REDIS_URL=your-upstash-redis-url
CRON_SECRET=your-strong-secret
```

### 2. Enqueue on Transaction/Upload

In your transaction upload and transaction update endpoints, enqueue a job:

```ts
import { financialSummaryQueue } from '@/lib/queue';
await financialSummaryQueue.add({ userId: user.id });
```

### 3. Background Worker

- The worker script is at `scripts/processFinancialSummaryQueue.ts`.
- **You must compile the TypeScript file to JavaScript before running it with Node.js.**
- Use only relative imports in the worker script (e.g., `import { prisma } from '../lib/prisma'`), not path aliases like `@/lib/prisma`.

#### **A. Compile the script:**
```
npx tsc scripts/processFinancialSummaryQueue.ts --outDir dist/scripts
```

#### **B. Run the compiled JavaScript:**
```
node dist/scripts/processFinancialSummaryQueue.js
```

#### **C. (Alternative for development) Use ts-node:**
```
npx ts-node scripts/processFinancialSummaryQueue.ts
```

- The worker will process jobs as they are enqueued.

### 4. Cron Trigger (for cron-job.org)

- Deploy your Vercel app.
- The API route `/api/cron/process-financial-summary-queue?token=CRON_SECRET` is now available.
- Set up cron-job.org to call this endpoint every 10 minutes.
- The endpoint is protected by the `CRON_SECRET` token.

### 5. Security

- The cron API route checks for a secret token to prevent unauthorized access.
- Never expose your `CRON_SECRET` publicly.

---

## File Overview

- `lib/queue.ts`: Sets up Bull queues for uploads and financial summary updates.
- `app/api/transactions/upload/route.ts`: Enqueues a summary update after transaction upload.
- `scripts/processFinancialSummaryQueue.ts`: Worker script that processes the queue and updates summaries.
- `app/api/cron/process-financial-summary-queue/route.ts`: API route for cron-job.org to trigger/monitor the worker.

---

## Troubleshooting

- **Worker not processing jobs?**
  - Ensure the worker script is running and can connect to Upstash Redis.
  - Check logs for errors.
- **Jobs not enqueued?**
  - Ensure the enqueue code is called after transaction/upload actions.
- **API route returns 401?**
  - Make sure you are passing the correct `token` query parameter matching `CRON_SECRET`.
- **Vercel timeout?**
  - All heavy processing is offloaded to the worker; API routes should return quickly.
- **ERR_MODULE_NOT_FOUND or import errors?**
  - Make sure you are using relative imports in your worker script and have compiled TypeScript to JavaScript before running with Node.js.

---

## Best Practices

- Run the worker script on a persistent environment (not Vercel serverless).
- Monitor the queue and worker logs for failures.
- Use Upstash Redis for serverless-compatible, globally available queueing.
- Protect all cron endpoints with a secret.

---

## Example Cron-job.org Setup

- URL: `https://your-vercel-app.vercel.app/api/cron/process-financial-summary-queue?token=CRON_SECRET`
- Method: GET
- Schedule: Every 10 minutes

---

## NPM Scripts (Recommended)

Add these to your `package.json`:

```json
{
  "scripts": {
    "build:worker": "tsc scripts/processFinancialSummaryQueue.ts --outDir dist/scripts",
    "start:worker": "node dist/scripts/processFinancialSummaryQueue.js"
  }
}
```

- Build the worker: `npm run build:worker`
- Run the worker: `npm run start:worker`

For development, you can use:
```
npx ts-node scripts/processFinancialSummaryQueue.ts
```

---

## Extending

- You can enqueue other types of background jobs using the same pattern.
- For more advanced scheduling, consider using a managed queue worker platform or a dedicated VM. 