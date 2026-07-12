import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectTypeId = searchParams.get("projectTypeId");

  try {
    const where = projectTypeId ? { projectTypeId: parseInt(projectTypeId) } : {};
    
    const fields = await prisma.projectTypeField.findMany({
      where,
      orderBy: [{ projectTypeId: "asc" }, { order: "asc" }],
      include: {
        projectType: {
          select: { id: true, name: true },
        },
      },
    });
    
    return NextResponse.json(fields);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching fields" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectTypeId, fieldName, fieldLabel, fieldType, options, isRequired, order } = body;

    if (!projectTypeId || !fieldName || !fieldLabel || !fieldType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const field = await prisma.projectTypeField.create({
      data: {
        projectTypeId: parseInt(projectTypeId),
        fieldName,
        fieldLabel,
        fieldType,
        options: options ? JSON.stringify(options) : null,
        isRequired: isRequired || false,
        order: order || 0,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating field" }, { status: 500 });
  }
}
