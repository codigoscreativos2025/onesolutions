import { auth } from "@/auth";
import { gisGetByExternalId } from "@/lib/gis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const decoded = decodeURIComponent(id);
    const parcel = await gisGetByExternalId(decoded);
    if (!parcel) {
      return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
    }
    return NextResponse.json(parcel);
  } catch (err) {
    console.error("GIS parcel detail error:", err);
    return NextResponse.json(
      { error: "Failed to fetch parcel from GIS" },
      { status: 502 }
    );
  }
}
