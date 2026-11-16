import { auth } from "@/auth";
import { isParcelsApiDisabled } from "@/lib/parcels-toggle";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    disabled: isParcelsApiDisabled(),
    status: isParcelsApiDisabled() ? "PARCELS_DISABLED" : "PARCELS_ENABLED",
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const shouldDisable = body.disabled !== undefined ? Boolean(body.disabled) : true;

    const flagFiles = [
      "/tmp/parcels_disabled",
      path.join(process.cwd(), "parcels_disabled"),
      "/app/parcels_disabled",
      "/app/data/parcels_disabled",
      "/app/uploads/parcels_disabled",
    ];

    if (shouldDisable) {
      for (const file of flagFiles) {
        try {
          fs.writeFileSync(file, "disabled");
          break; // successfully created at least one
        } catch {
          // try next path
        }
      }
    } else {
      for (const file of flagFiles) {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      success: true,
      disabled: isParcelsApiDisabled(),
      message: isParcelsApiDisabled()
        ? "API de parcelas desactivada (el mapa se mantiene visible sin capas de parcelas)."
        : "API de parcelas reactivada exitosamente.",
    });
  } catch (error) {
    console.error("Error toggling parcels:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
