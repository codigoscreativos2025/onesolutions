import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener todos los usuarios activos (setters, closers y admins)
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['SETTER', 'CLOSER', 'ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching mentionable users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
