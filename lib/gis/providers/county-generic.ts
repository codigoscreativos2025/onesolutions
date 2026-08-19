import type { GisCountyConfig, NormalizedGisFeature } from "../types";
import { getProviderConfig } from "../catalog";
import { normalizeArcGisFeature } from "../normalize";

/**
 * Generic FL county parcel provider.
 * Uses the same ArcGIS FeatureServer query pattern as Orange County,
 * with geometry as a comma-separated string and inSR=4326. Works with
 * any ArcGIS-hosted FeatureServer that exposes Polygon parcel data.
 *
 * Caching: bbox queries are CACHED at the upstream service via HTTP
 * standard caching. Set `next: { revalidate: 0 }` to disable Next.js
 * caching and let the upstream service control freshness.
 */

const DEFAULT_TIMEOUT_MS = 60000;
const OBJECT_ID_CHUNK = 100;

// Throttle repeated identical warnings within a short window so a slow
// or failing upstream doesn't flood the console.
const recentWarnings = new Map<string, number>();
const WARNING_THROTTLE_MS = 30_000;

function warnOnce(key: string, ...args: unknown[]) {
  const now = Date.now();
  const last = recentWarnings.get(key) || 0;
  if (now - last < WARNING_THROTTLE_MS) return;
  recentWarnings.set(key, now);
  console.warn(...args);
}

async function fetchJson(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GIS HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// LRU cache for queryByParcelId results. Clicking the same parcel twice
// is common (open, close, reopen) and the upstream query is 1-10s — we
// cache for 5 min so repeat clicks are instant.
type CacheEntry = { data: NormalizedGisFeature | null; expires: number };
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const parcelIdCache = new Map<string, CacheEntry>();

function cacheGet(key: string): NormalizedGisFeature | null | undefined {
  const entry = parcelIdCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    parcelIdCache.delete(key);
    return undefined;
  }
  // LRU bump: re-insert to move to end of insertion order
  parcelIdCache.delete(key);
  parcelIdCache.set(key, entry);
  return entry.data;
}

function cacheSet(key: string, data: NormalizedGisFeature | null): void {
  parcelIdCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  while (parcelIdCache.size > CACHE_MAX_ENTRIES) {
    const firstKey = parcelIdCache.keys().next().value;
    if (firstKey === undefined) break;
    parcelIdCache.delete(firstKey);
  }
}

function config(id: string): GisCountyConfig {
  return getProviderConfig(id as never);
}

function parseFeatureCollection(
  data: unknown,
  cfg: GisCountyConfig
): NormalizedGisFeature[] {
  const fc = data as {
    features?: Array<{
      properties?: Record<string, unknown>;
      attributes?: Record<string, unknown>;
      geometry?: GeoJSON.Geometry;
    }>;
  };
  const features = fc.features || [];
  const out: NormalizedGisFeature[] = [];
  for (const f of features) {
    const n = normalizeArcGisFeature(f, cfg);
    if (n) out.push(n);
  }
  return out;
}

