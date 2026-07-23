import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { notes, billImageUrl, billFileName, action, clientName, clientEmail, clientPhone, projectTypeIds, commissions } = body;

  try {
    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingVisit = await prisma.visit.findUnique({
      where: { id: parseInt(id) },
      include: { slot: true, chatRoom: true },
    });

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    let newStage = "CLOSED";
    if (action === "start-project") {
      newStage = "PROJECT";
    }

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: newStage,
        outcome: newStage === "CLOSED" ? "CLOSED" : undefined,
        notes,
        completedAt: newStage === "CLOSED" ? new Date() : undefined,
      },
      include: {
        setter: { select: { id: true, email: true, name: true } },
        closer: { select: { id: true, name: true } },
        parcel: { select: { address: true } },
        slot: true,
      },
    });

    const existingBill = await prisma.bill.findUnique({
      where: { visitId: visit.id },
    });

    const billData = {
      ...(clientName && { clientName }),
      ...(clientEmail && { clientEmail }),
      ...(clientPhone && { phone: clientPhone }),
      ...(billImageUrl && { imageUrl: billImageUrl, additionalFileUrl: billImageUrl, additionalFileName: billFileName || "Archivo adjunto" }),
    };

    if (Object.keys(billData).length > 0) {
      if (existingBill) {
        await prisma.bill.update({
          where: { visitId: visit.id },
          data: billData,
        });
      } else if (clientName || clientPhone || billImageUrl) {
        await prisma.bill.create({
          data: {
            visitId: visit.id,
            phone: clientPhone || "",
            clientName: clientName || billFileName || "Sin nombre",
            clientEmail: clientEmail || "",
            ...(billImageUrl ? { imageUrl: billImageUrl, additionalFileUrl: billImageUrl, additionalFileName: billFileName || "Archivo adjunto" } : {}),
            notes: notes || "",
          },
        });
      }
    }

    if (projectTypeIds && Array.isArray(projectTypeIds) && projectTypeIds.length > 0) {
      await prisma.visitProject.deleteMany({
        where: { visitId: visit.id },
      });

      await prisma.visitProject.createMany({
        data: projectTypeIds.map((projectTypeId: number) => ({
          visitId: visit.id,
          projectTypeId,
        })),
      });
    }

    if (newStage === "CLOSED") {
      await prisma.parcel.update({
        where: { id: visit.parcelId },
        data: { status: "CUSTOMER" },
      });

      const existingChat = await prisma.chatRoom.findUnique({
        where: { visitId: visit.id },
      });

      if (!existingChat) {
        await prisma.chatRoom.create({
          data: {
            visitId: visit.id,
          },
        });

        await prisma.visit.update({
          where: { id: visit.id },
          data: {
            chatCreatedAt: new Date(),
            chatCreatedBy: userId,
          },
        });
      }

      try {
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true, name: true, id: true } });
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: "Proyecto Cerrado - One Solutions",
            html: emailTemplates.projectClosed(admin.name, visit.parcel.address, "Proyecto Cerrado"),
          });
          await prisma.notification.create({
            data: {
              userId: admin.id,
              title: "Proyecto Cerrado",
              body: `Se ha cerrado un proyecto en ${visit.parcel.address}.`,
              link: `/my-projects`,
            },
          });
        }

        if (visit.setter.email) {
          await sendEmail({
            to: visit.setter.email,
            subject: "Proyecto Cerrado - One Solutions",
            html: emailTemplates.projectProgress(visit.setter.name, visit.parcel.address, "Proyecto Cerrado"),
          });
          await prisma.notification.create({
            data: {
              userId: visit.setter.id,
              title: "Proyecto Cerrado",
              body: `Tu proyecto en ${visit.parcel.address} ha sido cerrado.`,
              link: `/my-projects`,
            },
          });
        }
      } catch (emailError) {
        console.error("Error sending close notification emails:", emailError);
      }
    }

    if (commissions && Array.isArray(commissions) && commissions.length > 0) {
      await prisma.closerCommission.deleteMany({
        where: { visitId: visit.id },
      });

      const validCommissions = commissions.filter(
        (c: { userId: number; percentage: number }) =>
          c.userId && c.percentage !== undefined && c.percentage > 0
      );

      if (validCommissions.length > 0) {
        await prisma.closerCommission.createMany({
          data: validCommissions.map((c: { userId: number; percentage: number }) => ({
            visitId: visit.id,
            userId: c.userId,
            percentage: c.percentage,
            role: "TRAINEE",
          })),
        });
      }

      const traineeTotal = validCommissions.reduce(
        (sum: number, c: { percentage: number }) => sum + c.percentage,
        0
      );
      const closerPct = Math.max(0, 100 - traineeTotal);
      const closerUser = user;
      if (closerUser && closerPct > 0) {
        await prisma.closerCommission.create({
          data: {
            visitId: visit.id,
            userId: closerUser.id,
            percentage: closerPct,
            role: "CLOSER",
          },
        });
      }
    }

    if (existingVisit.slot && newStage !== "PROJECT") {
      await prisma.closerSlot.update({
        where: { id: existingVisit.slot.id },
        data: {
          isBooked: false,
          visitId: null,
        },
      });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error closing visit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
