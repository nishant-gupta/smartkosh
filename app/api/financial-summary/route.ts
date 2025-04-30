import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));

  if (!year || !month) {
    return NextResponse.json({ error: 'Missing year or month' }, { status: 400 });
  }

  try {
    const summaries = await prisma.financialSummary.findMany({
      where: {
        userId: session.user.id,
        year,
        month,
      },
    });
    return NextResponse.json(summaries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch financial summary' }, { status: 500 });
  }
} 