/** Build envelope string in the format the upstream prefers */
function envelope(
  jsonMode: boolean,
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): string {
  if (jsonMode) {
    return JSON.stringify({
      xmin: minLng,
      ymin: minLat,
      xmax: maxLng,
      ymax: maxLat,
      spatialReference: { wkid: 4326 },
    });
  }
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

/** Build query URL with comma-string geometry (works with most FL county services) */
function bboxQueryUrl(
  cfg: GisCountyConfig,
  fields: string,
  jsonMode: boolean,
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  recordCount: number,
  maxAllowableOffset?: number
): string {
  const geometry = envelope(jsonMode, minLng, minLat, maxLng, maxLat);
  const params = new URLSearchParams({
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: fields,
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: String(recordCount),
    f: "geojson",
  });
  if (maxAllowableOffset && maxAllowableOffset > 0) {
    params.set("maxAllowableOffset", String(maxAllowableOffset));
  }
  return `${cfg.parcelsUrl}/query?${params.toString()}`;
}

export interface CountyProviderOptions {
  /** Field names for the `outFields` parameter */
  outFields: string[];
  /** Use the `returnIdsOnly` + `objectIds` pagination pattern (for services with strict record limits) */
  usePagination?: boolean;
  /** Default record count per query */
  recordCount?: number;
  /** Use JSON envelope format with explicit wkid (for services that need it) */
  jsonEnvelope?: boolean;
  /**
   * Whether the upstream supports spatial (bbox/point) queries.
   * Defaults to true. Set false for providers that only support WHERE
   * clauses (e.g. FDOR cadastral). Spatial methods will short-circuit
   * to empty results without a network call.
   */
  supportsSpatial?: boolean;
}

export function createCountyProvider(
  providerId: string,
  opts: CountyProviderOptions
) {
  const fields = opts.outFields.join(",");
  const cfg = () => config(providerId);

  async function fetchByObjectIds(ids: number[], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<NormalizedGisFeature[]> {
    const c = cfg();
    const out: NormalizedGisFeature[] = [];
    for (let i = 0; i < ids.length; i += OBJECT_ID_CHUNK) {
      const chunk = ids.slice(i, i + OBJECT_ID_CHUNK);
      const params = new URLSearchParams({
        objectIds: chunk.join(","),
        outFields: fields,
        returnGeometry: "false",
        outSR: "4326",
        f: "geojson",
      });
      const url = `${c.parcelsUrl}/query?${params.toString()}`;
      try {
        const data = await fetchJson(url, timeoutMs);
        out.push(...parseFeatureCollection(data, c));
      } catch (err) {
        warnOnce(
          `${providerId}:objectIds:${i}`,
          `[${providerId}] objectIds chunk error (chunk ${i}-${i + chunk.length}):`,
          err instanceof Error ? err.message : err
        );
      }
    }
    return out;
  }

  // Cached queryByObjectId: OBJECTID-based lookup is 30x faster than
  // WHERE-parcel-id (Orange County: 0.3s vs 9s).
  const objectIdCache = new Map<number, { data: NormalizedGisFeature | null; expires: number }>();

  async function queryByObjectIdImpl(objectId: number): Promise<NormalizedGisFeature | null> {
    const cached = objectIdCache.get(objectId);
    if (cached) {
      if (Date.now() <= cached.expires) return cached.data;
      objectIdCache.delete(objectId);
    }
    const features = await fetchByObjectIds([objectId], 10000);
    const result = features[0] || null;
    objectIdCache.set(objectId, { data: result, expires: Date.now() + CACHE_TTL_MS });
    while (objectIdCache.size > CACHE_MAX_ENTRIES) {
      const firstKey = objectIdCache.keys().next().value;
      if (firstKey === undefined) break;
      objectIdCache.delete(firstKey);
    }
    return result;
  }

  return {
    id: providerId,

    async queryByBbox(
      minLng: number,
      minLat: number,
      maxLng: number,
      maxLat: number,
      limit = opts.recordCount ?? 200,
      maxAllowableOffset?: number
    ): Promise<NormalizedGisFeature[]> {
      // Short-circuit when upstream doesn't support spatial queries
      if (opts.supportsSpatial === false) return [];

      const c = cfg();
      try {
        if (opts.usePagination) {
          const chunkSize = limit;
          const baseUrl = bboxQueryUrl(
            c, fields, !!opts.jsonEnvelope, minLng, minLat, maxLng, maxLat, chunkSize, maxAllowableOffset
          );

          const results: NormalizedGisFeature[] = [];
          const seen = new Set<string>();
          let offset = 0;
          const MAX_RECORDS = 50000;
          const concurrency = 2;

          while (offset < MAX_RECORDS) {
            const batchOffsets: number[] = [];
            for (let i = 0; i < concurrency && offset + i * chunkSize < MAX_RECORDS; i++) {
              batchOffsets.push(offset + i * chunkSize);
            }
            if (batchOffsets.length === 0) break;

            const batchPromises = batchOffsets.map(async (off) => {
              const pagedUrl = `${baseUrl}&resultOffset=${off}`;
              try {
                const data = await fetchJson(pagedUrl, 60000);
                return parseFeatureCollection(data, c);
              } catch (err) {
                warnOnce(`${providerId}:page:${off}`, `[${providerId}] Page error at ${off}:`, err instanceof Error ? err.message : err);
                return null;
              }
            });

            const batchResults = await Promise.all(batchPromises);
            let totalInBatch = 0;
            let anySuccess = false;

            for (const feats of batchResults) {
              if (feats === null) continue;
              anySuccess = true;
              totalInBatch += feats.length;
              for (const f of feats) {
                if (!seen.has(f.externalId)) {
                  seen.add(f.externalId);
                  results.push(f);
                }
              }
            }

            if (!anySuccess) {
              warnOnce(`${providerId}:batchFail`, `[${providerId}] All pages in batch failed at offset ${offset}, stopping.`);
              break;
            }

            if (totalInBatch < batchOffsets.length * chunkSize) {
              break;
            }

            offset += batchOffsets.length * chunkSize;
          }
          return results;
        }

        const url = bboxQueryUrl(
          c,
          fields,
          !!opts.jsonEnvelope,
          minLng,
          minLat,
          maxLng,
          maxLat,
          limit
        );
        const data = await fetchJson(url, 60000);
        return parseFeatureCollection(data, c).slice(0, limit);
      } catch (err) {
        warnOnce(
          `${providerId}:bbox`,
          `[${providerId}] bbox error:`,
          err instanceof Error ? err.message : err
        );
        return [];
      }
    },

    async queryByPoint(
      lat: number,
      lng: number
    ): Promise<NormalizedGisFeature[]> {
      // Short-circuit when upstream doesn't support spatial queries
      if (opts.supportsSpatial === false) return [];

      const c = cfg();
      try {
        if (opts.usePagination) {
          // Tight bbox around the point to use the pagination flow
          return this.queryByBbox(lng - 0.0005, lat - 0.0005, lng + 0.0005, lat + 0.0005, 20);
        }
        const geometry = `${lng},${lat}`;
        const params = new URLSearchParams({
          geometry,
          geometryType: "esriGeometryPoint",
          inSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          outFields: fields,
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "5",
          f: "geojson",
        });
        const data = await fetchJson(`${c.parcelsUrl}/query?${params.toString()}`, 10000);
        return parseFeatureCollection(data, c);
      } catch (err) {
        warnOnce(
          `${providerId}:point`,
          `[${providerId}] point error:`,
          err instanceof Error ? err.message : err
        );
        return [];
      }
    },

    async queryByParcelId(parcelId: string): Promise<NormalizedGisFeature | null> {
      const cacheKey = `${providerId}:${parcelId}`;
      const cached = cacheGet(cacheKey);
      if (cached !== undefined) return cached;

      const c = cfg();
      try {
        const safe = parcelId.replace(/'/g, "''");
        const params = new URLSearchParams({
          where: `${c.fieldMap.parcelId}='${safe}'`,
          outFields: fields,
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "1",
          f: "geojson",
        });
        // Orange County's WHERE parser is ~10s slow; allow 25s so the
        // first click on an unclaimed parcel doesn't fail. The fast-path
        // via OBJECTID (queryByObjectId) is preferred when available and
        // takes only ~0.5s.
        const data = await fetchJson(`${c.parcelsUrl}/query?${params.toString()}`, 25000);
        const list = parseFeatureCollection(data, c);
        const result = list[0] || null;
        cacheSet(cacheKey, result);
        return result;
      } catch (err) {
        warnOnce(
          `${providerId}:parcelId:${parcelId}`,
          `[${providerId}] parcelId error for ${parcelId}:`,
          err instanceof Error ? err.message : err
        );
        return null;
      }
    },

    async queryByObjectId(objectId: number): Promise<NormalizedGisFeature | null> {
      return queryByObjectIdImpl(objectId);
    },

    async searchAddress(query: string): Promise<NormalizedGisFeature[]> {
      const q = query.trim();
      if (!q) return [];

      const c = cfg();
      const addrField = c.fieldMap.address;
      const ownerField = c.fieldMap.owner;
      const safe = q.replace(/'/g, "''").toUpperCase();

      const results: NormalizedGisFeature[] = [];
      const seen = new Set<string>();

      const tryWhere = async (whereClause: string) => {
        const params = new URLSearchParams({
          where: whereClause,
          outFields: fields,
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "15",
          f: "geojson",
        });
        try {
          const data = await fetchJson(`${c.parcelsUrl}/query?${params.toString()}`, 15000);
          for (const f of parseFeatureCollection(data, c)) {
            if (!seen.has(f.externalId)) {
              seen.add(f.externalId);
              results.push(f);
            }
          }
        } catch (err) {
          warnOnce(
            `${providerId}:search:${q}`,
            `[${providerId}] search error for "${q}":`,
            err instanceof Error ? err.message : err
          );
        }
      };

      await tryWhere(`UPPER(${addrField}) LIKE '%${safe}%'`);
      if (results.length < 15 && ownerField) {
        await tryWhere(`UPPER(${ownerField}) LIKE '%${safe}%'`);
      }

      return results.slice(0, 15);
    },
  };
}

export type CountyProvider = ReturnType<typeof createCountyProvider>;