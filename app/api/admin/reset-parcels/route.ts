import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { deleteVisits } = await request.json();

    // Resetear todas las parcelas
    const result = await prisma.parcel.updateMany({
      data: {
        setterId: null,
        status: "AVAILABLE",
      },
    });

    let visitsDeleted = 0;
    if (deleteVisits) {
      const deleted = await prisma.visit.deleteMany({});
      visitsDeleted = deleted.count;
    }

    return NextResponse.json({
      success: true,
      parcelsReset: result.count,
      visitsDeleted,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error resetting parcels" },
      { status: 500 }
    );
  }
}
