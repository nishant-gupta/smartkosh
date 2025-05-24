import { prisma } from '@/lib/prisma';

export async function getFinancialGoals(userId: string) {
  return prisma.financialGoal.findMany({ where: { userId } });
}

export async function getFinancialGoal(userId: string, goalId: string) {
  return prisma.financialGoal.findFirst({ where: { id: goalId, userId } });
}

export async function createFinancialGoal(userId: string, data: any) {
  // Remove 'user' property if present
  if ('user' in data) delete data.user;
  // Parse float fields
  const monthlyContributionEstimate = data.monthlyContributionEstimate ? parseFloat(data.monthlyContributionEstimate) : 0;
  const targetAmount = data.targetAmount ? parseFloat(data.targetAmount) : 0;
  const currentAmount = data.currentAmount ? parseFloat(data.currentAmount) : 0;

  console.log("Creating goal with user ID:", userId);
  console.log("Monthly contribution estimate:", monthlyContributionEstimate);
  console.log("Target amount:", targetAmount);
  console.log("Current amount:", currentAmount);

  const { user, ...rest } = data;
  const goal = await prisma.financialGoal.create({
    data: { ...rest, userId, monthlyContributionEstimate, targetAmount, currentAmount },
  });

  return goal;
}

export async function updateFinancialGoal(userId: string, goalId: string, data: any) {
  if ('user' in data) delete data.user;
  const monthlyContributionEstimate = data.monthlyContributionEstimate ? parseFloat(data.monthlyContributionEstimate) : 0;
  const targetAmount = data.targetAmount ? parseFloat(data.targetAmount) : 0;
  const currentAmount = data.currentAmount ? parseFloat(data.currentAmount) : 0;
  // format targetDate to ISO string
  const targetDate = data.targetDate ? new Date(data.targetDate).toISOString() : null;
  console.log("Target date:", targetDate);
  
  // remove user from data
  delete data.user;
  delete data.userId;
  return prisma.financialGoal.update({
    where: { id: goalId, userId },
    data: { ...data, monthlyContributionEstimate, targetAmount, currentAmount, targetDate: targetDate },
  });
}

export async function deleteFinancialGoal(userId: string, goalId: string) {
  return prisma.financialGoal.delete({ where: { id: goalId, userId } });
} 