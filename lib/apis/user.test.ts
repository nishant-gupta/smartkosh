import { getActualUserId } from './user';
import { prisma } from '@/lib/prisma';

describe('getActualUserId', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns userId if present in session', async () => {
    const session = { user: { id: 'user-123', email: 'test@example.com' } };
    const result = await getActualUserId(session);
    expect(result).toBe('user-123');
  });

  it('looks up user by email if userId is missing', async () => {
    const session = { user: { email: 'test@example.com' } };
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: 'user-456' } as any);
    const result = await getActualUserId(session);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' }, select: { id: true } });
    expect(result).toBe('user-456');
  });

  it('returns null if user not found by email', async () => {
    const session = { user: { email: 'notfound@example.com' } };
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
    const result = await getActualUserId(session);
    expect(result).toBeNull();
  });

  it('returns null if userId and email are missing', async () => {
    const session = { user: {} };
    const result = await getActualUserId(session);
    expect(result).toBeUndefined();
  });
}); 