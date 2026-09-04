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
      mailAddress: "ADD1",
      city: "CITY_SITUS",
      zip: "ZIP_SITUS",
      landValue: "LAND_MKT",
      buildingValue: "BLDG_MKT",
      acreage: "ACREAGE",
      propertyClass: "DOR_CODE",
    },
    maxScale: 40000,
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
  },

  "osceola-fl": {
    id: "osceola-fl",
    name: "Osceola County",
    state: "FL",
    bbox: [-81.97, 27.63, -80.85, 28.58],
    parcelsUrl:
      "https://gis.osceola.org/hosting/rest/services/Parcels/FeatureServer/3",
    fieldMap: {
      parcelId: "Strap",
      owner: "Owner1",
      owner2: "Owner2",
      addressNum: "StreetNumb",
      address: "StreetName",
      addressSfx: "StreetSfx",
      mailAddress: "BillingAdd",
      city: "LocCity",
      zip: "LocZip",
      landValue: "CurrLand",
      buildingValue: "CurrBldg",
      acreage: "TotalAcres",
      propertyClass: "DORCode",
    },
    extraOutFields: ["OBJECTID_1"],
    objectIdField: "OBJECTID_1",
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
      mailAddress: "ADDR_1",
      city: "SITE_CITY",
      zip: "SITE_ZIP",
      landValue: "LAND",
      buildingValue: "BLDG",
      acreage: "ACREAGE",
      propertyClass: "DOR_C",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "pinellas-fl": {
    id: "pinellas-fl",
    name: "Pinellas County",
    state: "FL",
    bbox: [-82.91, 27.61, -82.59, 28.17],
    parcelsUrl:
      "https://services.arcgis.com/f5HgUpxURgEzTccH/arcgis/rest/services/Pinellas_ParcelPropertyInfo/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCELID",
      owner: "OWNER1",
      owner2: "OWNER2",
      address: "SITE_ADDRESS",
      city: "STR_CITY",
      zip: "STR_ZIP",
      landValue: "JUST_LAND",
      acreage: "ACREAGE",
      propertyClass: "LAND_USE_CD",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "lee-fl": {
    id: "lee-fl",
    name: "Lee County",
    state: "FL",
    bbox: [-82.46, 26.32, -81.80, 26.79],
    parcelsUrl:
      "https://services2.arcgis.com/LvWGAAhHwbCJ2GMP/arcgis/rest/services/Lee_County_Parcels/FeatureServer/0",
    fieldMap: {
      parcelId: "STRAP",
      owner: "O_NAME",
      owner2: "O_OTHERS",
      address: "SITEADDR",
      mailAddress: "O_ADDR1",
      city: "SITECITY",
      zip: "SITEZIP",
      landValue: "LAND",
      buildingValue: "BUILDING",
      acreage: "GISACRES",
      propertyClass: "DORCODE",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "nassau-fl": {
    id: "nassau-fl",
    name: "Nassau County",
    state: "FL",
    bbox: [-82.04, 30.27, -81.41, 30.83],
    parcelsUrl:
      "https://services3.arcgis.com/ImYoiBnIj5kSaAsi/arcgis/rest/services/Nassau_FL_Parcels/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWN_NAME",
      owner2: "FIDU_NAME",
      address: "PHY_ADDR1",
      city: "PHY_CITY",
      zip: "PHY_ZIPCD",
      landValue: "LND_VAL",
      buildingValue: "JV",
      acreage: "LND_SQFOOT",
      propertyClass: "DOR_UC",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "miami-dade-fl": {
    id: "miami-dade-fl",
    name: "Miami-Dade County",
    state: "FL",
    bbox: [-80.87, 25.13, -80.12, 25.97],
    parcelsUrl:
      "https://gisweb.miamidade.gov/arcgis/rest/services/MD_LandInformation/MapServer/26",
    fieldMap: {
      parcelId: "FOLIO",
      owner: "TRUE_OWNER1",
      owner2: "TRUE_OWNER2",
      address: "TRUE_SITE_ADDR",
      mailAddress: "TRUE_MAILING_ADDR1",
      city: "TRUE_SITE_CITY",
      zip: "TRUE_SITE_ZIP_CODE",
      landValue: "LAND_VAL_CUR",
      buildingValue: "BUILDING_VAL_CUR",
      acreage: "LOT_SIZE",
      propertyClass: "DOR_CODE_CUR",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 6000,
  },

  "manatee-fl": {
    id: "manatee-fl",
    name: "Manatee County",
    state: "FL",
    bbox: [-82.91, 27.21, -82.05, 27.78],
    parcelsUrl:
      "https://www.mymanatee.org/gisits/rest/services/opendata/General/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWNER",
      owner2: "SECONDARY_OWNER",
      address: "PRIMARY_ADDRESS",
      mailAddress: "OWN_ADDR",
      city: "PROP_CITYNAME",
      zip: "PROP_ZIP",
      landValue: "LANDVAL",
      buildingValue: "IMPRVAL",
      acreage: "ACRES",
      propertyClass: "LUC",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "volusia-fl": {
    id: "volusia-fl",
    name: "Volusia County",
    state: "FL",
    bbox: [-81.66, 28.61, -80.84, 29.43],
    parcelsUrl:
      "https://maps5.vcgov.org/arcgis/rest/services/Open_Data/Open_Data_3/FeatureServer/34",
    fieldMap: {
      parcelId: "PID",
      owner: "OWNER1",
      owner2: "OWNER2",
      address: "ADDRFULL",
      mailAddress: "MAILADDR1",
      city: "CITYNAME",
      zip: "ZIP1",
      landValue: "LANDJUST",
      buildingValue: "IMPRJUST",
      acreage: "CALCACRES",
      propertyClass: "CLASS",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "polk-fl": {
    id: "polk-fl",
    name: "Polk County",
    state: "FL",
    bbox: [-82.10, 27.64, -81.17, 28.36],
    parcelsUrl:
      "https://map.polkflpa.gov/proxy.ashx?https://gissrvr/ArcGIS/rest/services/WebSite/WebSite/MapServer/22",
    fieldMap: {
      parcelId: "PARCELID",
      owner: "NAME",
      owner2: "NAME2",
      address: "PROP_ADDRESS",
      city: "PROP_CITY",
      zip: "PROP_ZIP1",
      landValue: "TOT_LND_VAL",
      buildingValue: "IMPROV_VALUE",
      propertyClass: "DOR_CD",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 15000,
  },

  "martin-fl": {
    id: "martin-fl",
    name: "Martin County",
    state: "FL",
    bbox: [-80.88, 26.86, -80.03, 27.32],
    parcelsUrl:
      "https://services.arcgis.com/Ie0K5n4UyLAfvdiX/arcgis/rest/services/Martin_County_Parcel_Map/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWN_NAME",
      owner2: "FIDU_NAME",
      address: "PHY_ADDR1",
      mailAddress: "OWN_ADDR1",
      city: "PHY_CITY",
      zip: "PHY_ZIPCD",
      landValue: "LND_VAL",
      buildingValue: "JV",
      acreage: "LND_SQFOOT",
      propertyClass: "DOR_UC",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "lake-fl": {
    id: "lake-fl",
    name: "Lake County",
    state: "FL",
    bbox: [-82.05, 28.38, -81.30, 29.35],
    parcelsUrl:
      "https://services1.arcgis.com/7LNyA2emK1umjjot/arcgis/rest/services/Tax_Parcels_Hosted/FeatureServer/0",
    fieldMap: {
      parcelId: "ParcelNumber",
      owner: "OwnerName",
      address: "PropertyAddress",
      mailAddress: "OwnerAddress",
      city: "OwnerCity",
      zip: "OwnerZip",
      landValue: "LandValue",
      buildingValue: "BuildingValue",
      acreage: "Acres",
      propertyClass: "PropertyClassCode",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
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
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
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
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
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
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "fl-statewide": {
    id: "fl-statewide",
    name: "Florida Statewide Parcels (FGDL FL_Parcels)",
    state: "FL",
    bbox: [-87.63, 24.52, -80.03, 31.00],
    parcelsUrl:
      "https://services5.arcgis.com/GcvM6vDlR2gM4x31/ArcGIS/rest/services/FL_Parcels/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWN_NAME",
      owner2: "FIDU_NAME",
      address: "PHY_ADDR1",
      mailAddress: "OWN_ADDR1",
      city: "PHY_CITY",
      zip: "PHY_ZIPCD",
      landValue: "LND_VAL",
      buildingValue: "JV",
      acreage: "Acres",
      propertyClass: "DOR_UC",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
    maxScale: 250000,
  },

  "fl-fdor": {
    id: "fl-fdor",
    name: "Florida Statewide Cadastral (FDOR)",
    state: "FL",
    bbox: [-87.63, 24.52, -80.03, 31.00],
    parcelsUrl:
      "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0",
    fieldMap: {
      parcelId: "PARCEL_ID",
      owner: "OWN_NAME",
      owner2: "FIDU_NAME",
      address: "PHY_ADDR1",
      mailAddress: "OWN_ADDR1",
      city: "PHY_CITY",
      zip: "PHY_ZIPCD",
      buildingValue: "JV",
      propertyClass: "DOR_UC",
    },
    extraOutFields: ["OBJECTID"],
    objectIdField: "OBJECTID",
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
    // Skip providers that don't support spatial queries
    if (cfg.id === "fl-statewide" || cfg.id === "fl-fdor" || cfg.id === "martin-fl") continue;
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
 * FDOR and Martin are excluded because they don't support spatial queries.
 */
export function resolveProvidersForBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GisCountyConfig[] {
  const out: GisCountyConfig[] = [];
  for (const cfg of Object.values(GIS_PROVIDERS)) {
    if (cfg.id === "fl-statewide" || cfg.id === "fl-fdor" || cfg.id === "martin-fl") continue;
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

/**
 * Build a fast-path externalId that encodes the upstream OBJECTID.
 * Use when the client knows the OBJECTID (e.g. it came from a bbox
 * response that includes OBJECTID in feature properties). The server
 * will route through queryByObjectId which is ~30x faster than a
 * WHERE-parcel-id query on services like Orange County.
 */
export function makeObjectIdExternalId(
  providerId: GisProviderId,
  objectId: number
): string {
  return `${providerId}:O:${objectId}`;
}

export function parseExternalId(
  externalId: string
): { providerId: GisProviderId; parcelId: string; objectId?: number } | null {
  const idx = externalId.indexOf(":");
  if (idx <= 0) return null;
  const providerId = externalId.slice(0, idx) as GisProviderId;
  if (!GIS_PROVIDERS[providerId]) return null;
  const rest = externalId.slice(idx + 1);

  // Fast-path: "providerId:O:12345" — query by OBJECTID (30x faster than
  // WHERE PARCEL='...' on Orange County: 0.3s vs 9s)
  if (rest.startsWith("O:")) {
    const oid = parseInt(rest.slice(2), 10);
    if (!Number.isFinite(oid) || oid <= 0) return null;
    return { providerId, parcelId: "", objectId: oid };
  }

  if (!rest) return null;
  return { providerId, parcelId: rest };
}

/** Active parcel data provider: gis (free county) or regrid */
export function getParcelProvider(): "gis" | "regrid" {
  const v = (process.env.PARCEL_PROVIDER || "gis").toLowerCase();
  return v === "regrid" ? "regrid" : "gis";
}