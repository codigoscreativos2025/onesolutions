import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Solo setters y closers pueden crear leads
  if (role !== "SETTER" && role !== "SETTER_JR" && role !== "CLOSER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { address, ownerName, phone, notes, clientEmail, projectTypeIds, setterId, closerId, scheduledDate } = body;

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const assignedSetterId = role === "ADMIN" && setterId ? setterId : userId;
    const assignedCloserId = closerId ? parseInt(closerId) : (role === "CLOSER" ? userId : null);

    // Generar un ID unico para la parcela
    const parcelId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear la parcela
    const parcel = await prisma.parcel.create({
      data: {
        id: parcelId,
        address,
        ownerName,
        status: "LEAD",
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
          type: "Point",
          coordinates: [0, 0],
        }),
      },
    });

    // Crear la visita inicial
    const visit = await prisma.visit.create({
      data: {
        parcelId: parcel.id,
        setterId: assignedSetterId,
        closerId: assignedCloserId,
        stage: "PROPOSAL_ACCEPTED",
        outcome: "MANUAL_LEAD",
        legacyNotes: notes || null,
        scheduledAt: scheduledDate ? new Date(scheduledDate) : null,
      },
    });

    // Crear los projectDetails
    await prisma.projectDetails.create({
      data: {
        visitId: visit.id,
        clientName: ownerName || null,
        clientEmail: clientEmail || null,
        address: address || null,
      },
    });

    if (phone || ownerName || clientEmail) {
      await prisma.bill.upsert({
        where: { visitId: visit.id },
        update: {
          phone: phone || "",
          clientName: ownerName || null,
          clientEmail: clientEmail || null,
        },
        create: {
          visitId: visit.id,
          phone: phone || "",
          clientName: ownerName || null,
          clientEmail: clientEmail || null,
        },
      });
    }

    // Crear los proyectos seleccionados
    if (projectTypeIds && projectTypeIds.length > 0) {
      await prisma.visitProject.createMany({
        data: projectTypeIds.map((projectTypeId: number) => ({
          visitId: visit.id,
          projectTypeId,
        })),
      });
    }

    let roleName = "Usuario";
    if (role === "SETTER") roleName = "Trainee";
    else if (role === "SETTER_JR") roleName = "Setter";
    else if ((role as string) === "TRAINEE") roleName = "Trainee";
    else if (role === "CLOSER") roleName = "Closer";
    else if (role === "ADMIN") roleName = "Admin";
    const addressName = address || "un lead manual";

    // Notificar al closer si fue asignado y no es quien esta creando el lead
    if (assignedCloserId && assignedCloserId !== userId) {
      await prisma.notification.create({
        data: {
          userId: assignedCloserId,
          title: "Nuevo Lead Asignado",
          body: `El ${roleName} ${session.user.name} te ha agendado una cita en ${addressName}.`,
          link: `/lead/${visit.id}`,
        },
      });
    }

    // Notificar a todos los administradores (solicitado por el usuario)
    if (role !== "ADMIN") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" }
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin: any) => ({
            userId: admin.id,
            title: "Nuevo Lead Manual",
            body: `El ${roleName} ${session.user.name} ha creado un nuevo lead manual en ${addressName}.`,
            link: `/lead/${visit.id}`,
          }))
        });
      }
    }

    // Registrar en el historial
    await prisma.parcelVisitHistory.create({
      data: {
        parcelId: parcel.id,
        setterId: assignedSetterId,
        visitedAt: new Date(),
        status: "MANUAL_LEAD",
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      parcel,
      visit,
    });
  } catch (error) {
    console.error("Error creating manual lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}