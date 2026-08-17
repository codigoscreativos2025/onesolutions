import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GIS_PROVIDER,
  GIS_PROVIDERS,
  parseExternalId,
  resolveProvidersForBbox,
  resolveProvidersForPoint,
} from "./catalog";
import { createCountyProvider } from "./providers/county-generic";
import { toAppParcelPayload, toMapLibreFeature } from "./normalize";
import type {
  AppParcelPayload,
  GisCountyConfig,
  GisProviderId,
  NormalizedGisFeature,
} from "./types";

export {
  ORLANDO_CENTER,
  DEFAULT_GIS_PROVIDER,
  getParcelProvider,
  getProviderConfig,
  makeExternalId,
  parseExternalId,
  resolveProvidersForBbox,
  resolveProvidersForPoint,
} from "./catalog";
export {
  toAppParcelPayload,
  toMapLibreFeature,
  isGisExternalId,
} from "./normalize";
export type {
  AppParcelPayload,
  GisProviderId,
  NormalizedGisFeature,
} from "./types";

// Lazy-init provider map so all providers share the same generic factory.
const providers = new Map<string, ReturnType<typeof createCountyProvider>>();

function getProvider(id: GisProviderId) {
  let p = providers.get(id);
  if (p) return p;

  const cfg = GIS_PROVIDERS[id];
  if (!cfg) throw new Error(`Unknown GIS provider: ${id}`);

  // Out fields: include only the fieldMap names (each service uses its own
  // OBJECTID field — including "OBJECTID" in outFields fails for services
  // that use a different name like "FID" or "OID_")
  const outFields = [
    cfg.fieldMap.parcelId,
    cfg.fieldMap.owner,
    cfg.fieldMap.owner2,
    cfg.fieldMap.address,
    cfg.fieldMap.mailAddress,
    cfg.fieldMap.city,
    cfg.fieldMap.zip,
    cfg.fieldMap.landValue,
    cfg.fieldMap.buildingValue,
    cfg.fieldMap.acreage,
    cfg.fieldMap.propertyClass,
    ...(cfg.extraOutFields ?? []),
  ].filter((f): f is string => Boolean(f));

  // FL Statewide FGDL service requires JSON envelope + 100-record pagination
  const usePagination = id === "fl-statewide";
  const jsonEnvelope = id === "fl-statewide";
  const recordCount = id === "orange-fl" ? 200 : 800;
  // FDOR and Martin only support WHERE-clause queries (not spatial bbox/point)
  const supportsSpatial = id !== "fl-fdor" && id !== "martin-fl";

  p = createCountyProvider(id, {
    outFields,
    usePagination,
    jsonEnvelope,
    recordCount,
    supportsSpatial,
  });
  providers.set(id, p);
  return p;
}

async function enrichWithDb(
  features: NormalizedGisFeature[]
): Promise<AppParcelPayload[]> {
  if (features.length === 0) return [];
  const externalIds = features.map((f) => f.externalId);
  const existing = await prisma.parcel.findMany({
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
  });

  const map = new Map(existing.map((p) => [p.externalId!, p]));

  return features.map((f) => {
    const ex = map.get(f.externalId);
    return toAppParcelPayload(f, ex || null);
  });
}

/**
 * Run county providers first in parallel, then statewide only if needed.
 * This is the core optimization: statewide (FGDL) is slow (60s+ with
 * pagination) so we skip it whenever a county provider has data.
 *
 * `minCountyResults`: minimum county results to consider county a "hit"
 *   and skip statewide. Default 1.
 * `includeStatewide`: whether to ever query statewide. Defaults true.
 */
async function queryProvidersSequential(
  configs: GisCountyConfig[],
  queryFn: (p: ReturnType<typeof createCountyProvider>) => Promise<NormalizedGisFeature[]>,
  options: { minCountyResults?: number; includeStatewide?: boolean } = {}
): Promise<NormalizedGisFeature[]> {
  const { minCountyResults = 1, includeStatewide = true } = options;
  const countyConfigs = configs.filter((c) => c.id !== "fl-statewide");
  const statewideConfig = includeStatewide
    ? configs.find((c) => c.id === "fl-statewide")
    : null;

  const merged: NormalizedGisFeature[] = [];
  const seen = new Set<string>();

  const add = (features: NormalizedGisFeature[]) => {
    for (const f of features) {
      if (!seen.has(f.externalId)) {
        seen.add(f.externalId);
        merged.push(f);
      }
    }
  };

  // 1. County providers in parallel
  if (countyConfigs.length > 0) {
    const countyResults = await Promise.allSettled(
      countyConfigs.map((cfg) => queryFn(getProvider(cfg.id)))
    );
    for (const r of countyResults) {
      if (r.status === "fulfilled") add(r.value);
    }
  }

  // 2. Skip statewide if county already returned enough
  if (!statewideConfig) return merged;
  if (merged.length >= minCountyResults) return merged;

  // 3. Statewide fallback (skip if already included by chance)
  if (countyConfigs.some((c) => c.id === statewideConfig.id)) return merged;

  try {
    const statewideResults = await queryFn(getProvider(statewideConfig.id));
    add(statewideResults);
  } catch {
    /* swallow */
  }

  return merged;
}

