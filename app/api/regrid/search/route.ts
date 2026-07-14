import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
          "Configura REGRID_API_KEY en las variables de entorno para usar búsqueda real.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://app.regrid.com/api/v1/search?query=${encodeURIComponent(
        query
      )}&limit=10&token=${token}`
    );
    const data = await res.json();

    const features = data.results?.features || [];

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
        const llUuid = props.ll_uuid as string;

        const knownKeys = [
          "id",
          "ll_uuid",
          "address",
          "owner",
          "ownername",
        ];

        const extra: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(props)) {
          if (!knownKeys.includes(k)) {
            extra[k] = v;
          }
        }

        return {
          ...feature,
          properties: {
            id: llUuid || (props.id as string) || "",
            ll_uuid: llUuid,
            address: (props.address as string) || "Sin dirección",
            ownerName:
              (props.owner as string) ||
              (props.ownername as string),
            status: statusMap.get(llUuid) || "AVAILABLE",
            ...extra,
          },
        };
      }
    );

    return NextResponse.json({
      ...data,
      results: {
        ...data.results,
        features: mappedFeatures,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Regrid" },
      { status: 500 }
    );
  }
}
