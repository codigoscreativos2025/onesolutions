import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gisSearchAddress, toMapLibreFeature } from "@/lib/gis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const features = await gisSearchAddress(query.trim());
    const externalIds = features.map((f) => f.externalId);

    const existing =
      externalIds.length > 0
        ? await prisma.parcel.findMany({
            where: { externalId: { in: externalIds } },
            select: { externalId: true, status: true },
          })
        : [];

    const statusMap = new Map(
      existing.map((p) => [p.externalId!, p.status])
    );

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
            status: statusMap.get(f.externalId) || "AVAILABLE",
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
