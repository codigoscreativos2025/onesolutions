import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const visits = await prisma.visit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
          },
        },
        setter: {
          select: {
            id: true,
            name: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
          },
        },
        projects: {
          include: {
            projectType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        projectDetails: true,
        objections: {
          include: {
            objection: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        closerObjections: {
          include: {
            closerObjection: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        bill: {
          select: {
            imageUrl: true,
            additionalFileUrl: true,
            additionalFileName: true,
          },
        },
        chatRoom: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Error fetching CRM visits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
