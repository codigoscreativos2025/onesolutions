import { GIS_PROVIDERS } from "./catalog";

/**
 * Florida counties as rectangular bbox polygons.
 *
 * Used for the LOD layer at z=6-10: when the user zooms way out we render a
 * county-level map of Florida with green for counties that have a dedicated
 * GIS provider and gray for counties that fall back to statewide data only.
 *
 * Built from the GIS_PROVIDERS catalog so the dataset stays in sync with the
 * provider registry. If you need real shape files, replace this with a
 * download from the US Census Bureau (county boundaries for Florida).
 */
type CountyCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  {
    id: string;
    name: string;
    hasDedicatedProvider: boolean;
  }
>;

function bboxToPolygon(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GeoJSON.Polygon {
  return {
    type: "Polygon",
    coordinates: [[
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ]],
  };
}

const PROVIDERS_WITHOUT_FULL_PARCEL_DATA = new Set([
  "broward-fl",
  "palm-beach-fl",
  "collier-fl",
  "martin-fl",
]);

function build(): CountyCollection {
  const features: CountyCollection["features"] = [];
  const seen = new Set<string>();

  for (const cfg of Object.values(GIS_PROVIDERS)) {
    // Skip statewide / search-only entries (not real counties)
    if (cfg.id === "fl-statewide" || cfg.id === "fl-fdor") continue;
    // Dedup by county name (multiple providers can map to the same county)
    if (seen.has(cfg.name)) continue;
    seen.add(cfg.name);

    const hasDedicatedProvider = !PROVIDERS_WITHOUT_FULL_PARCEL_DATA.has(cfg.id);

    features.push({
      type: "Feature",
      id: cfg.id,
      geometry: bboxToPolygon(cfg.bbox[0], cfg.bbox[1], cfg.bbox[2], cfg.bbox[3]),
      properties: {
        id: cfg.id,
        name: cfg.name,
        hasDedicatedProvider,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

export const FL_COUNTIES_FC: CountyCollection = build();
