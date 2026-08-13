import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-utils";

export async function POST(request: Request) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  const session = authRes.session!;
  
  try {
    const { visitId, projectTypeIds } = await request.json();

    if (!visitId || !projectTypeIds || !Array.isArray(projectTypeIds)) {
      return NextResponse.json(
        { error: "visitId and projectTypeIds are required" },
        { status: 400 }
      );
    }

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { parcel: { select: { visitHistory: { include: { setter: { select: { name: true } } } } } } }
    });
    
    if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = session.user.role;
    const userId = parseInt(session.user.id);
    if (role === 'SETTER' || role === 'SETTER_JR') {
      const isOwner = visit.setterId === userId || visit.closerId === userId || visit.parcel?.visitHistory?.some((h: any) => h.setter?.name === session.user.name);
      if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (role === 'PARTNER') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Eliminar proyectos existentes
    await prisma.visitProject.deleteMany({
      where: { visitId },
    });

    // Crear nuevos proyectos
    if (projectTypeIds.length > 0) {
      await prisma.visitProject.createMany({
        data: projectTypeIds.map((projectTypeId: number) => ({
          visitId,
          projectTypeId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error saving visit projects" },
      { status: 500 }
    );
  }
}
