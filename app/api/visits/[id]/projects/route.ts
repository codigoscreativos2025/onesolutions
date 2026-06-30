import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { visitId, projectTypeIds } = await request.json();

    if (!visitId || !projectTypeIds || !Array.isArray(projectTypeIds)) {
      return NextResponse.json(
        { error: "visitId and projectTypeIds are required" },
        { status: 400 }
      );
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
