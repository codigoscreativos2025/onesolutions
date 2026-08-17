import type { GisCountyConfig, GisProviderId } from "./types";

/** Default map center: downtown Orlando [lat, lng] */
export const ORLANDO_CENTER: [number, number] = [28.5383, -81.3792];

/**
 * Florida county parcel providers.
 *
 * Each provider is a public ArcGIS FeatureServer with Polygon parcel data.
 * Use `resolveProvidersForBbox` / `resolveProvidersForPoint` to pick the
 * best set of providers for a given viewport.
 */
export const GIS_PROVIDERS: Record<GisProviderId, GisCountyConfig> = {
  "orange-fl": {
    id: "orange-fl",
    name: "Orange County",
    state: "FL",
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

  "osceola-fl": {
    id: "osceola-fl",
    name: "Osceola County",
    state: "FL",
    bbox: [-81.85, 27.65, -80.85, 28.50],
    parcelsUrl:
      "https://services1.arcgis.com/NbEF7l0gBsrypoec/arcgis/rest/services/Osceola_2025_Parcels/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWN_NAME",
      address: "PHY_ADDR1",
      city: "PHY_CITY",
      zip: "PHY_ZIPCD",
      landValue: "LND_VAL",
      buildingValue: "JV",
      acreage: "LND_SQFOOT",
      propertyClass: "DOR_UC",
    },
    maxScale: 250000,
  },

  "hillsborough-fl": {
    id: "hillsborough-fl",
    name: "Hillsborough County",
    state: "FL",
    bbox: [-82.85, 27.57, -82.05, 28.17],
    parcelsUrl:
      "https://services9.arcgis.com/ssjvmF1sZLRQUcYv/arcgis/rest/services/Hillsborough_County_Parcels_Clipped_2024_05_04/FeatureServer/3",
    fieldMap: {
      parcelId: "FOLIO",
      owner: "OWNER",
      address: "SITE_ADDR",
      city: "SITE_CITY",
      zip: "SITE_ZIP",
      landValue: "LAND",
      buildingValue: "BLDG",
      acreage: "ACREAGE",
      propertyClass: "DOR_C",
    },
    maxScale: 250000,
  },

  "pinellas-fl": {
    id: "pinellas-fl",
    name: "Pinellas County",
    state: "FL",
    bbox: [-82.91, 27.61, -82.59, 28.17],
    parcelsUrl:
      "https://services.arcgis.com/f5HgUpxURgEzTccH/arcgis/rest/services/Parcel_JOIN/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCELID",
      owner: "OWNER1",
      owner2: "OWNER2",
      addressNum: "SITE_ADDRESS_NUM",
      address: "SITE_STREET",
      city: "SITE_CITY",
      zip: "SITE_ZIP",
      acreage: "PARCELACRES",
    },
    maxScale: 250000,
  },

  "broward-fl": {
    id: "broward-fl",
    name: "Broward County",
    state: "FL",
    bbox: [-80.88, 25.95, -80.07, 26.34],
    parcelsUrl:
      "https://services.arcgis.com/JMAJrTsHNLrSsWf5/arcgis/rest/services/QAlertBCPA_Parcel_TaxRoll/FeatureServer/3",
    fieldMap: {
      parcelId: "FOLIO",
      owner: "NAME_LINE_1",
      owner2: "NAME_LINE_2",
      address: "ADDRESS_LINE_1",
      city: "CITY",
      zip: "ZIP",
      buildingValue: "BLDG_TOT_SQ_FOOTAGE",
      propertyClass: "USE_CODE",
    },
    maxScale: 250000,
  },

  "palm-beach-fl": {
    id: "palm-beach-fl",
    name: "Palm Beach County",
    state: "FL",
    bbox: [-80.91, 26.31, -80.04, 26.97],
    parcelsUrl:
      "https://services.arcgis.com/B7X7NCOKKXditlwZ/arcgis/rest/services/Palm_Beach_County_Parcels/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWN_NAME",
      owner2: "FIDU_NAME",
      address: "PHY_ADDR1",
      mailAddress: "OWN_ADDR1",
      city: "PHY_CITY",
      zip: "PHY_ZIPCD",
      propertyClass: "DOR_UC",
    },
    maxScale: 250000,
  },

  "collier-fl": {
    id: "collier-fl",
    name: "Collier County",
    state: "FL",
    bbox: [-81.92, 25.79, -81.13, 26.39],
    parcelsUrl:
      "https://services2.arcgis.com/SlIq32SqARUHIhSx/arcgis/rest/services/Parcel/FeatureServer/2",
    fieldMap: {
      parcelId: "Folio",
      owner: "OwnerLine1",
      address: "SiteStreetAddress",
      city: "SiteCity",
      zip: "SiteZipCode",
    },
    maxScale: 250000,
  },

  "fl-statewide": {
    id: "fl-statewide",
    name: "Florida Statewide Parcels (FGDL)",
    state: "FL",
    bbox: [-87.63, 24.52, -80.03, 31.00],
    parcelsUrl:
      "https://services5.arcgis.com/GcvM6vDlR2gM4x31/arcgis/rest/services/Parcels/FeatureServer/4",
    fieldMap: {
      parcelId: "PARCELID",
      owner: "ONAME",
      address: "OADDR1",
      city: "OCITY",
      zip: "OZIPCD",
      landValue: "LNDVAL",
      buildingValue: "JV",
      propertyClass: "DORUC",
    },
    maxScale: 250000,
  },
};

