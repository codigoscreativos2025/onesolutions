import { auth } from "@/auth";
import { gisGeoJsonForBbox } from "@/lib/gis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

  /** Max bbox diagonal (m) for GeoJSON viewport load */
  const MAX_DIAGONAL_M = 8500;

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const west = searchParams.get("west") ?? searchParams.get("lng1");
  const south = searchParams.get("south") ?? searchParams.get("lat1");
  const east = searchParams.get("east") ?? searchParams.get("lng2");
  const north = searchParams.get("north") ?? searchParams.get("lat2");

  if (!west || !south || !east || !north) {
    return NextResponse.json(
      { error: "west,south,east,north (or lat1,lng1,lat2,lng2) required" },
      { status: 400 }
    );
  }

  const minLng = parseFloat(west);
  const minLat = parseFloat(south);
  const maxLng = parseFloat(east);
  const maxLat = parseFloat(north);

  if ([minLng, minLat, maxLng, maxLat].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
  }

  const centerLat = (minLat + maxLat) / 2;
  const dlat = (Math.abs(maxLat - minLat) * 111320) / 2;
  const dlng =
    (Math.abs(maxLng - minLng) * 111320 * Math.cos((centerLat * Math.PI) / 180)) /
    2;
  const radius = Math.sqrt(dlat * dlat + dlng * dlng);

  if (radius > MAX_DIAGONAL_M) {
    return NextResponse.json(
      {
        type: "FeatureCollection",
        features: [],
        tooLarge: true,
        message: "Acerca el mapa para ver parcelas",
      },
      { status: 200 }
    );
  }

  try {
    const bboxWidth = maxLng - minLng;
    const maxAllowableOffset =
      bboxWidth > 0.03 ? 0.0005 :
      bboxWidth > 0.01 ? 0.0001 :
      0;
    const fc = await gisGeoJsonForBbox(minLng, minLat, maxLng, maxLat, {
      maxAllowableOffset,
    });
    return NextResponse.json(fc, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("GIS geojson error:", err);
    return NextResponse.json(
      { error: "Failed to load parcels GeoJSON", type: "FeatureCollection", features: [] },
      { status: 502 }
    );
  }
}
