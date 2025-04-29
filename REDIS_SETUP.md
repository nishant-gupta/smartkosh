# Redis and Background Job Setup

This document explains how to set up and run the background job processing system for SmartKosh, which is used for handling CSV uploads and other long-running tasks.

## Overview

The application uses:
- **Bull**: Queue system for managing background jobs
- **Redis**: In-memory database that powers the Bull queue
- **Worker Process**: Separate process that processes jobs from the queue

## Local Development Setup

### 1. Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Windows (using WSL or Docker):**
```bash
# WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# Docker
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Linux:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### 2. Configure Environment Variables

Add Redis URL to your `.env` file:
```
REDIS_URL=redis://localhost:6379
```

### 3. Running the Worker

First, make sure you have the required dependencies:
```bash
# Install tsx for running TypeScript directly
npm install --save-dev tsx
```

Then start the worker process in a separate terminal:
```bash
# On macOS/Linux
npm run worker

# On Windows
npm run worker:win
```

Alternatively, you can build and run the worker as compiled JavaScript:
```bash
# Build the worker
npm run build:worker

# Run the compiled worker
npm run start:worker
```

The worker will connect to Redis and process any jobs added to the queue.

### 4. Testing the Setup

1. Start your Next.js app: `npm run dev`
2. Start the worker: `npm run worker`
3. Upload a CSV file through the UI
4. Check the worker terminal for processing logs
5. Verify the notifications in the UI

## Production Setup

### Redis Hosting Options

#### 1. Upstash (Recommended for Vercel)

**Pros:**
- Serverless Redis designed for Vercel
- Free tier: 100MB database, 10,000 commands/day
- Paid tier starts at $5/month

**Setup:**
1. Create an account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the `REDIS_URL` to your Vercel environment variables

#### 2. Redis Labs (Redis Cloud)

**Pros:**
- Official Redis hosting
- Free tier: 30MB database, 30 connections
- Paid tier starts at $5-10/month

**Setup:**
1. Create an account at [redis.com](https://redis.com)
2. Create a Redis database
3. Copy the connection string to your Vercel environment variables

#### 3. AWS ElastiCache

**Pros:**
- Tightly integrated with AWS
- Scalable for production workloads

**Cons:**
- No free tier
- Starts at ~$15-20/month
- Requires VPC setup

#### 4. Self-hosted Redis

**Pros:**
- Full control
- Can be cheaper for basic needs

**Cons:**
- You manage security and backups
- Needs a VPS (~$5/month at DigitalOcean/Linode)

### Worker Deployment Options

Since Vercel's serverless functions terminate after the HTTP response, the worker must run on a separate platform:

#### 1. Railway

**Pros:**
- Easy setup
- Starts at $5/month
- Good integration with GitHub

**Setup:**
1. Create a Railway account
2. Create a new project
3. Connect to your GitHub repository
4. Set the start command to `npm run worker`
5. Add your `REDIS_URL` environment variable
6. Make sure to either:
   - Add `tsx` to your production dependencies: `npm install --save tsx`
   - Or modify your worker script to use Node.js with compiled JavaScript

#### 2. Heroku

**Pros:**
- Free tier available (with limitations)
- Easy to set up

**Setup:**
1. Create a Heroku account
2. Create a new app
3. Connect to your GitHub repository
4. Set the Procfile to `worker: npm run worker`
5. Add your `REDIS_URL` to config vars
6. Either:
   - Add `tsx` to your production dependencies: `npm install --save tsx`
   - Or compile TypeScript to JavaScript and update your worker script

#### 3. DigitalOcean / Linode / VPS

**Pros:**
- Full control
- ~$5/month for basic VPS

**Setup:**
1. Create a VPS
2. Clone your repository
3. Install Node.js
4. Run `npm install`
5. Install tsx: `npm install --save tsx`
6. Set up a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "worker" -- run worker
   pm2 startup
   pm2 save
   ```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │     │    Redis    │     │   Worker    │
│  (Vercel)   │     │             │     │  Process    │
│             │     │             │     │             │
│  API Routes ├────►│  Bull Queue ├────►│ Job Handler │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│  Database   │                         │  Database   │
│             │◄────────────────────────┤             │
│ Create Jobs │                         │Update Status│
└─────────────┘                         └─────────────┘
```

## Monitoring and Debugging

### Local Development

- Check worker process logs for job processing information
- Monitor Redis using the Redis CLI:
  ```bash
  redis-cli
  > KEYS *
  > LRANGE bull:csv-uploads:failed 0 -1
  ```

### Production 

- Use Upstash or Redis Labs dashboard to monitor Redis
- Set up logging for your worker process (e.g., Papertrail on Heroku)
- Check the `BackgroundJob` table in your database for job status

## Troubleshooting

### Common Issues

1. **Worker not processing jobs:**
   - Verify Redis is running
   - Check Redis connection string
   - Ensure worker process is running

2. **Jobs failing:**
   - Check worker logs for error messages
   - Verify database connection
   - Check for timeout issues on large uploads

3. **Notifications not appearing:**
   - Check worker logs to see if jobs complete
   - Verify the notification model in the database
   - Check front-end notification polling

## Project Structure

```
├── lib/
│   ├── queue.ts             # Bull queue setup and job processor
│   └── prisma.ts            # Prisma client
├── workers/
│   └── uploadWorker.ts      # Worker process starter
├── app/api/transactions/
│   └── upload/route.ts      # API endpoint that enqueues jobs
└── components/
    └── NotificationsMenu.tsx # UI for displaying notifications
```

## References

- [Bull Documentation](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md)
- [Redis Documentation](https://redis.io/documentation)
- [Vercel Deployment](https://vercel.com/docs/deployments/environments)
- [Upstash Documentation](https://docs.upstash.com/) 