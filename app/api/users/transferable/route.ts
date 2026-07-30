import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: all ? ['SETTER', 'SETTER_JR', 'CLOSER', 'ADMIN', 'PARTNER'] : ['SETTER', 'SETTER_JR', 'CLOSER'] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching transferable users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
