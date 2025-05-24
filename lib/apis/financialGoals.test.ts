import { getFinancialGoals, getFinancialGoal, createFinancialGoal, updateFinancialGoal, deleteFinancialGoal } from './financialGoals';
import { prisma } from '@/lib/prisma';

describe('financialGoals logic', () => {
  const userId = 'user-123';
  const goalId = 'goal-abc';
  const goalData = {
    title: 'Test Goal',
    description: 'desc',
    goalType: 'retirement',
    targetAmount: '1000',
    currentAmount: '100',
    targetDate: '2030-01-01',
    monthlyContributionEstimate: '100',
    priority: 1,
    status: 'in_progress',
    source: 'user_created',
    acceptedByUser: true,
  };

  afterEach(() => jest.restoreAllMocks());

  it('gets financial goals for a user', async () => {
    jest.spyOn(prisma.financialGoal, 'findMany').mockResolvedValueOnce([{ id: goalId, ...goalData }] as any);
    const result = await getFinancialGoals(userId);
    expect(prisma.financialGoal.findMany).toHaveBeenCalledWith({ where: { userId } });
    expect(result[0].id).toBe(goalId);
  });

  it('gets a single financial goal by id', async () => {
    jest.spyOn(prisma.financialGoal, 'findFirst').mockResolvedValueOnce({ id: goalId, ...goalData } as any);
    const result = await getFinancialGoal(userId, goalId);
    expect(prisma.financialGoal.findFirst).toHaveBeenCalledWith({ where: { id: goalId, userId } });
    expect(result && result.id).toBe(goalId);
  });

  it('creates a financial goal', async () => {
    jest.spyOn(prisma.financialGoal, 'create').mockResolvedValueOnce({ id: goalId, ...goalData } as any);
    const result = await createFinancialGoal(userId, goalData);
    expect(prisma.financialGoal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...goalData,
        userId,
        targetAmount: 1000,
        currentAmount: 100,
        monthlyContributionEstimate: 100,
      }),
    });
    expect(result.id).toBe(goalId);
  });

  it('removes user property if present in create', async () => {
    const spy = jest.spyOn(prisma.financialGoal, 'create').mockResolvedValueOnce({ id: goalId, ...goalData } as any);
    const dataWithUser = { ...goalData, user: { id: 'should-not-be-used' } };
    await createFinancialGoal(userId, dataWithUser);
    expect(spy.mock.calls[0][0].data.user).toBeUndefined();
  });

  it('updates a financial goal', async () => {
    jest.spyOn(prisma.financialGoal, 'update').mockResolvedValueOnce({ id: goalId, ...goalData } as any);
    const result = await updateFinancialGoal(userId, goalId, goalData);
    expect(prisma.financialGoal.update).toHaveBeenCalledWith({
      where: { id: goalId, userId },
      data: expect.objectContaining({
        ...goalData,
        targetAmount: 1000,
        currentAmount: 100,
        monthlyContributionEstimate: 100,
      }),
    });
    expect(result.id).toBe(goalId);
  });

  it('deletes a financial goal', async () => {
    jest.spyOn(prisma.financialGoal, 'delete').mockResolvedValueOnce({ id: goalId } as any);
    const result = await deleteFinancialGoal(userId, goalId);
    expect(prisma.financialGoal.delete).toHaveBeenCalledWith({ where: { id: goalId, userId } });
    expect(result.id).toBe(goalId);
  });
}); 