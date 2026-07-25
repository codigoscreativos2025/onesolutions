import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const visitId = parseInt(id);

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  const body = await request.json();
  const { contractSignatures, contractType, commissions } = body;

  if (commissions && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can update commissions" },
      { status: 403 }
    );
  }

  if (commissions && Array.isArray(commissions)) {
    await prisma.closerCommission.deleteMany({
      where: { visitId },
    });

    const validCommissions = commissions.filter(
      (c: { userId: number; percentage: number }) =>
        c.userId && c.percentage !== undefined
    );

    if (validCommissions.length > 0) {
      const roleType = (c: { role?: string }) => c.role || "TRAINEE";
      await prisma.closerCommission.createMany({
        data: validCommissions.map((c: { userId: number; percentage: number; role?: string }) => ({
          visitId,
          userId: c.userId,
          percentage: c.percentage,
          role: roleType(c),
        })),
      });
    }

    return NextResponse.json({ success: true });
  }

  if (contractSignatures && contractType) {
    let existing: Record<string, Record<string, string>> = {};
    if (visit.contractSignatures) {
      try {
        existing = JSON.parse(visit.contractSignatures);
      } catch {}
    }
    existing[contractType] = contractSignatures;

    await prisma.visit.update({
      where: { id: visitId },
      data: { contractSignatures: JSON.stringify(existing) },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No data provided" }, { status: 400 });
}