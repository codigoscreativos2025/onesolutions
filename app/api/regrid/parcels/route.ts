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
    const centerLat =
      (parseFloat(lat1) + parseFloat(lat2)) / 2;
    const centerLng =
      (parseFloat(lng1) + parseFloat(lng2)) / 2;
    const dlat = Math.abs(parseFloat(lat2) - parseFloat(lat1)) / 2;
    const dlng = Math.abs(parseFloat(lng2) - parseFloat(lng1)) / 2;
    const radius = Math.sqrt(dlat * dlat + dlng * dlng);
    apiUrl = `https://app.regrid.com/api/v1/parcels?lat=${centerLat}&lng=${centerLng}&radius=${radius}&limit=50&token=${token}`;
  } else if (lat && lng) {
    apiUrl = `https://app.regrid.com/api/v1/parcels?lat=${lat}&lng=${lng}&radius=0.01&limit=50&token=${token}`;
  } else {
    return NextResponse.json(
      { error: "Bounding box (lat1,lng1,lat2,lng2) or center point (lat,lng) required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    const features = data.features || data.results?.features || [];

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
        const llUuid = props.ll_uuid as string;
        const existing = llUuid ? existingMap.get(llUuid) : null;

        const knownKeys = [
          "ll_uuid",
          "address",
          "owner",
          "ownername",
          "pcl_class",
          "acreage",
          "land_value",
          "building_value",
        ];

        const extra: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(props)) {
          if (!knownKeys.includes(k)) {
            extra[k] = v;
          }
        }

        return {
          id: existing?.id || llUuid || "",
          address: (props.address as string) || "Sin dirección",
          ownerName:
            (props.owner as string) ||
            (props.ownername as string) ||
            undefined,
          geometry: JSON.stringify(feature.geometry),
          status: existing?.status || "AVAILABLE",
          metadata: JSON.stringify({
            regrid_id: llUuid,
            owner: props.owner,
            property_class: props.pcl_class,
            acreage: props.acreage,
            land_value: props.land_value,
            building_value: props.building_value,
            ...extra,
          }),
          setter: existing?.setter || null,
          visits: existing?.visits || [],
        };
      }
    );

    return NextResponse.json(parcels);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Regrid" },
      { status: 500 }
    );
  }
}
