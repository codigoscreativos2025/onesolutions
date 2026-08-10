import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    const adminId = adminUser?.id;

    const parcelsToExpire = await prisma.parcel.findMany({
      where: {
        setterId: { not: null },
        status: { not: 'CUSTOMER' },
        OR: [
          { lastActivityAt: { lt: thirtyDaysAgo } },
          {
            lastActivityAt: null,
            lastUpdatedAt: { lt: thirtyDaysAgo },
          },
          {
            lastActivityAt: null,
            lastUpdatedAt: null,
            claimedAt: { lt: thirtyDaysAgo },
          },
        ],
        ...(adminId ? { setterId: { not: adminId } } : {}),
      },
      include: {
        setter: { select: { id: true, name: true, role: true } },
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, stage: true },
        },
      },
    });

    const expiredParcels = [];

    for (const parcel of parcelsToExpire) {
      await prisma.parcel.update({
        where: { id: parcel.id },
        data: {
          setterId: null,
          status: 'AVAILABLE',
        },
      });

      if (parcel.setterId && parcel.setter?.role !== "SETTER") {
        await prisma.notification.create({
          data: {
            userId: parcel.setterId,
            title: 'Lead Expirado',
            body: `El lead "${parcel.address}" ha expirado por inactividad (30 días sin actividad).`,
            link: '/leads',
          },
        });
      }

      expiredParcels.push({
        parcelId: parcel.id,
        address: parcel.address,
        previousSetter: parcel.setter?.name || 'Unknown',
      });
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredParcels.length,
      expiredParcels,
    });
  } catch (error) {
    console.error('Error running parcel expiration cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    let whereClause: Record<string, unknown> = {};

    if (role === "PARTNER") {
      whereClause = { partnerId: userId, status: { not: 'CUSTOMER' } };
    } else if (role !== 'ADMIN') {
      whereClause = { setterId: userId, status: { not: 'CUSTOMER' } };
    }

    const parcels = await prisma.parcel.findMany({
      where: whereClause,
      include: {
        setter: { select: { id: true, name: true } },
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { stage: true },
        },
      },
      orderBy: { claimedAt: 'desc' },
    });

    const filteredParcels = parcels.filter((p) => {
      const latestVisit = p.visits?.[0];
      if (!latestVisit) return true;
      return !['PROPOSAL_ACCEPTED', 'PROJECT', 'CLOSED'].includes(latestVisit.stage);
    });

    const parcelsWithDaysRemaining = filteredParcels.map((parcel) => {
      const now = new Date();
      const lastActivity = parcel.lastActivityAt || parcel.lastUpdatedAt || parcel.claimedAt || now;
      const daysSinceActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, 30 - daysSinceActivity);
      const percentage = (daysRemaining / 30) * 100;

      return {
        ...parcel,
        daysSinceActivity,
        daysRemaining,
        percentage,
        isExpiringSoon: daysRemaining <= 7,
        isExpired: daysRemaining === 0,
      };
    });

    return NextResponse.json(parcelsWithDaysRemaining);
  } catch (error) {
    console.error('Error fetching parcels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
