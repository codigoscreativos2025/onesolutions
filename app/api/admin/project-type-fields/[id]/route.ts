import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { fieldName, fieldLabel, fieldType, options, isRequired, order } = body;

    const field = await prisma.projectTypeField.update({
      where: { id: parseInt(id) },
      data: {
        fieldName,
        fieldLabel,
        fieldType,
        options: options ? JSON.stringify(options) : null,
        isRequired,
        order,
      },
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating field" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.projectTypeField.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error deleting field" }, { status: 500 });
  }
}
