import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

// Cron job que se ejecuta diariamente para verificar parcelas sin actividad por 30 días
// Solo expiran leads con objeciones o no-disponible; avances exitosos NO expiran
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
    // 2. No están en estado CUSTOMER
    // 3. Todas sus visitas más recientes son OBJECTION o NOT_AVAILABLE
    //    (avances exitosos como PROPOSAL_ACCEPTED, PROJECT, CLOSED no expiran)
    const allParcels = await prisma.parcel.findMany({
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
          select: { id: true, name: true },
        },
        visits: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, stage: true, outcome: true },
        },
      },
    });

    // Filtrar: solo expiran leads donde la última visita es OBJECTION o NOT_AVAILABLE
    // Si la última visita es PROPOSAL_ACCEPTED, PROJECT, CLOSED o no tiene visitas con objeciones → NO expira
    const parcelsToExpire = allParcels.filter((parcel) => {
      const latestVisit = parcel.visits[0];
      if (!latestVisit) return true; // sin visitas → expira
      // Solo expira si la última visita fue objeción o no disponible
      return latestVisit.stage === 'OBJECTION' || latestVisit.outcome === 'NOT_AVAILABLE';
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

// Endpoint para verificar el estado de las parcelas de un setter
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

    // Filtrar parcelas cuya última visita esté en PROPOSAL_ACCEPTED, PROJECT, o CLOSED
    // Estas NO expiran porque son avances exitosos
    const filteredParcels = parcels.filter((p) => {
      const latestVisit = p.visits?.[0];
      if (!latestVisit) return true;
      return !['PROPOSAL_ACCEPTED', 'PROJECT', 'CLOSED'].includes(latestVisit.stage);
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
