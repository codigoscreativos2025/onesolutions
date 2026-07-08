import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Solo closers y admins pueden ver sus proyectos
  if (role !== 'CLOSER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const whereClause = role === 'ADMIN' ? {} : { closerId: userId };

    const visits = await prisma.visit.findMany({
      where: {
        ...whereClause,
        stage: 'CLOSED',
      },
      orderBy: { completedAt: 'desc' },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
          },
        },
        setter: {
          select: {
            name: true,
          },
        },
        projects: {
          include: {
            projectType: {
              select: {
                name: true,
              },
            },
          },
        },
        projectDetails: true,
      },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
