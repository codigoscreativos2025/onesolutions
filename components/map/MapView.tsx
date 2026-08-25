"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ParcelSheet } from "./ParcelSheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { useLocale } from "@/lib/locale-context";
import { FL_COUNTIES_FC } from "@/lib/gis/fl-counties";

interface Parcel {
  id: string;
  externalId?: string;
  address: string;
  ownerName?: string;
  status: "AVAILABLE" | "LEAD" | "CUSTOMER";
  geometry?: string;
  metadata?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ownerOccupied?: boolean;
  parcelTags?: string;
  parcelNotes?: string;
  setter?: { id: number; name: string; role?: string };
  visits?: {
    id: number;
    stage: string;
    outcome?: string;
    setter?: { id: number; name: string; role?: string };
  }[];
}

/** Downtown Orlando [lat, lng] */
const defaultCenter: [number, number] = [28.5383, -81.3792];

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function getTagColor(parcelTags?: string): string | null {
  try {
    if (parcelTags) {
      const tags = JSON.parse(parcelTags);
      if (Array.isArray(tags) && tags.length > 0) return tags[0].color;
    }
  } catch {
    /* */
  }
  return null;
}

export default function MapView({
  center,
  autoOpenId,
  onMapMove,
}: {
  center?: [number, number] | null;
  autoOpenId?: string | null;
  onMapMove?: (center: [number, number], zoom: number) => void;
}) {
  const { data: session } = useSession();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const mapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isFetchingParcel, setIsFetchingParcel] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [parcelsHint, setParcelsHint] = useState<string | null>(null);
  const autoOpenedRef = useRef(false);
  // User's geolocation. null = not yet known / disabled. Only non-admin
  // users get a location prompt; admins keep the Orlando default.
  const userLocationRef = useRef<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied" | "unavailable"
  >("idle");

  const { t } = useLocale();

  useEffect(() => {
    if (autoOpenId && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      fetch(`/api/parcels/${encodeURIComponent(autoOpenId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.id) {
            const parcel: Parcel = {
              id: data.id,
              externalId: data.externalId,
              address: data.address || "Sin direccion",
              ownerName: data.ownerName,
              status: data.status || "AVAILABLE",
              geometry: data.geometry || "",
              metadata: data.metadata || "",
              setter: data.setter,
              visits: data.visits || [],
            };
            setSelectedParcel(parcel);

            if (map.current && data.geometry) {
              try {
                const geom = JSON.parse(data.geometry);
                selectedGeometryRef.current = geom;
                (map.current.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: geom,
                      properties: {
                        fillColor: "#f48221",
                        borderColor: "#f48221",
                      },
                    },
                  ],
                });
              } catch {
                /* */
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [autoOpenId]);

  // Update user-location dot whenever a new fix arrives. Recenters the
  // map to the user's location too, but only when:
  //   - the map is mounted
  //   - there's no explicit center prop (otherwise the admin/user picked
  //     a specific parcel to focus on and we shouldn't override it)
  // Skips if the location still hasn't arrived.
  useEffect(() => {
    if (!userLocation) return;
    if (map.current) {
      (map.current.getSource("user-location") as maplibregl.GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [userLocation[1], userLocation[0]] },
            properties: {},
          },
        ],
      });
      if (!centerRef.current) {
        map.current.flyTo({
          center: [userLocation[1], userLocation[0]],
          zoom: 18,
        });
        centerRef.current = userLocation;
        map.current.once("moveend", () => {
          fetchParcelsRef.current?.();
          fetchMarkersRef.current?.();
        });
      }
    } else {
      // Map not yet mounted — stash the location so initMap picks it up
      // on its first run. (initMap already handles this case.)
    }
  }, [userLocation]);

  const fetchMarkersRef = useRef<() => void>();
  const fetchParcelsRef = useRef<() => void>();
  const initializedRef = useRef(false);
  const centerRef = useRef<[number, number] | null | undefined>(center);
  const selectedGeometryRef = useRef<GeoJSON.Geometry | null>(null);
  const quickTagActiveRef = useRef(false);
  const parcelsAbortRef = useRef<AbortController | null>(null);
  const parcelsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  // Request geolocation for non-admin users. Admins keep the default
  // Orlando center. The location is stored in a ref so initMap can
  // pick it up synchronously without waiting for React state.
  const isAdmin = (session?.user?.role || "").toUpperCase() === "ADMIN";
  // Set up continuous geolocation tracking
  useEffect(() => {
    if (!session || isAdmin) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("requesting");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        userLocationRef.current = loc;
        setUserLocation(loc);
        setLocationStatus("granted");
      },
      (err) => {
        setLocationStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [session, isAdmin]);

  const handleFlyToUser = useCallback(() => {
    if (locationStatus === "requesting") {
      toast.loading("Obteniendo ubicación...", { id: "geo-req", duration: 2000 });
      return;
    }
    if (locationStatus === "denied") {
      toast.error("Ubicación bloqueada. Actívala en los permisos del navegador.");
      return;
    }
    if (locationStatus === "unavailable") {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    
    // If we have a location, fly to it
    if (userLocationRef.current && map.current) {
      const loc = userLocationRef.current;
      map.current.flyTo({ center: [loc[1], loc[0]], zoom: 18 });
      map.current.once("moveend", () => {
        fetchParcelsRef.current?.();
        fetchMarkersRef.current?.();
      });
      toast.loading("Ubicándote...", { id: "geo-req", duration: 2000 });
    }
  }, [locationStatus]);

  const initMap = useCallback(() => {
    if (!mapContainer.current || initializedRef.current) return;
    initializedRef.current = true;

    const propCenter = centerRef.current;
    const userLoc = userLocationRef.current;
    // Priority: explicit propCenter > userLocation > defaultCenter
    const initialCenter = propCenter || userLoc || defaultCenter;
    const zoom = propCenter || userLoc ? 18 : 16;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [initialCenter[1], initialCenter[0]],
      zoom,
    });

    mapTimeout.current = setTimeout(() => {
      if (!mapReady) {
        setMapReady(true);
        toast.error(
          "El mapa esta tardando. Si no ves las parcelas, intenta recargar."
        );
      }
    }, 15000);

    m.on("load", () => {
      if (mapTimeout.current) clearTimeout(mapTimeout.current);

      if (onMapMove) {
        const c = m.getCenter();
        onMapMove([c.lat, c.lng], m.getZoom());
      }

      // County-level layer: shows the whole state of Florida at z=6-10.
      // Green polygons are counties with a dedicated GIS provider; gray
      // polygons are counties that fall back to statewide data only.
      // Built from the GIS catalog bboxes — see lib/gis/fl-counties.ts.
      m.addSource("counties", {
        type: "geojson",
        data: FL_COUNTIES_FC as GeoJSON.FeatureCollection,
        promoteId: "id",
      });
      m.addLayer({
        id: "county-fills",
        type: "fill",
        source: "counties",
        minzoom: 6,
        maxzoom: 10,
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "hasDedicatedProvider"], true],
            "#22c55e",
            "#94a3b8",
          ],
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 0.10,
            9, 0.14,
            10, 0,
          ],
        },
      });
      m.addLayer({
        id: "county-borders",
        type: "line",
        source: "counties",
        minzoom: 6,
        maxzoom: 10,
        paint: {
          "line-color": "#0f172a",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 0.5,
            9, 1.5,
            10, 0,
          ],
        },
      });
      m.addLayer({
        id: "county-labels",
        type: "symbol",
        source: "counties",
        minzoom: 7,
        maxzoom: 10,
        layout: {
          "text-field": ["get", "name"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 10,
            9, 14,
          ],
          "text-anchor": "center",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 0.7,
            9, 0.95,
            10, 0,
          ],
        },
      });

      // Macro-tile source/layer: subdivision rectangles that show the
      // user which 5km chunks are loaded when zoomed out. Hidden at
      // z >= 13 when real parcel polygons take over.
      m.addSource("gis-macro", {
        type: "geojson",
        data: EMPTY_FC,
      });
      m.addLayer({
        id: "macro-fills",
        type: "fill",
        source: "gis-macro",
        minzoom: 10,
        maxzoom: 13,
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 0.06,
            12, 0.14,
            13, 0,
          ],
        },
      });
      m.addLayer({
        id: "macro-borders",
        type: "line",
        source: "gis-macro",
        minzoom: 10,
        maxzoom: 13,
        paint: {
          "line-color": "#15803d",
          "line-width": 1,
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 0.5,
            12, 1,
            13, 0,
          ],
        },
      });

      m.addSource("gis-parcels", {
        type: "geojson",
        data: EMPTY_FC,
        promoteId: "ll_uuid",
      });

      m.addLayer({
        id: "parcel-borders",
        type: "line",
        source: "gis-parcels",
        minzoom: 13,
        paint: {
          "line-color": "#088",
          "line-width": 1,
        },
      });

      m.addLayer({
        id: "parcel-fills",
        type: "fill",
        source: "gis-parcels",
        minzoom: 13,
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.12,
        },
      });

      m.addSource("selected-source", {
        type: "geojson",
        data: EMPTY_FC,
      });

      m.addLayer({
        id: "parcel-selected",
        type: "fill",
        source: "selected-source",
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": 0.5,
        },
      });

      m.addLayer({
        id: "parcel-selected-border",
        type: "line",
        source: "selected-source",
        paint: {
          "line-color": ["get", "borderColor"],
          "line-width": 3,
        },
      });

      m.addLayer({
        id: "parcel-hover",
        type: "fill",
        source: "gis-parcels",
        minzoom: 13,
        paint: {
          "fill-color": "#ff8800",
          "fill-opacity": 0.4,
        },
        filter: ["==", ["get", "ll_uuid"], ""],
      });

      // User-location: pulsing dot rendered on top of everything else.
      // Hidden when admin or no location yet.
      m.addSource("user-location", {
        type: "geojson",
        data: EMPTY_FC,
      });
      m.addLayer({
        id: "user-location-halo",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 18,
          "circle-color": "#1d4ed8",
          "circle-opacity": 0.18,
          "circle-stroke-width": 0,
        },
      });
      m.addLayer({
        id: "user-location-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 8,
          "circle-color": "#1d4ed8",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      // Place the dot if we already have a location by the time the map
      // loads (the geolocation request often resolves before tiles).
      const initialLoc = userLocationRef.current;
      if (initialLoc) {
        (m.getSource("user-location") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [initialLoc[1], initialLoc[0]] },
              properties: {},
            },
          ],
        });
      }

      // Client-side tile cache: keep every loaded parcel feature in a
      // flat Map keyed by ll_uuid. The map source becomes a derived view
      // of this cache filtered by viewport, so panning is instant (no
      // re-fetch) and zooming is smooth (no setData blink).
// Two cache layers for progressive subdivision (Regrid-style):
//
//   parcelCache — every parcel ever fetched. Used for the "polygons" layer
//   (z >= PARCEL_ZOOM_MIN). Filtering is bbox-based so a parcel that
//   straddles two tiles is still drawn.
//
//   macroCache — the bbox of each successful macro-tile fetch. A macro-tile
//   is a 0.05° chunk (~5km) loaded at z < PARCEL_ZOOM_MIN so the user sees
//   "we have data for this region" before zooming in. Each macro-tile is
//   a single rect feature rendered as a translucent fill. As soon as the
//   user zooms past PARCEL_ZOOM_MIN the parcel-tiles take over and the
//   macro-tiles for the same area are evicted — the user sees a smooth
//   "subdivision" as parcels appear inside the previously empty rects.
//
//   shared tileLoaded / tileLoading so the same key never fires twice
//   regardless of which layer requested it.
const PARCEL_ZOOM_MIN = 13;
const PARCEL_TILE = 0.01; // ~1.1 km
const MACRO_TILE = 0.05; // ~5.5 km

const parcelCache = new Map<string, GeoJSON.Feature>();
const macroCache = new Map<string, GeoJSON.Feature>();
const tileLoaded = new Set<string>();
const tileLoading = new Set<string>();

const tileKey = (w: number, s: number, e: number, n: number, grid: number) =>
  `${grid}|${w.toFixed(3)}|${s.toFixed(3)}|${e.toFixed(3)}|${n.toFixed(3)}`;

// Tile grid by zoom level:
//   z >= 16 → 0.003° (~330m): finer tiles for small viewports (single-house detail)
//   z >= 13 → 0.01°  (~1.1km): standard parcel detail
//   z >= 10 → 0.05°  (~5.5km): subdivision rectangles (no individual parcels yet)
//   z <  10 → no tiles
function gridForZoom(z: number): number {
  if (z >= 16) return 0.003;
  if (z >= 13) return 0.01;
  if (z >= 10) return 0.05;
  return 0;
}

const tilesForViewport = (w: number, s: number, e: number, n: number, grid: number) => {
  if (grid <= 0) return [];
  const snapMin = (v: number) => Math.floor(v / grid) * grid;
  const snapMax = (v: number) => Math.ceil(v / grid) * grid;
  const tw = snapMin(w);
  const ts = snapMin(s);
  const cols = Math.ceil((snapMax(e) - tw) / grid);
  const rows = Math.ceil((snapMax(n) - ts) / grid);
  const list: { w: number; s: number; e: number; n: number; key: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const minLng = tw + c * grid;
      const minLat = ts + r * grid;
      const maxLng = Math.min(minLng + grid, snapMax(e));
      const maxLat = Math.min(minLat + grid, snapMax(n));
      list.push({
        w: minLng,
        s: minLat,
        e: maxLng,
        n: maxLat,
        key: tileKey(minLng, minLat, maxLng, maxLat, grid),
      });
    }
  }
  return list;
};

// Fast bbox of a geometry. Polygon/MultiPolygon supported.
const geomBbox = (g: GeoJSON.Geometry): [number, number, number, number] | null => {
  if (g.type === "Polygon") {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ring of g.coordinates) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return [minX, minY, maxX, maxY];
  }
  if (g.type === "MultiPolygon") {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const poly of g.coordinates) {
      for (const ring of poly) {
        for (const [x, y] of ring) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return [minX, minY, maxX, maxY];
  }
  return null;
};

// Render the parcel layer: filter parcelCache by viewport using each
// feature's cached bbox.
const renderParcelsToMap = () => {
  if (!map.current) return;
  const b = map.current.getBounds();
  const w = b.getWest();
  const s = b.getSouth();
  const e = b.getEast();
  const n = b.getNorth();
  const features: GeoJSON.Feature[] = [];
  for (const f of Array.from(parcelCache.values())) {
    const props = f.properties as Record<string, unknown> | null;
    let bb = props?._bbox as [number, number, number, number] | undefined;
    if (!bb) {
      if (!f.geometry) continue;
      bb = geomBbox(f.geometry) || undefined;
      if (!bb) continue;
      f.properties = { ...(props || {}), _bbox: bb };
    }
    if (bb[2] < w || bb[0] > e || bb[3] < s || bb[1] > n) continue;
    features.push(f);
  }
  const src = map.current.getSource("gis-parcels") as maplibregl.GeoJSONSource | undefined;
  src?.setData({ type: "FeatureCollection", features });
};

// Render the macro layer: just push the cached rects that intersect the
// viewport. Each rect is a single Polygon feature.
const renderMacroToMap = () => {
  if (!map.current) return;
  const b = map.current.getBounds();
  const w = b.getWest();
  const s = b.getSouth();
  const e = b.getEast();
  const n = b.getNorth();
  const features: GeoJSON.Feature[] = [];
  for (const f of Array.from(macroCache.values())) {
    const props = f.properties as Record<string, unknown> | null;
    let bb = props?._bbox as [number, number, number, number] | undefined;
    if (!bb) continue;
    if (bb[2] < w || bb[0] > e || bb[3] < s || bb[1] > n) continue;
    features.push(f);
  }
  const src = map.current.getSource("gis-macro") as maplibregl.GeoJSONSource | undefined;
  src?.setData({ type: "FeatureCollection", features });
};

const renderAll = () => {
  renderParcelsToMap();
  renderMacroToMap();
};

const addFeaturesToCache = (features: GeoJSON.Feature[]) => {
  for (const f of features) {
    const id = f.properties?.ll_uuid || f.id;
    if (!id) continue;
    const key = String(id);
    if (!parcelCache.has(key)) {
      if (f.geometry) {
        const bb = geomBbox(f.geometry);
        if (bb) f.properties = { ...(f.properties || {}), _bbox: bb };
      }
      parcelCache.set(key, f);
    }
  }
};

// Store a macro-tile as a single rect polygon so it renders as one
// feature regardless of how many real parcels it contains. If the tile
// had no features we still keep the rect (tells the user "we checked,
// nothing here") only if the upstream didn't return a tooLarge flag —
// tooLarge means the chunk is bigger than the API allows, so we don't
// draw a misleading "empty" rect.
const addMacroToCache = (tile: { w: number; s: number; e: number; n: number }, hasData: boolean) => {
  if (!hasData) return;
  const key = tileKey(tile.w, tile.s, tile.e, tile.n, MACRO_TILE);
  if (macroCache.has(key)) return;
  const feature: GeoJSON.Feature = {
    type: "Feature",
    id: key,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [tile.w, tile.s],
        [tile.e, tile.s],
        [tile.e, tile.n],
        [tile.w, tile.n],
        [tile.w, tile.s],
      ]],
    },
    properties: {
      _bbox: [tile.w, tile.s, tile.e, tile.n],
    },
  };
  macroCache.set(key, feature);
};

const loadTile = async (
  tile: { w: number; s: number; e: number; n: number; key: string; grid: number },
  isPrefetch = false
) => {
  if (tileLoaded.has(tile.key) || tileLoading.has(tile.key)) return;
  tileLoading.add(tile.key);
  try {
    const url = `/api/gis/geojson?west=${tile.w.toFixed(3)}&south=${tile.s.toFixed(3)}&east=${tile.e.toFixed(3)}&north=${tile.n.toFixed(3)}`;
    const res = await fetch(url, isPrefetch ? ({ priority: "low" } as RequestInit) : undefined);
    if (!res.ok) return;
    const data = await res.json();
    if (data.tooLarge) {
      // API can't return this chunk. Mark it as loaded so we don't
      // hammer it, and skip the macro rect for it.
      return;
    }
    if (!Array.isArray(data.features)) return;
    if (tile.grid !== MACRO_TILE) {
      addFeaturesToCache(data.features);
    } else {
      addMacroToCache(tile, data.features.length > 0);
    }
    renderAll();
  } catch {
    /* ignore */
  } finally {
    tileLoading.delete(tile.key);
    tileLoaded.add(tile.key);

    // After a real (non-prefetch) load succeeds, warm the four
    // cardinal neighbors in the background so a quick pan in any
    // direction lands on already-cached tiles.
    if (!isPrefetch) {
      const grid = tile.grid;
      const neighbors = [
        { w: tile.w - grid, s: tile.s, e: tile.w, n: tile.n }, // W
        { w: tile.e, s: tile.s, e: tile.e + grid, n: tile.n }, // E
        { w: tile.w, s: tile.s - grid, e: tile.e, n: tile.s }, // S
        { w: tile.w, s: tile.n, e: tile.e, n: tile.n + grid }, // N
      ];
      for (const n of neighbors) {
        const k = tileKey(n.w, n.s, n.e, n.n, grid);
        loadTile({ w: n.w, s: n.s, e: n.e, n: n.n, key: k, grid }, true);
      }
    }
  }
};

const evictOutside = (b: maplibregl.LngLatBounds, pad = 0.05) => {
  const w = b.getWest() - pad;
  const s = b.getSouth() - pad;
  const e = b.getEast() + pad;
  const n = b.getNorth() + pad;
  let removed = 0;
  for (const [key, f] of Array.from(parcelCache.entries())) {
    const props = f.properties as Record<string, unknown> | null;
    let bb = props?._bbox as [number, number, number, number] | undefined;
    if (!bb) {
      if (f.geometry) bb = geomBbox(f.geometry) || undefined;
      if (!bb) continue;
      f.properties = { ...(props || {}), _bbox: bb };
    }
    if (bb[2] < w || bb[0] > e || bb[3] < s || bb[1] > n) {
      parcelCache.delete(key);
      removed++;
    }
  }
  for (const [key, f] of Array.from(macroCache.entries())) {
    const props = f.properties as Record<string, unknown> | null;
    const bb = props?._bbox as [number, number, number, number] | undefined;
    if (!bb) continue;
    if (bb[2] < w || bb[0] > e || bb[3] < s || bb[1] > n) {
      macroCache.delete(key);
      removed++;
    }
  }
  if (removed > 0) renderAll();
};

const loadViewportParcels = async () => {
  if (!map.current) return;
  const z = map.current.getZoom();
  const grid = gridForZoom(z);

  if (grid === 0) {
    setParcelsHint("Acerca el mapa para ver manzanas");
    (map.current.getSource("gis-parcels") as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
    (map.current.getSource("gis-macro") as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
    parcelCache.clear();
    macroCache.clear();
    tileLoaded.clear();
    return;
  }

  const bounds = map.current.getBounds();

  if (grid === MACRO_TILE) {
    // Subdivision level: macro-tiles only.
    setParcelsHint("Acerca el mapa para ver parcelas");
    (map.current.getSource("gis-parcels") as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
    const tiles = tilesForViewport(
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(), MACRO_TILE
    );
    for (const t of tiles) {
      loadTile({ ...t, grid: MACRO_TILE });
    }
    evictOutside(bounds, 0.1);
  } else {
    // Parcel level: real parcels + evict any macros that overlap the
    // current viewport (they'll be replaced by the parcel detail).
    setParcelsHint(null);
    (map.current.getSource("gis-macro") as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
    const tiles = tilesForViewport(
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(), grid
    );
    for (const t of tiles) {
      loadTile({ ...t, grid });
    }
    evictOutside(bounds);
  }
};


      const scheduleParcelLoad = () => {
        if (parcelsDebounceRef.current) clearTimeout(parcelsDebounceRef.current);
        parcelsDebounceRef.current = setTimeout(() => {
          loadViewportParcels();
        }, 200);
      };

      // Update visible features on move/zoom without re-fetching.
      // This makes pan/zoom feel instant: features already cached stay on
      // screen, only the visible subset is recomputed. Throttled with
      // requestAnimationFrame so it doesn't fire more than once per frame.
      let rafToken = 0;
      const refreshVisible = () => {
        if (rafToken) return;
        rafToken = requestAnimationFrame(() => {
          rafToken = 0;
          if (!map.current) return;
          renderAll();
        });
      };

      fetchParcelsRef.current = loadViewportParcels;

      const enrichParcelFromClick = async (
        props: Record<string, unknown>,
        geom: GeoJSON.Geometry,
        lng: number,
        lat: number
      ) => {
        // Fast-path: prefer OBJECTID-based externalId when present.
        // objectIds= query is ~30x faster than WHERE PARCEL='...' (0.3s vs 9s)
        // for any county whose catalog has extraOutFields: ["OBJECTID"].
        const objectId = props.object_id;
        const provider = String(props.provider || "");
        let llUuid = String(props.ll_uuid || "");
        if (objectId != null && provider) {
          llUuid = `${provider}:O:${objectId}`;
        }
        const basicParcel: Parcel = {
          id: llUuid || `gis-${props.parcel_id || "unknown"}`,
          address: String(props.address || props.headline || "Sin direccion"),
          ownerName: props.owner ? String(props.owner) : undefined,
          city: props.city ? String(props.city) : undefined,
          state: props.state ? String(props.state) : "FL",
          zipCode: props.zipCode ? String(props.zipCode) : undefined,
          ownerOccupied: props.owner_occupied !== null && props.owner_occupied !== undefined ? Boolean(props.owner_occupied) : undefined,
          status: "AVAILABLE",
          geometry: JSON.stringify(geom),
          metadata: JSON.stringify({
            source: "gis",
            regrid_id: llUuid,
            owner: props.owner,
            parcel_id: props.parcel_id,
            property_class: props.property_class,
            acreage: props.acreage,
            land_value: props.land_value,
            building_value: props.building_value,
            city: props.city,
            state: props.state || "FL",
            zipCode: props.zipCode,
          }),
        };

        selectedGeometryRef.current = geom;
        const selectedColor = "#f48221";
        (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData(
          {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature" as const,
                geometry: geom,
                properties: {
                  fillColor: selectedColor,
                  borderColor: selectedColor,
                },
              },
            ],
          }
        );
        setSelectedParcel(basicParcel);
        setIsFetchingParcel(true);

        try {
          // Single fetch: /api/parcels/[id] handles DB lookup with
          // GIS fallback for external ids (provider:parcelId or
          // provider:O:objectId for fast-path).
          // For features with no llUuid we use a point query instead.
          let fullParcel: Parcel | null = null;

          if (llUuid) {
            const res = await fetch(
              `/api/parcels/${encodeURIComponent(llUuid)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data?.id) {
                fullParcel = {
                  ...basicParcel,
                  ...data,
                  id: basicParcel.id,
                  externalId: data.externalId,
                  address:
                    data.address ||
                    basicParcel.address,
                  ownerName:
                    data.ownerName ||
                    basicParcel.ownerName,
                  geometry: basicParcel.geometry,
                  metadata: data.metadata
                    ? typeof data.metadata === "string"
                      ? data.metadata
                      : JSON.stringify(data.metadata)
                    : basicParcel.metadata,
                };
              }
            }
          }

          // Point-query fallback only if feature has no llUuid (rare)
          if (!fullParcel && !llUuid) {
            const pointRes = await fetch(
              `/api/gis/parcels?lat=${lat}&lng=${lng}`
            );
            if (pointRes.ok) {
              const list = await pointRes.json();
              if (Array.isArray(list) && list[0]) {
                fullParcel = {
                  ...list[0],
                  geometry: list[0].geometry || basicParcel.geometry,
                };
              }
            }
          }

          if (fullParcel && fullParcel.id) {
            setSelectedParcel(fullParcel);
            const updatedTagColor = getTagColor(fullParcel.parcelTags);
            const selColor =
              fullParcel.status === "LEAD"
                ? "#22C55E"
                : fullParcel.status === "CUSTOMER"
                  ? "#10b981"
                  : updatedTagColor || "#ef4444";
            if (selectedGeometryRef.current) {
              (map.current?.getSource(
                "selected-source"
              ) as maplibregl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature" as const,
                    geometry: selectedGeometryRef.current,
                    properties: {
                      fillColor: selColor,
                      borderColor: selColor,
                    },
                  },
                ],
              });
            }
            fetchMarkersRef.current?.();
          }
        } catch {
          /* keep basic parcel */
        } finally {
          setIsFetchingParcel(false);
        }
      };

      m.on("mousemove", "parcel-fills", (e) => {
        if (!e.features?.[0]) return;
        m.getCanvas().style.cursor = "pointer";
        const llUuid = e.features[0].properties?.ll_uuid;
        m.setFilter("parcel-hover", [
          "==",
          ["get", "ll_uuid"],
          llUuid || "",
        ]);
      });

      m.on("mouseleave", "parcel-fills", () => {
        m.getCanvas().style.cursor = "";
        m.setFilter("parcel-hover", ["==", ["get", "ll_uuid"], ""]);
      });

      m.on("click", async (e) => {
        const features = m.queryRenderedFeatures(e.point, {
          layers: ["parcel-status-circles", "parcel-status-triangles", "parcel-fills"],
        });

        if (features.length === 0) {
          setSelectedParcel(null);
          (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
          return;
        }

        quickTagActiveRef.current = false;
        const pointFeature = features.find(f => f.layer.id.startsWith("parcel-status-"));
        const fillFeature = features.find(f => f.layer.id === "parcel-fills");

        if (pointFeature && pointFeature.properties?.id) {
          const id = pointFeature.properties.id;
          const props = fillFeature ? fillFeature.properties || {} : {};
          const geom = fillFeature ? (fillFeature.geometry || (fillFeature as unknown as { geometry: GeoJSON.Geometry }).geometry) : pointFeature.geometry;
          
          // Force DB lookup by passing the DB id as ll_uuid and removing object_id
          const mergedProps = { ...props, ll_uuid: id, object_id: null };
          
          await enrichParcelFromClick(mergedProps as Record<string, unknown>, geom as GeoJSON.Geometry, e.lngLat.lng, e.lngLat.lat);
        } else if (fillFeature) {
          const props = fillFeature.properties || {};
          const geom = fillFeature.geometry || (fillFeature as unknown as { geometry: GeoJSON.Geometry }).geometry;
          await enrichParcelFromClick(props as Record<string, unknown>, geom as GeoJSON.Geometry, e.lngLat.lng, e.lngLat.lat);
        }
      });

      m.addSource("parcel-status-points", {
        type: "geojson",
        data: EMPTY_FC,
      });

      m.addLayer({
        id: "parcel-status-circles",
        type: "circle",
        source: "parcel-status-points",
        filter: ["!=", ["get", "hasHistory"], true],
        minzoom: 8,
        paint: {
          "circle-radius": 8,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.9,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      m.addLayer({
        id: "parcel-status-triangles",
        type: "symbol",
        source: "parcel-status-points",
        filter: ["==", ["get", "hasHistory"], true],
        minzoom: 8,
        layout: {
          "text-field": "▲",
          "text-size": 22,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": ["get", "color"],
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      const fetchStatusMarkers = async () => {
        if (!map.current) return;
        const bounds = map.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        try {
          const res = await fetch(
            `/api/parcels/in-viewport?swlat=${sw.lat}&swlng=${sw.lng}&nelat=${ne.lat}&nelng=${ne.lng}`
          );
          const parcels: {
            id: string;
            status: string;
            parcelTags?: string;
            coordinates: [number, number];
            hasHistory?: boolean;
          }[] = await res.json();
          const features = parcels.map((p) => {
            let dotColor =
              p.status === "LEAD"
                ? "#22C55E"
                : p.status === "CUSTOMER"
                  ? "#10b981"
                  : "#EF4444";
            if (p.status !== "LEAD" && p.status !== "CUSTOMER" && p.parcelTags) {
              try {
                const tags = JSON.parse(p.parcelTags);
                if (Array.isArray(tags) && tags.length > 0)
                  dotColor = tags[0].color;
              } catch {
                /* */
              }
            }
            return {
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: p.coordinates,
              },
              properties: {
                id: p.id,
                color: dotColor,
                hasHistory: !!p.hasHistory,
              },
            };
          });
          (map.current?.getSource(
            "parcel-status-points"
          ) as maplibregl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features,
          });
        } catch {
          /* */
        }
      };

      fetchMarkersRef.current = fetchStatusMarkers;

      m.on("move", () => {
        // Instant visible-features filter — no re-fetch, just hide/show
        // cached features as the viewport pans. Runs on every frame.
        refreshVisible();
      });
      m.on("moveend", () => {
        fetchStatusMarkers();
        scheduleParcelLoad();
        if (onMapMove) {
          const c = m.getCenter();
          onMapMove([c.lat, c.lng], m.getZoom());
        }
      });
      m.on("zoom", () => {
        refreshVisible();
      });
      m.on("zoomend", () => {
        fetchStatusMarkers();
        scheduleParcelLoad();
        if (onMapMove) {
          const c = m.getCenter();
          onMapMove([c.lat, c.lng], m.getZoom());
        }
      });

      fetchStatusMarkers();
      scheduleParcelLoad();

      // Pre-load macro-tiles for a ~30km radius around the map center so
      // the user can pan/zoom and the subdivision rectangles are already
      // cached. isPrefetch=true keeps these off the critical path so the
      // visible viewport tiles still render first.
      const center = m.getCenter();
      const preLoadRadiusDeg = 0.3; // ~33km at 28°N
      const preLoadTiles = tilesForViewport(
        center.lng - preLoadRadiusDeg,
        center.lat - preLoadRadiusDeg,
        center.lng + preLoadRadiusDeg,
        center.lat + preLoadRadiusDeg,
        MACRO_TILE
      );
      for (const t of preLoadTiles) {
        loadTile({ ...t, grid: MACRO_TILE }, true);
      }

      map.current = m;
      setMapReady(true);

      if (centerRef.current) {
        m.flyTo({
          center: [centerRef.current[1], centerRef.current[0]],
          zoom: 18,
        });
      }
    });
  }, [mapReady]);

  useEffect(() => {
    if (!center || !map.current) return;
    const doFly = () => {
      if (!center || !map.current) return;
      map.current.flyTo({ center: [center[1], center[0]], zoom: 18 });
      centerRef.current = center;
      setTimeout(() => fetchParcelsRef.current?.(), 500);
    };
    if (map.current.isStyleLoaded()) {
      doFly();
    } else {
      map.current.once("style.load", doFly);
    }
  }, [center]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapTimeout.current) clearTimeout(mapTimeout.current);
      if (parcelsDebounceRef.current) clearTimeout(parcelsDebounceRef.current);
      parcelsAbortRef.current?.abort();
      if (map.current) {
        map.current.remove();
        map.current = null;
        initializedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickTagApplied = useCallback(() => {
    quickTagActiveRef.current = true;
    (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData(
      EMPTY_FC
    );
    selectedGeometryRef.current = null;
    fetchMarkersRef.current?.();
  }, []);

  const handleClaim = async (parcelId: string) => {
    const res = await fetch(
      `/api/parcels/${encodeURIComponent(parcelId)}/claim`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedParcel?.address,
          ownerName: selectedParcel?.ownerName,
          geometry: selectedParcel?.geometry,
          metadata: selectedParcel?.metadata,
          externalId: selectedParcel?.externalId,
        }),
      }
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Error al reclamar parcela" }));
      throw new Error(err.error);
    }
    const claimed = await res.json();
    setSelectedParcel(claimed);
    return claimed;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p>{t.map.loading}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Si tarda demasiado, verifica tu conexion
              </p>
            </div>
          </div>
        </div>
      )}
      {mapReady && parcelsHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-surface/95 border border-outline-variant/40 text-xs text-on-surface shadow-lg">
          {parcelsHint}
        </div>
      )}
      {mapReady && !isAdmin && (
        <button
          type="button"
          onClick={handleFlyToUser}
          aria-label="Ubicarme"
          title={
            locationStatus === "denied"
              ? "Ubicacion bloqueada. Activala en tu navegador."
              : locationStatus === "requesting"
                ? "Solicitando ubicacion..."
                : "Ubicarme"
          }
          className="absolute right-4 bottom-4 z-10 w-11 h-11 rounded-full bg-white border border-outline-variant shadow-lg flex items-center justify-center hover:bg-surface-container-low transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={locationStatus === "denied" ? "#ef4444" : "#1d4ed8"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}
      <ParcelSheet
        isFetching={isFetchingParcel}
        parcel={selectedParcel}
        onClose={() => {
          setSelectedParcel(null);
          quickTagActiveRef.current = false;
          selectedGeometryRef.current = null;
          (map.current?.getSource(
            "selected-source"
          ) as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
        }}
        onClaim={handleClaim}
        onVisitStarted={() => {
          setSelectedParcel(null);
        }}
        onParcelUpdated={(updated) => {
          setSelectedParcel(updated);
          if (quickTagActiveRef.current) return;
          try {
            const tags = updated.parcelTags
              ? JSON.parse(updated.parcelTags)
              : [];
            const tagColor = tags.length > 0 ? tags[0].color : null;
            const color = tagColor || "#f48221";
            if (map.current && selectedGeometryRef.current) {
              (map.current.getSource(
                "selected-source"
              ) as maplibregl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature" as const,
                    geometry: selectedGeometryRef.current!,
                    properties: {
                      fillColor: color,
                      borderColor: color,
                    },
                  },
                ],
              });
            }
          } catch {
            /* */
          }
        }}
        onQuickTagApplied={handleQuickTagApplied}
        userRole={session?.user?.role || ""}
        userId={session?.user?.id || ""}
      />

    </div>
  );
}
