import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await prisma.template.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const targetRoles: string[] = JSON.parse(template.roles || "[]");

  // Find all active users with matching roles
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: targetRoles },
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "No users found for selected roles" }, { status: 400 });
  }

  const senderName = session.user.name || "Administrador";

  // Create notifications for all target users - reusing existing Notification model
  const notifications = users.map((user) => ({
    userId: user.id,
    title: `[TEMPLATE] ${template.title}`,
    body: `${template.content}\n\n— Enviado por ${senderName} (Admin)`,
    link: "/chat",
    isRead: false,
  }));

  await prisma.notification.createMany({ data: notifications });

  return NextResponse.json({ 
    success: true, 
    sentTo: users.length 
  });
}
