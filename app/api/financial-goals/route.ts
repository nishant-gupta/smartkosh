import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getActualUserId } from '@/lib/apis/user';
import { createFinancialGoal, getFinancialGoals } from '@/lib/apis/financialGoals';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = await getActualUserId(session);
  if (!userId) return NextResponse.json({ error: 'User not properly authenticated' }, { status: 401 });
  const goals = await getFinancialGoals(userId);
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {

  try {

    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = await getActualUserId(session);
    if (!userId) return NextResponse.json({ error: 'User not properly authenticated' }, { status: 401 });
    
    const data = await req.json();
    const goal = await createFinancialGoal(userId, data);

    return NextResponse.json(goal);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 