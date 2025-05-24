import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Validate environment variables
const requiredEnvVars = ['DATABASE_URL', 'PROD_DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('Using development database:', process.env.DATABASE_URL);
console.log('Using production database:', process.env.PROD_DATABASE_URL);

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PROD_DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

async function syncDatabase() {
  try {
    console.log('Starting database sync...');
    
    // Test connections
    console.log('Testing database connections...');
    try {
      await prodPrisma.$connect();
      console.log('✓ Successfully connected to production database');
    } catch (error) {
      console.error('Failed to connect to production database:', error);
      throw error;
    }

    try {
      await devPrisma.$connect();
      console.log('✓ Successfully connected to development database');
    } catch (error) {
      console.error('Failed to connect to development database:', error);
      throw error;
    }

    // Sync Users
    console.log('\nSyncing users...');
    const users = await prodPrisma.user.findMany();
    console.log(`Found ${users.length} users to sync`);
    for (const user of users) {
      await devPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log('✓ Users synced successfully');

    // Sync Accounts
    console.log('\nSyncing accounts...');
    const accounts = await prodPrisma.account.findMany();
    console.log(`Found ${accounts.length} accounts to sync`);
    for (const account of accounts) {
      await devPrisma.account.upsert({
        where: { id: account.id },
        update: account,
        create: account,
      });
    }
    console.log('✓ Accounts synced successfully');

    // Sync Transactions
    console.log('\nSyncing transactions...');
    const transactions = await prodPrisma.transaction.findMany();
    console.log(`Found ${transactions.length} transactions to sync`);
    for (const transaction of transactions) {
      await devPrisma.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction,
      });
    }
    console.log('✓ Transactions synced successfully');

    // Sync Budgets
    console.log('\nSyncing budgets...');
    const budgets = await prodPrisma.budget.findMany();
    console.log(`Found ${budgets.length} budgets to sync`);
    for (const budget of budgets) {
      await devPrisma.budget.upsert({
        where: { id: budget.id },
        update: budget,
        create: budget,
      });
    }
    console.log('✓ Budgets synced successfully');

    // Sync Financial Goals
    // console.log('\nSyncing financial goals...');
    // const goals = await prodPrisma.financialGoal.findMany();
    // console.log(`Found ${goals.length} goals to sync`);
    // for (const goal of goals) {
    //   await devPrisma.financialGoal.upsert({
    //     where: { id: goal.id },
    //     update: goal,
    //     create: goal,
    //   });
    // }
    // console.log('✓ Financial goals synced successfully');

    // Sync Profiles
    console.log('\nSyncing profiles...');
    const profiles = await prodPrisma.profile.findMany();
    console.log(`Found ${profiles.length} profiles to sync`);
    for (const profile of profiles) {
      await devPrisma.profile.upsert({
        where: { id: profile.id },
        update: profile,
        create: profile,
      });
    }
    console.log('✓ Profiles synced successfully');

    // Sync Financial Profiles
    console.log('\nSyncing financial profiles...');
    const financialProfiles = await prodPrisma.financialProfile.findMany();
    console.log(`Found ${financialProfiles.length} financial profiles to sync`);
    for (const profile of financialProfiles) {
      await devPrisma.financialProfile.upsert({
        where: { id: profile.id },
        update: profile,
        create: profile,
      });
    }
    console.log('✓ Financial profiles synced successfully');

    // Sync Notifications
    console.log('\nSyncing notifications...');
    const notifications = await prodPrisma.notification.findMany();
    console.log(`Found ${notifications.length} notifications to sync`);
    for (const notification of notifications) {
      await devPrisma.notification.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification,
      });
    }
    console.log('✓ Notifications synced successfully');

    // Sync Background Jobs
    console.log('\nSyncing background jobs...');
    const backgroundJobs = await prodPrisma.backgroundJob.findMany();
    console.log(`Found ${backgroundJobs.length} background jobs to sync`);
    for (const job of backgroundJobs) {
      const { result, ...jobData } = job;
      await devPrisma.backgroundJob.upsert({
        where: { id: job.id },
        update: {
          ...jobData,
          result: result as Prisma.InputJsonValue,
        },
        create: {
          ...jobData,
          result: result as Prisma.InputJsonValue,
        },
      });
    }
    console.log('✓ Background jobs synced successfully');

    // Sync Financial Summaries
    console.log('\nSyncing financial summaries...');
    const summaries = await prodPrisma.financialSummary.findMany();
    console.log(`Found ${summaries.length} financial summaries to sync`);
    for (const summary of summaries) {
      await devPrisma.financialSummary.upsert({
        where: { id: summary.id },
        update: summary,
        create: summary,
      });
    }
    console.log('✓ Financial summaries synced successfully');

    console.log('\n✨ Database sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Error syncing database:', error);
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
    await devPrisma.$disconnect();
  }
}

syncDatabase(); 