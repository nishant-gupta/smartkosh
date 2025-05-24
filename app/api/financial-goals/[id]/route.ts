import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { updateFinancialGoal, deleteFinancialGoal, getFinancialGoal } from '@/lib/apis/financialGoals';
import { getActualUserId 

} from '@/lib/apis/user';
// import { authOptions } from '@/app/lib/auth-options';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // const session = await getServerSession(authOptions, req);
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getActualUserId(session);
  if (!userId) return NextResponse.json({ error: 'User not properly authenticated' }, { status: 401 });
  const goal = await getFinancialGoal(userId, params.id);
  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // const session = await getServerSession(authOptions, req);
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getActualUserId(session);
  if (!userId) return NextResponse.json({ error: 'User not properly authenticated' }, { status: 401 });
  const data = await req.json();

  const goal = await updateFinancialGoal(userId, params.id, data);
  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // const session = await getServerSession(authOptions, req);
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getActualUserId(session);
  if (!userId) return NextResponse.json({ error: 'User not properly authenticated' }, { status: 401 });
  await deleteFinancialGoal(userId, params.id);
  return NextResponse.json({ success: true });
} 