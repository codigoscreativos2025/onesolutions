
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gisSearchAddress, gisQueryPoint, toMapLibreFeature } from "@/lib/gis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const q = query.trim();
    let features: any[] = [];
    
    // First, try fast Geocoding using Nominatim (OpenStreetMap)
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", florida")}&format=json&limit=1`,
        { headers: { "User-Agent": "OneSolutions/1.0", "Accept-Language": "en,es" } }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) {
          const lat = parseFloat(nomData[0].lat);
          const lon = parseFloat(nomData[0].lon);
          // Query the specific point on our GIS providers
          const pointResults = await gisQueryPoint(lat, lon);
          if (pointResults && pointResults.length > 0) {
            features = pointResults;
          }
        }
      }
    } catch (e) {
      console.warn("Nominatim geocoding failed", e);
    }

    // Fallback to slow native ArcGIS string matching if Nominatim fails or finds nothing
    if (features.length === 0) {
      features = await gisSearchAddress(q);
      const existing = features.length > 0
        ? await prisma.parcel.findMany({
            where: { externalId: { in: features.map(f => f.externalId!) } },
            select: { externalId: true, status: true },
          })
        : [];
      
      const statusMap = new Map(existing.map((p) => [p.externalId!, p.status]));
      features = features.map(f => {
        f.status = statusMap.get(f.externalId!) || "AVAILABLE";
        return f;
      });
    }

    const mappedFeatures = features
      .map((f) => {
        const geo = toMapLibreFeature(f);
        if (!geo) return null;
        return {
          ...geo,
          properties: {
            ...geo.properties,
            id: f.externalId,
            ll_uuid: f.externalId,
            address: f.address,
            ownerName: f.ownerName,
            status: f.status || "AVAILABLE",
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      results: {
        type: "FeatureCollection",
        features: mappedFeatures,
      },
    });
  } catch (err) {
    console.error("GIS search error:", err);
    return NextResponse.json(
      { error: "Failed to search county GIS" },
      { status: 500 }
    );
  }
}