/**
 * Query providers for a bbox. County providers run first; statewide
 * is only queried if county returned no results.
 */
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

  const providerConfigs = resolveProvidersForBbox(minLng, minLat, maxLng, maxLat);
  if (providerConfigs.length === 0) return [];

  const merged = await queryProvidersSequential(
    providerConfigs,
    (p) => p.queryByBbox(minLng, minLat, maxLng, maxLat)
  );

  return enrichWithDb(merged);
}

export async function gisQueryPoint(
  lat: number,
  lng: number
): Promise<AppParcelPayload[]> {
  const providerConfigs = resolveProvidersForPoint(lat, lng);
  if (providerConfigs.length === 0) return [];

  const merged = await queryProvidersSequential(
    providerConfigs,
    (p) => p.queryByPoint(lat, lng)
  );

  return enrichWithDb(merged);
}

/**
 * Search address across county providers (parallel) then statewide if
 * county returned < 15 results. FDOR is a final fallback for ALL 67
 * counties when local providers + FGDL don't return enough matches.
 */
export async function gisSearchAddress(
  query: string
): Promise<NormalizedGisFeature[]> {
  const q = query.trim();
  if (!q) return [];

  const countyIds: GisProviderId[] = [
    "orange-fl",
    "hillsborough-fl",
    "osceola-fl",
    "palm-beach-fl",
    "collier-fl",
    "lee-fl",
    "pinellas-fl",
    "miami-dade-fl",
    "manatee-fl",
    "volusia-fl",
    "polk-fl",
    "lake-fl",
  ];
  const countyConfigs = countyIds
    .map((id) => GIS_PROVIDERS[id])
    .filter(Boolean);
  const statewideConfig = GIS_PROVIDERS["fl-statewide"];
  const fdorConfig = GIS_PROVIDERS["fl-fdor"];

  const merged = await queryProvidersSequential(
    [...countyConfigs, statewideConfig],
    (p) => p.searchAddress(q),
    { minCountyResults: 15 }
  );

  // Final FDOR fallback if we still don't have enough (covers the 37
  // counties without a dedicated provider + ones where FGDL has no data)
  if (merged.length < 15 && fdorConfig) {
    try {
      const fdorResults = await getProvider("fl-fdor").searchAddress(q);
      const seen = new Set(merged.map((f) => f.externalId));
      for (const f of fdorResults) {
        if (!seen.has(f.externalId)) {
          seen.add(f.externalId);
          merged.push(f);
        }
      }
    } catch {
      /* swallow */
    }
  }

  return merged.slice(0, 15);
}

export async function gisGetByExternalId(
  externalId: string
): Promise<AppParcelPayload | null> {
  const parsed = parseExternalId(externalId);
  const providerId = parsed?.providerId || DEFAULT_GIS_PROVIDER;

  // Fast-path: externalId encodes an OBJECTID (providerId:O:12345).
  // Orange County's objectIds= query is ~30x faster than WHERE PARCEL='...'
  const provider = getProvider(providerId);
  let feature: NormalizedGisFeature | null = null;
  if (parsed?.objectId != null && typeof provider.queryByObjectId === "function") {
    feature = await provider.queryByObjectId(parsed.objectId);
  } else {
    const parcelId = parsed?.parcelId || externalId;
    feature = await provider.queryByParcelId(parcelId);
  }

  if (!feature) return null;
  // Skip enrichWithDb: the caller (/api/parcels/[id]) already did a
  // full DB lookup; if it fell through to here, the parcel is purely
  // external and not in our DB. Avoids a 30-50ms wasted Prisma round-trip.
  return toAppParcelPayload(feature, null);
}

/**
 * GeoJSON viewport load. Excludes statewide by default to keep map panning
 * fast — statewide is only used for parcel-click / search, not for drawing
 * polygons on the map.
 */
export async function gisGeoJsonForBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  options: { includeStatewide?: boolean } = {}
): Promise<GeoJSON.FeatureCollection> {
  const { includeStatewide = false } = options;
  const providerConfigs = resolveProvidersForBbox(
    minLng,
    minLat,
    maxLng,
    maxLat
  ).filter((c) => includeStatewide || c.id !== "fl-statewide");

  if (providerConfigs.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const merged = await queryProvidersSequential(
    providerConfigs,
    (p) => p.queryByBbox(minLng, minLat, maxLng, maxLat),
    { includeStatewide }
  );

  const geoFeatures: GeoJSON.Feature[] = [];
  for (const f of merged) {
    const geo = toMapLibreFeature(f);
    if (geo) geoFeatures.push(geo);
  }
  return { type: "FeatureCollection", features: geoFeatures };
}

export function getDefaultProviderId(): GisProviderId {
  return DEFAULT_GIS_PROVIDER;
}