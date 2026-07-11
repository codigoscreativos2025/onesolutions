import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const userIds: number[] = [];

    if (roomId) {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: parseInt(roomId) },
        select: {
          visit: {
            select: {
              setterId: true,
              closerId: true,
            },
          },
        },
      });

      if (chatRoom?.visit) {
        if (chatRoom.visit.setterId) userIds.push(chatRoom.visit.setterId);
        if (chatRoom.visit.closerId) userIds.push(chatRoom.visit.closerId);
      }
    }

    const admins = await prisma.user.findMany({
      where: { isActive: true, role: 'ADMIN' },
      select: { id: true, name: true, role: true },
    });

    for (const admin of admins) {
      if (!userIds.includes(admin.id)) userIds.push(admin.id);
    }

    if (userIds.length === 0) {
      return NextResponse.json(admins);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching mentionable users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
