import type {
  AppParcelPayload,
  GisCountyConfig,
  NormalizedGisFeature,
} from "./types";
import { makeExternalId } from "./catalog";
import type { GisProviderId } from "./types";


function stripZ(coords: unknown): unknown {
  if (!Array.isArray(coords)) return coords;
  if (coords.length >= 2 && typeof coords[0] === "number") {
    return [coords[0], coords[1]];
  }
  return coords.map(stripZ);
}

export function cleanGeometry(
  geometry: GeoJSON.Geometry | null | undefined
): GeoJSON.Geometry | null {
  if (!geometry) return null;
  try {
    const g = JSON.parse(JSON.stringify(geometry)) as GeoJSON.Geometry & {
      coordinates?: unknown;
    };
    if ("coordinates" in g && g.coordinates) {
      g.coordinates = stripZ(g.coordinates) as typeof g.coordinates;
    }
    return g;
  } catch {
    return geometry;
  }
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeArcGisFeature(
  feature: {
    properties?: Record<string, unknown> | null;
    attributes?: Record<string, unknown> | null;
    geometry?: GeoJSON.Geometry | null;
    id?: number | string | null;
  },
  config: GisCountyConfig
): NormalizedGisFeature | null {
  const props = (feature.properties ||
    feature.attributes ||
    {}) as Record<string, unknown>;
  const fm = config.fieldMap;
  const parcelId = str(props[fm.parcelId]);
  if (!parcelId) return null;

  const owner1 = fm.owner ? str(props[fm.owner]) : "";
  const owner2 = fm.owner2 ? str(props[fm.owner2]) : "";
  const ownerName = [owner1, owner2].filter(Boolean).join(" / ") || undefined;

  const addressNum = fm.addressNum ? str(props[fm.addressNum]) : "";
  const addressStreet = fm.address ? str(props[fm.address]) : "";
  const addressRaw = addressNum && addressStreet
    ? `${addressNum} ${addressStreet}`.trim()
    : addressStreet;
  const city = fm.city ? str(props[fm.city]) : "";
  const zipCode = fm.zip ? str(props[fm.zip]) : "";
  const address =
    addressRaw ||
    [city, config.state, zipCode].filter(Boolean).join(", ") ||
    "Sin direccion";

  let ownerOccupied: boolean | undefined = undefined;
  if (fm.mailAddress) {
    const mailAddress = str(props[fm.mailAddress]);
    if (mailAddress && addressRaw) {
      const mailNum = mailAddress.match(/^(\d+)/)?.[1];
      const situsNum = addressRaw.match(/^(\d+)/)?.[1];
      if (mailNum && situsNum) {
        ownerOccupied = mailNum === situsNum;
      } else {
        ownerOccupied = mailAddress.toLowerCase().trim().startsWith(addressRaw.toLowerCase().trim().substring(0, 5));
      }
    }
  }

  const objectIdField = config.objectIdField || "OBJECTID";
  // OBJECTID may be in feature.id (ArcGIS GeoJSON output) OR in properties
  let objectIdNum = num(props[objectIdField]);
  if (objectIdNum == null && feature.id != null) {
    objectIdNum = num(feature.id);
  }

  return {
    externalId: makeExternalId(config.id, parcelId),
    parcelId,
    address,
    ownerName,
    city: city === "UN-INCORPORATED" ? "" : city,
    state: config.state,
    zipCode,
    ownerOccupied,
    geometry: cleanGeometry(feature.geometry || null),
    landValue: fm.landValue ? num(props[fm.landValue]) : null,
    buildingValue: fm.buildingValue ? num(props[fm.buildingValue]) : null,
    acreage: fm.acreage ? num(props[fm.acreage]) : null,
    propertyClass: fm.propertyClass ? str(props[fm.propertyClass]) || null : null,
    objectId: objectIdNum,
    provider: config.id,
    raw: props,
  };
}

export function toAppParcelPayload(
  feature: NormalizedGisFeature,
  existing?: {
    id?: string;
    parcelTags?: string | null;
    parcelNotes?: string | null;
    status?: string;
    ownerOccupied?: boolean;
    setter?: { id: number; name: string } | null;
    visits?: unknown[];
  } | null
): AppParcelPayload {
  const metadata = {
    source: "gis",
    provider: feature.provider,
    parcel_id: feature.parcelId,
    regrid_id: feature.externalId,
    owner: feature.ownerName,
    city: feature.city,
    state: feature.state,
    zipCode: feature.zipCode,
    property_class: feature.propertyClass,
    acreage: feature.acreage,
    land_value: feature.landValue,
    building_value: feature.buildingValue,
  };

  return {
    id: existing?.id || feature.externalId,
    externalId: feature.externalId,
    address: feature.address,
    ownerName: feature.ownerName,
    city: feature.city,
    state: feature.state,
    zipCode: feature.zipCode,
    ownerOccupied: existing?.ownerOccupied ?? feature.ownerOccupied,
    parcelTags: existing?.parcelTags ?? null,
    parcelNotes: existing?.parcelNotes ?? null,
    geometry: JSON.stringify(
      feature.geometry || { type: "Polygon", coordinates: [] }
    ),
    status: existing?.status || "AVAILABLE",
    metadata: JSON.stringify(metadata),
    setter: existing?.setter ?? null,
    visits: existing?.visits ?? [],
  };
}

export function toMapLibreFeature(
  feature: NormalizedGisFeature
): GeoJSON.Feature | null {
  if (!feature.geometry) return null;
  const props: Record<string, unknown> = {
    ll_uuid: feature.externalId,
    parcel_id: feature.parcelId,
    address: feature.address,
    owner: feature.ownerName ?? null,
    headline: feature.address,
    provider: feature.provider as string,
    city: feature.city,
    state: feature.state,
    zipCode: feature.zipCode,
    property_class: feature.propertyClass ?? null,
    acreage: feature.acreage ?? null,
    land_value: feature.landValue ?? null,
    building_value: feature.buildingValue ?? null,
  };
  if (feature.objectId != null) props.object_id = feature.objectId;
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: props,
  };
}

export function isGisExternalId(id: string): boolean {
  return id.includes(":") && !id.includes(" ") && id.length < 80;
}

export type { GisProviderId };
