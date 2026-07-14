import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxy Regrid tileserver vector tiles (MVT), hiding the token from the client
export async function GET(
  request: Request,
  { params }: { params: { z: string; x: string; y: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.REGRID_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "Token not configured" }, { status: 503 });
  }

  const z = params.z;
  const x = params.x;
  const y = params.y;

  try {
    const url = `https://tiles.regrid.com/api/v1/parcels/${z}/${x}/${y}.mvt?token=${token}`;
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.mapbox-vector-tile",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
