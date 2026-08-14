import { auth } from "@/auth";
import { gisQueryBbox, gisQueryPoint } from "@/lib/gis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Max bbox diagonal in meters before asking user to zoom in */
const MAX_DIAGONAL_M = 4500;

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat1 = searchParams.get("lat1");
  const lng1 = searchParams.get("lng1");
  const lat2 = searchParams.get("lat2");
  const lng2 = searchParams.get("lng2");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    if (lat1 && lng1 && lat2 && lng2) {
      const a = parseFloat(lat1);
      const b = parseFloat(lng1);
      const c = parseFloat(lat2);
      const d = parseFloat(lng2);
      if ([a, b, c, d].some((n) => Number.isNaN(n))) {
        return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
      }

      const centerLat = (a + c) / 2;
      const dlat = (Math.abs(c - a) * 111320) / 2;
      const dlng =
        (Math.abs(d - b) * 111320 * Math.cos((centerLat * Math.PI) / 180)) / 2;
      const radius = Math.sqrt(dlat * dlat + dlng * dlng);
      if (radius > MAX_DIAGONAL_M) {
        return NextResponse.json(
          { error: "Acerca el mapa para ver parcelas", tooLarge: true },
          { status: 200 }
        );
      }

      const parcels = await gisQueryBbox(a, b, c, d);
      return NextResponse.json(parcels);
    }

    if (lat && lng) {
      const la = parseFloat(lat);
      const ln = parseFloat(lng);
      if (Number.isNaN(la) || Number.isNaN(ln)) {
        return NextResponse.json({ error: "Invalid point" }, { status: 400 });
      }
      const parcels = await gisQueryPoint(la, ln);
      return NextResponse.json(parcels);
    }

    return NextResponse.json(
      {
        error:
          "Bounding box (lat1,lng1,lat2,lng2) or center point (lat,lng) required",
      },
      { status: 400 }
    );
  } catch (err) {
    console.error("GIS parcels error:", err);
    return NextResponse.json(
      { error: "Failed to fetch from county GIS" },
      { status: 502 }
    );
  }
}
