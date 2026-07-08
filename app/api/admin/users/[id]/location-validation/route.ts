import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { locationValidationEnabled } = await request.json();

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { locationValidationEnabled },
      select: {
        id: true,
        name: true,
        locationValidationEnabled: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user location validation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
