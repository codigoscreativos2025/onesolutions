import type { GisCountyConfig, GisProviderId } from "./types";

/** Default map center: downtown Orlando [lat, lng] */
export const ORLANDO_CENTER: [number, number] = [28.5383, -81.3792];

export const GIS_PROVIDERS: Record<GisProviderId, GisCountyConfig> = {
  "orange-fl": {
    id: "orange-fl",
    name: "Orange County",
    state: "FL",
    // Approximate Orange County FL extent
    bbox: [-81.68, 28.34, -80.98, 28.79],
    parcelsUrl:
      "https://ocgis4.ocfl.net/arcgis/rest/services/AGOL_Open_Data/MapServer/56",
    geocodeUrl:
      "https://ocgis4.ocfl.net/arcgis/rest/services/PublicCompositeLoc_AGO/GeocodeServer",
    fieldMap: {
      parcelId: "PARCEL",
      owner: "NAME1",
      owner2: "NAME2",
      address: "SITUS",
      city: "CITY_SITUS",
      zip: "ZIP_SITUS",
      landValue: "LAND_MKT",
      buildingValue: "BLDG_MKT",
      acreage: "ACREAGE",
      propertyClass: "DOR_CODE",
    },
    maxScale: 40000,
  },
};

export const DEFAULT_GIS_PROVIDER: GisProviderId = "orange-fl";

export function getProviderConfig(
  id: GisProviderId = DEFAULT_GIS_PROVIDER
): GisCountyConfig {
  return GIS_PROVIDERS[id];
}

export function resolveProviderForPoint(
  lat: number,
  lng: number
): GisCountyConfig | null {
  for (const cfg of Object.values(GIS_PROVIDERS)) {
    const [minLng, minLat, maxLng, maxLat] = cfg.bbox;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return cfg;
    }
  }
  return null;
}

export function resolveProviderForBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GisCountyConfig | null {
  for (const cfg of Object.values(GIS_PROVIDERS)) {
    const [cMinLng, cMinLat, cMaxLng, cMaxLat] = cfg.bbox;
    const overlaps =
      minLng <= cMaxLng &&
      maxLng >= cMinLng &&
      minLat <= cMaxLat &&
      maxLat >= cMinLat;
    if (overlaps) return cfg;
  }
  return null;
}

export function makeExternalId(
  providerId: GisProviderId,
  parcelId: string
): string {
  return `${providerId}:${parcelId}`;
}

export function parseExternalId(
  externalId: string
): { providerId: GisProviderId; parcelId: string } | null {
  const idx = externalId.indexOf(":");
  if (idx <= 0) return null;
  const providerId = externalId.slice(0, idx) as GisProviderId;
  const parcelId = externalId.slice(idx + 1);
  if (!GIS_PROVIDERS[providerId] || !parcelId) return null;
  return { providerId, parcelId };
}

/** Active parcel data provider: gis (free county) or regrid */
export function getParcelProvider(): "gis" | "regrid" {
  const v = (process.env.PARCEL_PROVIDER || "gis").toLowerCase();
  return v === "regrid" ? "regrid" : "gis";
}
