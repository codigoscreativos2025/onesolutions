import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
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
      // Crear perfil si no existe
      const newProfile = await prisma.userProfile.create({
        data: {
          userId,
          joinDate: new Date(),
        },
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

      return NextResponse.json(newProfile);
    }

    // Si es el propio usuario o admin, devolver datos completos
    if (profile.userId === userId || role === 'ADMIN') {
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const {
      profilePhoto,
      address,
      ssn,
      dateOfBirth,
      bankName,
      routingNumber,
      zelle,
    } = body;

    // Verificar si el perfil existe
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Preparar datos para actualizar/crear
    const profileData: {
      profilePhoto?: string;
      address?: string;
      dateOfBirth?: Date | null;
      bankName?: string;
      zelle?: string;
      ssn?: string;
      routingNumber?: string;
    } = {
      profilePhoto,
      address,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      bankName,
      zelle,
    };

    // Encriptar datos sensibles
    if (ssn) {
      profileData.ssn = encrypt(ssn);
    }
    if (routingNumber) {
      profileData.routingNumber = encrypt(routingNumber);
    }

    if (profile) {
      // Actualizar perfil existente
      profile = await prisma.userProfile.update({
        where: { userId },
        data: profileData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });
    } else {
      // Crear nuevo perfil
      profile = await prisma.userProfile.create({
        data: {
          userId,
          joinDate: new Date(),
          ...profileData,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });
    }

    // Desencriptar datos sensibles para la respuesta
    const decryptedProfile = {
      ...profile,
      ssn: profile.ssn ? decrypt(profile.ssn) : null,
      routingNumber: profile.routingNumber ? decrypt(profile.routingNumber) : null,
    };

    return NextResponse.json(decryptedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
