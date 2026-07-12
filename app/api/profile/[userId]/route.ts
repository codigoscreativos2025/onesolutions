import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { decrypt } from '@/lib/encryption';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role;
  const currentUserId = parseInt(session.user.id);
  const targetUserId = parseInt(params.userId);

  // Solo admin puede ver perfiles de otros usuarios
  if (role !== 'ADMIN' && currentUserId !== targetUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            userBadges: {
              include: {
                badge: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Si es el propio usuario o admin, devolver datos completos
    if (profile.userId === currentUserId || role === 'ADMIN') {
      // Desencriptar datos sensibles
      const decryptedProfile = {
        ...profile,
        ssn: profile.ssn ? decrypt(profile.ssn) : null,
        routingNumber: profile.routingNumber ? decrypt(profile.routingNumber) : null,
      };

      return NextResponse.json(decryptedProfile);
    }

    // Para otros usuarios, devolver solo datos públicos
    return NextResponse.json({
      id: profile.id,
      userId: profile.userId,
      profilePhoto: profile.profilePhoto,
      joinDate: profile.joinDate,
      user: {
        name: profile.user.name,
        role: profile.user.role,
        userBadges: profile.user.userBadges,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
