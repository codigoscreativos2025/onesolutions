import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['SETTER', 'SETTER_JR', 'CLOSER'];

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
    const { workSchedule } = body;

    if (!workSchedule) {
      return NextResponse.json({ error: 'workSchedule is required' }, { status: 400 });
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { workSchedule: JSON.stringify(workSchedule) },
      create: {
        userId,
        joinDate: new Date(),
        workSchedule: JSON.stringify(workSchedule),
      },
    });

    return NextResponse.json({ workSchedule: profile.workSchedule });
  } catch (error) {
    console.error('Error updating work schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
