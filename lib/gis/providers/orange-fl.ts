import type { GisCountyConfig } from "../types";
import type { NormalizedGisFeature } from "../types";
import { getProviderConfig } from "../catalog";
import { normalizeArcGisFeature } from "../normalize";

const OUT_FIELDS = [
  "PARCEL",
  "NAME1",
  "NAME2",
  "SITUS",
  "CITY_SITUS",
  "ZIP_SITUS",
  "LAND_MKT",
  "BLDG_MKT",
  "ACREAGE",
  "DOR_CODE",
].join(",");

const FETCH_TIMEOUT_MS = 20000;
const MAX_BBOX_FEATURES = 800;
const MAX_SEARCH_FEATURES = 15;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
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

function config(): GisCountyConfig {
  return getProviderConfig("orange-fl");
}

function parseFeatureCollection(data: unknown): NormalizedGisFeature[] {
  const cfg = config();
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

/** Query parcels intersecting WGS84 bbox */
export async function queryByBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  limit = MAX_BBOX_FEATURES
): Promise<NormalizedGisFeature[]> {
  const cfg = config();
  const geometry = `${minLng},${minLat},${maxLng},${maxLat}`;
  const params = new URLSearchParams({
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: OUT_FIELDS,
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: String(Math.min(limit, MAX_BBOX_FEATURES)),
    f: "geojson",
  });
  const url = `${cfg.parcelsUrl}/query?${params.toString()}`;
  const data = await fetchJson(url);
  return parseFeatureCollection(data);
}

/** Query parcel at a WGS84 point */
export async function queryByPoint(
  lat: number,
  lng: number
): Promise<NormalizedGisFeature[]> {
  const cfg = config();
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: OUT_FIELDS,
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "5",
    f: "geojson",
  });
  const url = `${cfg.parcelsUrl}/query?${params.toString()}`;
  const data = await fetchJson(url);
  return parseFeatureCollection(data);
}

/** Fetch a single parcel by county parcel id */
export async function queryByParcelId(
  parcelId: string
): Promise<NormalizedGisFeature | null> {
  const cfg = config();
  const safe = parcelId.replace(/'/g, "''");
  const params = new URLSearchParams({
    where: `PARCEL='${safe}'`,
    outFields: OUT_FIELDS,
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "1",
    f: "geojson",
  });
  const url = `${cfg.parcelsUrl}/query?${params.toString()}`;
  const data = await fetchJson(url);
  const list = parseFeatureCollection(data);
  return list[0] || null;
}

function escapeLike(s: string): string {
  return s.replace(/'/g, "''").replace(/%/g, "").replace(/_/g, " ").trim();
}

/** Search parcels by situs address text and/or geocode */
export async function searchAddress(
  query: string
): Promise<NormalizedGisFeature[]> {
  const q = query.trim();
  if (!q) return [];

  const cfg = config();
  const results: NormalizedGisFeature[] = [];
  const seen = new Set<string>();

  // 1) Attribute search on SITUS
  const like = escapeLike(q.toUpperCase());
  if (like.length >= 3) {
    try {
      const params = new URLSearchParams({
        where: `UPPER(SITUS) LIKE '%${like}%'`,
        outFields: OUT_FIELDS,
        returnGeometry: "true",
        outSR: "4326",
        resultRecordCount: String(MAX_SEARCH_FEATURES),
        f: "geojson",
      });
      const data = await fetchJson(`${cfg.parcelsUrl}/query?${params.toString()}`);
      for (const f of parseFeatureCollection(data)) {
        if (!seen.has(f.externalId)) {
          seen.add(f.externalId);
          results.push(f);
        }
      }
    } catch (err) {
      console.error("Orange GIS situs search error:", err);
    }
  }

  // 2) Geocode → point → parcel (if few results)
  if (results.length < 5 && cfg.geocodeUrl) {
    try {
      const gParams = new URLSearchParams({
        SingleLine: q,
        maxLocations: "5",
        outSR: "4326",
        f: "json",
      });
      const gData = (await fetchJson(
        `${cfg.geocodeUrl}/findAddressCandidates?${gParams.toString()}`
      )) as {
        candidates?: Array<{
          location?: { x: number; y: number };
          score?: number;
        }>;
      };
      const candidates = (gData.candidates || [])
        .filter((c) => (c.score ?? 0) >= 70 && c.location)
        .slice(0, 5);

      for (const c of candidates) {
        const { x, y } = c.location!;
        const parcels = await queryByPoint(y, x);
        for (const f of parcels) {
          if (!seen.has(f.externalId)) {
            seen.add(f.externalId);
            results.push(f);
          }
        }
      }
    } catch (err) {
      console.error("Orange GIS geocode search error:", err);
    }
  }

  return results.slice(0, MAX_SEARCH_FEATURES);
}
