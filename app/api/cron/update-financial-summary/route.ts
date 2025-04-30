import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    for (const user of users) {
      // Get all transactions for the user
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'asc' }
      });

      // Group transactions by year, month, category, and type
      const summaries = new Map<string, {
        userId: string;
        year: number;
        month: number;
        category: string;
        type: string;
        amount: number;
      }>();

      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${user.id}-${year}-${month}-${transaction.category}-${transaction.type}`;

        if (!summaries.has(key)) {
          summaries.set(key, {
            userId: user.id,
            year,
            month,
            category: transaction.category,
            type: transaction.type,
            amount: 0
          });
        }

        const summary = summaries.get(key)!;
        summary.amount += transaction.amount;
      });

      // Update or create summaries in the database
      for (const summary of summaries.values()) {
        await prisma.financialSummary.upsert({
          where: {
            userId_year_month_category_type: {
              userId: summary.userId,
              year: summary.year,
              month: summary.month,
              category: summary.category,
              type: summary.type
            }
          },
          update: {
            amount: summary.amount,
            updatedAt: new Date()
          },
          create: {
            userId: summary.userId,
            year: summary.year,
            month: summary.month,
            category: summary.category,
            type: summary.type,
            amount: summary.amount
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating financial summaries:', error);
    return NextResponse.json(
      { error: 'Failed to update financial summaries' },
      { status: 500 }
    );
  }
} 