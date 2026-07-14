import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, nameEn, color, isActive, order } = body;

  try {
    const tag = await prisma.notAvailableTag.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });
    return NextResponse.json(tag);
  } catch {
    return NextResponse.json(
      { error: "Tag not found" },
      { status: 404 }
    );
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

  const { id } = await params;

  try {
    await prisma.notAvailableTag.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Tag not found" },
      { status: 404 }
    );
  }
}
