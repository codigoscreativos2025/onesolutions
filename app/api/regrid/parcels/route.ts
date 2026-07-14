import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  const token = process.env.REGRID_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: "Regrid API key not configured" },
      { status: 503 }
    );
  }

  let apiUrl: string;

  if (lat1 && lng1 && lat2 && lng2) {
    // Calculate center point and radius in meters for bounding box
    const centerLat = (parseFloat(lat1) + parseFloat(lat2)) / 2;
    const centerLng = (parseFloat(lng1) + parseFloat(lng2)) / 2;
    // Approximate: 1 degree lat ≈ 111,320 m, 1 degree lng ≈ 111,320 * cos(lat) m
    const dlat = Math.abs(parseFloat(lat2) - parseFloat(lat1)) * 111320 / 2;
    const dlng = Math.abs(parseFloat(lng2) - parseFloat(lng1)) * 111320 * Math.cos(centerLat * Math.PI / 180) / 2;
    const radius = Math.min(Math.round(Math.sqrt(dlat * dlat + dlng * dlng)), 32000);
    apiUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${centerLat}&lon=${centerLng}&radius=${radius}&limit=50&return_geometry=true&token=${token}`;
  } else if (lat && lng) {
    apiUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lng}&radius=200&limit=50&return_geometry=true&token=${token}`;
  } else {
    return NextResponse.json(
      { error: "Bounding box (lat1,lng1,lat2,lng2) or center point (lat,lng) required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Regrid API error:", res.status, errText);
      return NextResponse.json(
        { error: `Regrid API error: ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    // v2 response: { parcels: { type: "FeatureCollection", features: [...] } }
    const features = data.parcels?.features || data.features || [];

    const regridIds = features
      .map((f: { properties?: { ll_uuid?: string } }) => f.properties?.ll_uuid)
      .filter(Boolean) as string[];

    const existingParcels =
      regridIds.length > 0
        ? await prisma.parcel.findMany({
            where: { externalId: { in: regridIds } },
            include: {
              setter: { select: { id: true, name: true } },
              visits: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  stage: true,
                  outcome: true,
                  setter: { select: { id: true, name: true } },
                },
              },
            },
          })
        : [];

    const existingMap = new Map(existingParcels.map((p) => [p.externalId!, p]));

    const parcels = features.map(
      (feature: {
        properties?: Record<string, unknown>;
        geometry?: { type: string; coordinates: unknown };
      }) => {
        const props = feature.properties || {};
        // v2: actual parcel data is under props.fields
        const fields = (props.fields as Record<string, unknown>) || {};
        const llUuid = (props.ll_uuid as string) || (fields.ll_uuid as string) || "";
        const existing = llUuid ? existingMap.get(llUuid) : null;

        // Get address from headline (preferred) or fields
        const address = (props.headline as string) || (fields.situs_address as string) || "Sin direccion";
        const ownerName = (fields.owner as string) || (fields.ownername as string) || undefined;

        return {
          id: existing?.id || llUuid || "",
          address,
          ownerName,
          geometry: JSON.stringify(feature.geometry),
          status: existing?.status || "AVAILABLE",
          metadata: JSON.stringify({
            regrid_id: llUuid,
            headline: props.headline,
            path: props.path,
            owner: ownerName,
            property_class: fields.pcl_class,
            acreage: fields.acreage,
            land_value: fields.land_value,
            building_value: fields.building_value,
            ...fields,
          }),
          setter: existing?.setter || null,
          visits: existing?.visits || [],
        };
      }
    );

    return NextResponse.json(parcels);
  } catch (err) {
    console.error("Regrid parcels error:", err);
    return NextResponse.json(
      { error: "Failed to fetch from Regrid" },
      { status: 500 }
    );
  }
}
