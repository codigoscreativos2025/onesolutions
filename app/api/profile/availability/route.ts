import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['SETTER', 'SETTER_JR', 'CLOSER', 'ADMIN'];

interface DayData {
  available: boolean;
  ranges: { start: string; end: string }[];
}

function parseAvailability(raw: string): Record<string, DayData | boolean> {
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : parseInt(session.user.id);

  try {
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const now = new Date();
    const targetDate = month && year
      ? new Date(parseInt(year), parseInt(month) - 1)
      : now;

    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const stored = profile?.dayAvailability ? parseAvailability(profile.dayAvailability) : {};

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const monthAvailability: Record<string, DayData> = {};
    let day = monthStart;
    while (day <= monthEnd) {
      const key = format(day, 'yyyy-MM-dd');
      const val = stored[key];
      if (typeof val === 'boolean') {
        monthAvailability[key] = { available: val, ranges: val ? [{ start: "09:00", end: "17:00" }] : [] };
      } else if (val && typeof val === 'object') {
        monthAvailability[key] = { available: val.available ?? true, ranges: val.ranges || [] };
      } else {
        monthAvailability[key] = { available: true, ranges: [{ start: "09:00", end: "17:00" }] };
      }
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }

    const currentUserId = parseInt(session.user.id);
    // Fetch visits for both the target user and the session user to prevent double-booking
    const visits = await prisma.visit.findMany({
      where: {
        OR: [
          { closerId: userId },
          { setterId: userId },
          { closerId: currentUserId },
          { setterId: currentUserId }
        ],
        scheduledAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        stage: { not: "CANCELLED" }
      },
      select: { scheduledAt: true }
    });
    
    // Create an array of strings representing exact booked times, e.g. "2026-08-26T16:00:00.000Z"
    const bookedSlots = visits.map(v => v.scheduledAt?.toISOString()).filter(Boolean);

    return NextResponse.json({
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      availability: monthAvailability,
      bookedSlots,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role;
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const { date, available, ranges } = body;

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const stored = profile?.dayAvailability ? parseAvailability(profile.dayAvailability) : {};

    const dayData: DayData = {
      available: typeof available === 'boolean' ? available : true,
      ranges: Array.isArray(ranges) ? ranges : ((stored[date] as DayData)?.ranges || [{ start: "09:00", end: "17:00" }]),
    };

    stored[date] = dayData;

    await prisma.userProfile.upsert({
      where: { userId },
      update: { dayAvailability: JSON.stringify(stored) },
      create: {
        userId,
        joinDate: new Date(),
        dayAvailability: JSON.stringify(stored),
      },
    });

    return NextResponse.json({ date, ...dayData });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
