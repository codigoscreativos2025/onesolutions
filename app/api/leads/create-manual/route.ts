import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Solo setters y closers pueden crear leads
  if (role !== 'SETTER' && role !== 'CLOSER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { address, ownerName, phone, notes, projectTypeIds, setterId } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const assignedSetterId = role === 'ADMIN' && setterId ? setterId : userId;

    // Generar un ID único para la parcela
    const parcelId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear la parcela
    const parcel = await prisma.parcel.create({
      data: {
        id: parcelId,
        address,
        ownerName,
        status: 'LEAD',
        setterId: assignedSetterId,
        claimedAt: new Date(),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({
          phone,
          notes,
          createdAt: new Date().toISOString(),
          createdBy: userId,
          isManual: true,
        }),
        geometry: JSON.stringify({
          type: 'Point',
          coordinates: [0, 0], // Coordenadas placeholder para leads manuales
        }),
      },
    });

    // Crear la visita inicial
    const visit = await prisma.visit.create({
      data: {
        parcelId: parcel.id,
        setterId: assignedSetterId,
        stage: 'IN_PROGRESS',
        outcome: 'MANUAL_LEAD',
        notes: notes || null,
      },
    });

    // Crear los proyectos seleccionados
    if (projectTypeIds && projectTypeIds.length > 0) {
      await prisma.visitProject.createMany({
        data: projectTypeIds.map((projectTypeId: number) => ({
          visitId: visit.id,
          projectTypeId,
        })),
      });
    }

    // Registrar en el historial
    await prisma.parcelVisitHistory.create({
      data: {
        parcelId: parcel.id,
        setterId: assignedSetterId,
        visitedAt: new Date(),
        status: 'MANUAL_LEAD',
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      parcel,
      visit,
    });
  } catch (error) {
    console.error('Error creating manual lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
