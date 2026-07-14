import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Route: /api/regrid/tiles/[z]/[x]/[y].png
// Proxy Regrid tileserver PNG tiles, hiding the token from the client
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
  // Strip .png extension if present
  const y = params.y.replace(/\.png$/, "");

  try {
    const url = `https://tiles.regrid.com/api/v1/parcels/${z}/${x}/${y}.png?token=${token}`;
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "CDN-Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
