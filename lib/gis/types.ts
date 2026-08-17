export type GisProviderId =
  | "orange-fl"
  | "hillsborough-fl"
  | "osceola-fl"
  | "pinellas-fl"
  | "broward-fl"
  | "palm-beach-fl"
  | "collier-fl"
  | "lee-fl"
  | "nassau-fl"
  | "miami-dade-fl"
  | "manatee-fl"
  | "volusia-fl"
  | "polk-fl"
  | "martin-fl"
  | "fl-statewide"
  | "fl-fdor";

export interface GisFieldMap {
  parcelId: string;
  owner?: string;
  owner2?: string;
  address?: string;
  /** Optional street number field, prepended to `address` (e.g. Pinellas). */
  addressNum?: string;
  mailAddress?: string;
  city?: string;
  zip?: string;
  landValue?: string;
  buildingValue?: string;
  acreage?: string;
  propertyClass?: string;
}

export interface GisCountyConfig {
  id: GisProviderId;
  name: string;
  state: string;
  /** [minLng, minLat, maxLng, maxLat] WGS84 */
  bbox: [number, number, number, number];
  parcelsUrl: string;
  geocodeUrl?: string;
  fieldMap: GisFieldMap;
  maxScale?: number;
  /** Extra outFields to include (e.g. ["OBJECTID"] for click fast-path) */
  extraOutFields?: string[];
  /**
   * Name of the OBJECTID field used by this provider. Defaults to "OBJECTID".
   * Orange County: "OBJECTID". Some services use "FID" or "OID_*".
   */
  objectIdField?: string;
}

export interface NormalizedGisFeature {
  externalId: string;
  parcelId: string;
  address: string;
  ownerName?: string;
  city: string;
  state: string;
  zipCode: string;
  ownerOccupied?: boolean;
  geometry: GeoJSON.Geometry | null;
  landValue?: number | null;
  buildingValue?: number | null;
  acreage?: number | null;
  propertyClass?: string | null;
  /** OBJECTID from upstream ArcGIS service (for fast click lookup) */
  objectId?: number | null;
  provider: GisProviderId;
  raw: Record<string, unknown>;
}

export interface AppParcelPayload {
  id: string;
  address: string;
  ownerName?: string;
  city: string;
  state: string;
  zipCode: string;
  ownerOccupied?: boolean;
  parcelTags: string | null;
  parcelNotes: string | null;
  geometry: string;
  status: string;
  metadata: string;
  setter: { id: number; name: string } | null;
  visits: unknown[];
}
