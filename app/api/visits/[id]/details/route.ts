import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/auth-utils';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  const session = authRes.session!;

  try {
    const visitId = parseInt(params.id);

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
            ownerName: true,
            partnerId: true,
            metadata: true,
            visitHistory: {
              include: {
                setter: { select: { name: true } },
              },
              orderBy: { visitedAt: 'asc' },
            },
          },
        },
        setter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bill: {
          select: {
            id: true,
            imageUrl: true,
            phone: true,
            clientName: true,
            clientEmail: true,
            notes: true,
            additionalFileUrl: true,
            additionalFileName: true,
          },
        },
        projectDetails: true,
        projects: {
          include: {
            projectType: {
              select: {
                id: true,
                name: true,
              },
            },
            partner: {
              select: { id: true, name: true },
            },
          },
        },
        objections: {
          include: {
            objection: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        closerObjections: {
          include: {
            closerObjection: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        commissions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        chatRooms: {
          select: { id: true, type: true },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const role = session.user.role;
    const userId = parseInt(session.user.id);
    if (role === 'SETTER' || role === 'SETTER_JR' || role === 'TRAINEE') {
      const isOwner = visit.setter?.id === userId || visit.closer?.id === userId || visit.parcel?.visitHistory?.some(h => h.setter?.name === session.user.name);
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden: You can only view your own projects' }, { status: 403 });
      }
      
      if (role === 'TRAINEE' && visit.stage === 'CLOSED') {
        const hasSolar = visit.projects?.some((p: any) => p.projectType?.name?.toLowerCase().includes("solar"));
        if (hasSolar) {
          return NextResponse.json({ error: 'Forbidden: Los proyectos solares cerrados pertenecen al Closer.' }, { status: 403 });
        }
      }
    }

    if (session.user.role === 'PARTNER') {
      const isAssignedProject = visit.projects.some(
        (vp) => vp.partnerId === parseInt(session.user.id)
      );
      if (!isAssignedProject && visit.parcel?.partnerId !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Forbidden: Partners can only view assigned projects' }, { status: 403 });
      }

      // Filtrar para que el partner solo reciba los proyectos que se le asignaron
      // Si está asignado a la parcela entera (legado), ve todos los proyectos
      if (visit.parcel?.partnerId !== parseInt(session.user.id)) {
        visit.projects = visit.projects.filter(
          (vp) => vp.partnerId === parseInt(session.user.id)
        );
      }
    }

    return NextResponse.json({
      ...visit,
      chatRoom: visit.chatRooms?.find(r => (session.user.role === "PARTNER" && r.type === "PARTNER") || (session.user.role !== "PARTNER" && r.type === "GENERAL")) || null,
      chatRooms: undefined,
    });
  } catch (error) {
    console.error('Error fetching visit details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