export const DEFAULT_GIS_PROVIDER: GisProviderId = "fl-statewide";

export function getProviderConfig(
  id: GisProviderId = DEFAULT_GIS_PROVIDER
): GisCountyConfig {
  return GIS_PROVIDERS[id];
}

/**
 * Return all providers that overlap with a single WGS84 point.
 * County providers are returned in registration order so the more
 * specific ones (Orange, Hillsborough, ...) come first.
 */
export function resolveProvidersForPoint(
  lat: number,
  lng: number
): GisCountyConfig[] {
  const out: GisCountyConfig[] = [];
  for (const cfg of Object.values(GIS_PROVIDERS)) {
    if (cfg.id === "fl-statewide") continue;
    const [minLng, minLat, maxLng, maxLat] = cfg.bbox;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      out.push(cfg);
    }
  }
  // Statewide fallback for areas not covered by any county provider
  const statewide = GIS_PROVIDERS["fl-statewide"];
  const [sMinLng, sMinLat, sMaxLng, sMaxLat] = statewide.bbox;
  if (lng >= sMinLng && lng <= sMaxLng && lat >= sMinLat && lat <= sMaxLat) {
    out.push(statewide);
  }
  return out;
}

/**
 * Return all providers that overlap with a WGS84 bbox.
 * Order: county providers first (most specific), statewide last (catch-all).
 */
export function resolveProvidersForBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GisCountyConfig[] {
  const out: GisCountyConfig[] = [];
  for (const cfg of Object.values(GIS_PROVIDERS)) {
    if (cfg.id === "fl-statewide") continue;
    const [cMinLng, cMinLat, cMaxLng, cMaxLat] = cfg.bbox;
    const overlaps =
      minLng <= cMaxLng &&
      maxLng >= cMinLng &&
      minLat <= cMaxLat &&
      maxLat >= cMinLat;
    if (overlaps) out.push(cfg);
  }
  const statewide = GIS_PROVIDERS["fl-statewide"];
  const [sMinLng, sMinLat, sMaxLng, sMaxLat] = statewide.bbox;
  const overlaps =
    minLng <= sMaxLng &&
    maxLng >= sMinLng &&
    minLat <= sMaxLat &&
    maxLat >= sMinLat;
  if (overlaps) out.push(statewide);
  return out;
}

/** Backwards-compat: single provider for point */
export function resolveProviderForPoint(
  lat: number,
  lng: number
): GisCountyConfig | null {
  return resolveProvidersForPoint(lat, lng)[0] || null;
}

/** Backwards-compat: single provider for bbox */
export function resolveProviderForBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GisCountyConfig | null {
  return resolveProvidersForBbox(minLng, minLat, maxLng, maxLat)[0] || null;
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