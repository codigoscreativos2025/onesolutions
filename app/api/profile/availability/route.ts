import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['SETTER', 'SETTER_JR', 'CLOSER', 'ADMIN'];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const now = new Date();
    const targetDate = month && year
      ? new Date(parseInt(year), parseInt(month) - 1)
      : now;

    const profile = await prisma.userProfile.findUnique({ where: { userId } });

    let availability: Record<string, boolean> = {};
    if (profile?.dayAvailability) {
      try {
        availability = JSON.parse(profile.dayAvailability);
      } catch {
        availability = {};
      }
    }

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const monthAvailability: Record<string, boolean> = {};
    let day = monthStart;
    while (day <= monthEnd) {
      const key = format(day, 'yyyy-MM-dd');
      monthAvailability[key] = availability[key] ?? true;
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }

    return NextResponse.json({
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      availability: monthAvailability,
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
    const { date, available } = body;

    if (!date || typeof available !== 'boolean') {
      return NextResponse.json({ error: 'date and available (boolean) are required' }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    let availability: Record<string, boolean> = {};

    if (profile?.dayAvailability) {
      try {
        availability = JSON.parse(profile.dayAvailability);
      } catch {
        availability = {};
      }
    }

    availability[date] = available;

    await prisma.userProfile.upsert({
      where: { userId },
      update: { dayAvailability: JSON.stringify(availability) },
      create: {
        userId,
        joinDate: new Date(),
        dayAvailability: JSON.stringify(availability),
      },
    });

    return NextResponse.json({ date, available, availability });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
