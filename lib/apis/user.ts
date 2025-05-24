import { prisma } from '@/lib/prisma';

export async function getActualUserId(session: any) {
  let userId = (session.user as any).id;
  const userEmail = session.user.email;
  if (!userId && userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
    if (!user) return null;
    userId = user.id;
  }
  return userId;
}