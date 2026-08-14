export type GisProviderId = "orange-fl";

export interface GisFieldMap {
  parcelId: string;
  owner: string;
  owner2?: string;
  address: string;
  city: string;
  zip: string;
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
}

export interface NormalizedGisFeature {
  externalId: string;
  parcelId: string;
  address: string;
  ownerName?: string;
  city: string;
  state: string;
  zipCode: string;
  geometry: GeoJSON.Geometry | null;
  landValue?: number | null;
  buildingValue?: number | null;
  acreage?: number | null;
  propertyClass?: string | null;
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
