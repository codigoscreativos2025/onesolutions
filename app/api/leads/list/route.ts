import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  const parcelWhere: Record<string, unknown> = {};

  if (role === 'SETTER' || role === 'SETTER_JR') {
    parcelWhere.setterId = userId;
  } else if (role === 'CLOSER') {
    parcelWhere.OR = [
      { setterId: userId },
      { visits: { some: { closerId: userId } } },
    ];
  } else if (role === 'PARTNER') {
    parcelWhere.partnerId = userId;
  }

  parcelWhere.status = { not: 'CUSTOMER' };

  const parcels = await prisma.parcel.findMany({
    where: parcelWhere,
    include: {
      setter: { select: { id: true, name: true } },
      partner: { select: { id: true, name: true } },
      visits: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          objections: {
            include: { objection: { select: { name: true, color: true } } },
          },
          closerObjections: {
            include: { closerObjection: { select: { name: true, color: true } } },
          },
          projects: {
            include: { projectType: { select: { id: true, name: true } } },
          },
          bill: { select: { clientName: true, phone: true } },
          setter: { select: { id: true, name: true } },
          closer: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { lastActivityAt: 'desc' },
  });

  const now = new Date();

  const result = parcels.map((p) => {
    const latestVisit = p.visits[0];
    const lastActivity = p.lastActivityAt || p.claimedAt;
    const daysSinceActivity = lastActivity
      ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const expiryDate = p.lastActivityAt
      ? new Date(new Date(p.lastActivityAt).getTime() + 30 * 24 * 60 * 60 * 1000)
      : p.claimedAt
        ? new Date(new Date(p.claimedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
    const daysLeft = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const isExpired = daysLeft !== null && daysLeft <= 0;
    const isExpiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

    return {
      ...p,
      daysSinceActivity,
      daysLeft,
      isExpired,
      isExpiring,
      hasObjections: (latestVisit?.objections?.length || 0) > 0 || (latestVisit?.closerObjections?.length || 0) > 0,
      stage: latestVisit?.stage || 'AVAILABLE',
    };
  });

  return NextResponse.json(result);
}
