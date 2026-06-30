import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    const notification = await prisma.notification.update({
      where: {
        id: parseInt(id),
        userId: parseInt(session.user.id),
      },
      data: { isRead: isRead !== false },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating notification" }, { status: 500 });
  }
}
