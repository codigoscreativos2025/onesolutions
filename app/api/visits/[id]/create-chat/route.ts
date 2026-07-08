import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Solo closers y admins pueden crear chats
  if (role !== 'CLOSER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Verificar que la visita existe y está cerrada
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) },
      include: {
        parcel: { select: { address: true } },
        setter: { select: { id: true, name: true } },
        closer: { select: { id: true, name: true } },
        projectDetails: true,
        projects: { include: { projectType: true } },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    if (visit.stage !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Can only create chat for closed visits' },
        { status: 400 }
      );
    }

    // Verificar que el closer tiene permisos sobre esta visita
    if (role === 'CLOSER' && visit.closerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar que el chat no existe ya
    const existingRoom = await prisma.chatRoom.findUnique({
      where: { visitId: visit.id },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Chat already exists for this visit' },
        { status: 400 }
      );
    }

    // Verificar que todos los campos obligatorios estén completos
    if (!visit.projectDetails) {
      return NextResponse.json(
        { error: 'Project details must be completed before creating chat' },
        { status: 400 }
      );
    }

    // Crear el chat
    const chatRoom = await prisma.chatRoom.create({
      data: {
        visitId: visit.id,
        messages: {
          create: {
            userId: userId,
            body: `Chat creado para el proyecto en ${visit.parcel.address}. Todos los campos del proyecto están completos.`,
          },
        },
      },
    });

    // Actualizar la visita con la fecha de creación del chat
    await prisma.visit.update({
      where: { id: visit.id },
      data: {
        chatCreatedAt: new Date(),
        chatCreatedBy: userId,
      },
    });

    // Notificar al setter
    const notifications = [];
    if (visit.setter) {
      notifications.push({
        userId: visit.setter.id,
        title: 'Chat Creado',
        body: `Se ha creado el chat para el proyecto en ${visit.parcel.address}`,
        link: '/chat',
      });
    }

    // Notificar a los admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    admins.forEach((admin) => {
      notifications.push({
        userId: admin.id,
        title: 'Chat Creado',
        body: `Se ha creado el chat para el proyecto en ${visit.parcel.address}`,
        link: '/admin/chats',
      });
    });

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
