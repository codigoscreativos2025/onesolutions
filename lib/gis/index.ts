import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GIS_PROVIDER,
  parseExternalId,
  resolveProviderForBbox,
  resolveProviderForPoint,
} from "./catalog";
import * as orange from "./providers/orange-fl";
import { toAppParcelPayload, toMapLibreFeature } from "./normalize";
import type { AppParcelPayload, NormalizedGisFeature, GisProviderId } from "./types";

export {
  ORLANDO_CENTER,
  DEFAULT_GIS_PROVIDER,
  getParcelProvider,
  getProviderConfig,
  makeExternalId,
  parseExternalId,
} from "./catalog";
export { toAppParcelPayload, toMapLibreFeature, isGisExternalId } from "./normalize";
export type { AppParcelPayload, NormalizedGisFeature, GisProviderId } from "./types";

async function enrichWithDb(
  features: NormalizedGisFeature[]
): Promise<AppParcelPayload[]> {
  const externalIds = features.map((f) => f.externalId);
  const existing =
    externalIds.length > 0
      ? await prisma.parcel.findMany({
          where: { externalId: { in: externalIds } },
          include: {
            setter: { select: { id: true, name: true } },
            visits: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                stage: true,
                outcome: true,
                createdAt: true,
                setter: { select: { id: true, name: true } },
                projects: {
                  select: {
                    projectType: { select: { name: true } },
                  },
                },
              },
            },
          },
        })
      : [];

  const map = new Map(existing.map((p) => [p.externalId!, p]));

  return features.map((f) => {
    const ex = map.get(f.externalId);
    return toAppParcelPayload(f, ex || null);
  });
}

export async function gisQueryBbox(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<AppParcelPayload[]> {
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);

  const provider = resolveProviderForBbox(minLng, minLat, maxLng, maxLat);
  if (!provider) {
    return [];
  }

  let features: NormalizedGisFeature[] = [];
  if (provider.id === "orange-fl") {
    features = await orange.queryByBbox(minLng, minLat, maxLng, maxLat);
  }

  return enrichWithDb(features);
}

export async function gisQueryPoint(
  lat: number,
  lng: number
): Promise<AppParcelPayload[]> {
  const provider = resolveProviderForPoint(lat, lng);
  if (!provider) return [];

  let features: NormalizedGisFeature[] = [];
  if (provider.id === "orange-fl") {
    features = await orange.queryByPoint(lat, lng);
  }
  return enrichWithDb(features);
}

export async function gisSearchAddress(
  query: string
): Promise<NormalizedGisFeature[]> {
  // Prefer Orange (Orlando) for now; extend with multi-provider later
  return orange.searchAddress(query);
}

export async function gisGetByExternalId(
  externalId: string
): Promise<AppParcelPayload | null> {
  const parsed = parseExternalId(externalId);
  if (!parsed) {
    // Try raw parcel id against default provider
    const feature = await orange.queryByParcelId(externalId);
    if (!feature) return null;
    const [payload] = await enrichWithDb([feature]);
    return payload || null;
  }

  let feature: NormalizedGisFeature | null = null;
  if (parsed.providerId === "orange-fl") {
    feature = await orange.queryByParcelId(parsed.parcelId);
  }
  if (!feature) return null;
  const [payload] = await enrichWithDb([feature]);
  return payload || null;
}

export async function gisGeoJsonForBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): Promise<GeoJSON.FeatureCollection> {
  const provider = resolveProviderForBbox(minLng, minLat, maxLng, maxLat);
  if (!provider || provider.id !== "orange-fl") {
    return { type: "FeatureCollection", features: [] };
  }

  const features = await orange.queryByBbox(minLng, minLat, maxLng, maxLat);
  const geoFeatures = features
    .map(toMapLibreFeature)
    .filter((f): f is GeoJSON.Feature => f !== null);

  return { type: "FeatureCollection", features: geoFeatures };
}

export function getDefaultProviderId(): GisProviderId {
  return DEFAULT_GIS_PROVIDER;
}
