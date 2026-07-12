import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

// Cron job que se ejecuta diariamente para verificar parcelas sin actividad por 30 días
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Encontrar parcelas que:
    // 1. Tienen un setter asignado
    // 2. No han tenido actividad en los últimos 30 días
    // 3. No están en estado CUSTOMER (ya cerradas)
    const parcelsToExpire = await prisma.parcel.findMany({
      where: {
        setterId: { not: null },
        status: { not: 'CUSTOMER' },
        OR: [
          { lastActivityAt: { lt: thirtyDaysAgo } },
          { lastActivityAt: null, claimedAt: { lt: thirtyDaysAgo } },
        ],
      },
      include: {
        setter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const expiredParcels = [];

    for (const parcel of parcelsToExpire) {
      // Liberar la parcela
      await prisma.parcel.update({
        where: { id: parcel.id },
        data: {
          setterId: null,
          status: 'AVAILABLE',
          lastActivityAt: null,
          claimedAt: null,
        },
      });

      // Notificar al setter que perdió la parcela
      if (parcel.setterId) {
        await prisma.notification.create({
          data: {
            userId: parcel.setterId,
            title: 'Parcela Liberada',
            body: `La parcela "${parcel.address}" ha sido liberada por inactividad (30 días sin actividad).`,
            link: '/my-parcels',
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

// Endpoint para verificar el estado de las parcelas de un setter
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const parcels = await prisma.parcel.findMany({
      where: {
        setterId: role === 'ADMIN' ? undefined : userId,
        status: { not: 'CUSTOMER' },
      },
      include: {
        setter: {
          select: {
            id: true,
            name: true,
          },
        },
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            stage: true,
          },
        },
      },
      orderBy: {
        claimedAt: 'desc',
      },
    });

    // Filtrar parcelas cuya última visita esté en PROPOSAL_ACCEPTED o CLOSED
    const filteredParcels = parcels.filter((p) => {
      const latestVisit = p.visits?.[0];
      return !latestVisit || !['PROPOSAL_ACCEPTED', 'CLOSED'].includes(latestVisit.stage);
    });

    const parcelsWithDaysRemaining = filteredParcels.map((parcel) => {
      const now = new Date();
      const lastActivity = parcel.lastActivityAt || parcel.claimedAt || now;
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
