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
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const token = process.env.REGRID_API_KEY;

  if (!token) {
    return NextResponse.json(
      {
        error: "Regrid API key not configured",
        message:
          "Configura REGRID_API_KEY en las variables de entorno para usar busqueda real.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://app.regrid.com/api/v2/parcels/address?address=${encodeURIComponent(
        query
      )}&limit=10&return_geometry=true&token=${token}`
    );
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
            select: { externalId: true, status: true },
          })
        : [];

    const statusMap = new Map(
      existingParcels.map((p) => [p.externalId!, p.status])
    );

    const mappedFeatures = features.map(
      (feature: {
        properties?: Record<string, unknown>;
        geometry?: { type: string; coordinates: unknown };
      }) => {
        const props = feature.properties || {};
        const fields = (props.fields as Record<string, unknown>) || {};
        const llUuid = (props.ll_uuid as string) || (fields.ll_uuid as string) || "";

        return {
          ...feature,
          properties: {
            id: llUuid,
            ll_uuid: llUuid,
            address: (props.headline as string) || (fields.situs_address as string) || "Sin direccion",
            ownerName: (fields.owner as string) || (fields.ownername as string),
            status: statusMap.get(llUuid) || "AVAILABLE",
          },
        };
      }
    );

    return NextResponse.json({
      results: {
        type: "FeatureCollection",
        features: mappedFeatures,
      },
    });
  } catch (err) {
    console.error("Regrid search error:", err);
    return NextResponse.json(
      { error: "Failed to fetch from Regrid" },
      { status: 500 }
    );
  }
}
