import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { encrypt, decrypt } from '@/lib/encryption';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const isOwnProfile = session.user.id === String(userId);
    const isAdmin = session.user.role === 'ADMIN';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        avatarUrl: true,
        closer: {
          select: { id: true, name: true },
        },
        setters: {
          select: { id: true, name: true },
        },
        userBadges: {
          include: {
            badge: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        ...(isOwnProfile || isAdmin ? {
          profile: {
            select: {
              address: true,
              ssn: true,
              dateOfBirth: true,
              bankName: true,
              routingNumber: true,
              zelle: true,
              profilePhoto: true,
            },
          },
        } : {}),
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const stats = await prisma.visit.aggregate({
      where: {
        OR: [
          { setterId: userId },
          { closerId: userId },
        ],
      },
      _count: {
        id: true,
      },
    });

    const doorsKnocked = await prisma.visit.count({
      where: { setterId: userId },
    });

    const leadsGenerated = await prisma.visit.count({
      where: {
        setterId: userId,
        stage: { in: ['PROPOSAL_ACCEPTED', 'CLOSED'] },
      },
    });

    const projectsClosed = await prisma.visit.count({
      where: {
        closerId: userId,
        stage: 'CLOSED',
      },
    });

    const visitsByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM Visit
      WHERE setterId = ${userId} OR closerId = ${userId}
      GROUP BY month
      ORDER BY count DESC
      LIMIT 1
    `;

    const bestMonth = visitsByMonth[0] 
      ? { month: visitsByMonth[0].month, count: Number(visitsByMonth[0].count) }
      : null;

    const result: Record<string, unknown> = {
      ...user,
      stats: {
        totalVisits: stats._count.id,
        doorsKnocked,
        leadsGenerated,
        projectsClosed,
      },
      bestMonth,
    };

    if (result.profile && (isOwnProfile || isAdmin)) {
      const profile = result.profile as Record<string, unknown>;
      if (profile.ssn && typeof profile.ssn === 'string') {
        profile.ssn = decrypt(profile.ssn);
      }
      if (profile.routingNumber && typeof profile.routingNumber === 'string') {
        profile.routingNumber = decrypt(profile.routingNumber);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const isOwnProfile = session.user.id === String(userId);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { phone, address, dateOfBirth, bankName, zelle, ssn, routingNumber } = body;

    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone },
      });
    }

    const profileData: Record<string, unknown> = {};
    if (address !== undefined) profileData.address = address;
    if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (bankName !== undefined) profileData.bankName = bankName;
    if (zelle !== undefined) profileData.zelle = zelle;
    if (ssn !== undefined) profileData.ssn = ssn ? encrypt(ssn) : null;
    if (routingNumber !== undefined) profileData.routingNumber = routingNumber ? encrypt(routingNumber) : null;

    if (Object.keys(profileData).length > 0) {
      await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
