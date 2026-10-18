"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

function MapLoading() {
  const { t } = useLocale();
  return (
    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
      {t.map.loading}
    </div>
  );
}

const DynamicMap = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <MapLoading />,
});

interface SearchResult {
  id: string;
  address: string;
  ll_uuid?: string;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
}

const COUNTY_BOUNDS: Array<{ name: string; bbox: [number, number, number, number] }> = [
  { name: "Orange County", bbox: [-81.68, 28.34, -80.98, 28.79] },
  { name: "Osceola County", bbox: [-81.97, 27.63, -80.85, 28.58] },
  { name: "Hillsborough County", bbox: [-82.85, 27.57, -82.05, 28.17] },
  { name: "Pinellas County", bbox: [-82.91, 27.61, -82.59, 28.17] },
  { name: "Polk County", bbox: [-82.10, 27.64, -81.17, 28.36] },
  { name: "Lake County", bbox: [-82.05, 28.38, -81.30, 29.35] },
  { name: "Volusia County", bbox: [-81.66, 28.61, -80.84, 29.43] },
  { name: "Manatee County", bbox: [-82.91, 27.21, -82.05, 27.78] },
  { name: "Miami-Dade County", bbox: [-80.87, 25.13, -80.12, 25.97] },
  { name: "Broward County", bbox: [-80.88, 25.95, -80.07, 26.34] },
  { name: "Palm Beach County", bbox: [-80.91, 26.31, -80.04, 26.97] },
  { name: "Lee County", bbox: [-82.46, 26.32, -81.80, 26.79] },
  { name: "Collier County", bbox: [-81.92, 25.79, -81.13, 26.39] },
  { name: "Martin County", bbox: [-80.88, 26.86, -80.03, 27.32] },
  { name: "Nassau County", bbox: [-82.04, 30.27, -81.41, 30.83] },
];

function getCountyNameForPoint(lat: number, lng: number): string {
  const match = COUNTY_BOUNDS.find(
    (c) => lng >= c.bbox[0] && lng <= c.bbox[2] && lat >= c.bbox[1] && lat <= c.bbox[3]
  );
  return match ? match.name : "Florida";
}

export default function MapPage() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const highlightId =
    searchParams.get("highlight") || searchParams.get("parcelId");
  const autoOpen =
    searchParams.get("autoOpen") === "true" || !!searchParams.get("parcelId");

  const [autoOpenParcel, setAutoOpenParcel] = useState<{
    id: string;
    address: string;
  } | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // State for dynamic search placeholder
  const [currentCity, setCurrentCity] = useState("Orange County");
  const [isFar, setIsFar] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (autoOpen && highlightId) {
      fetch(`/api/parcels/${encodeURIComponent(highlightId)}`)
        .then(async (r) => {
          if (!r.ok) throw new Error("Not ok");
          return r.json();
        })
        .then((data) => {
          if (data && data.geometry) {
            try {
              const geom = JSON.parse(data.geometry);
              if (geom.coordinates?.[0]) {
                const coords = geom.coordinates[0];
                let sumLat = 0,
                  sumLng = 0,
                  count = 0;
                coords.forEach((c: number[]) => {
                  if (c.length >= 2) {
                    sumLat += c[1];
                    sumLng += c[0];
                    count++;
                  }
                });
                if (count > 0) {
                  setMapCenter([sumLat / count, sumLng / count]);
                  setAutoOpenParcel({
                    id: highlightId,
                    address: data.address || "",
                  });
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [autoOpen, highlightId]);


  const handleMapMove = useCallback(
    (center: [number, number], zoom: number) => {
      if (zoom < 12) {
        setIsFar(true);
      } else {
        setIsFar(false);
        const county = getCountyNameForPoint(center[0], center[1]);
        setCurrentCity(county);
      }
    },
    [],
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const res = await fetch(
        `/api/gis/search?query=${encodeURIComponent(query)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        window.dispatchEvent(
          new CustomEvent("show-global-toast", {
            detail: {
              type: "error",
              title: t.notifier.mapErrorTitle,
              body: t.notifier.mapErrorBody,
            },
          }),
        );
      } else {
        const features = data.results?.features || [];
        if (features.length === 0) {
          window.dispatchEvent(
            new CustomEvent("show-global-toast", {
              detail: {
                type: "error",
                title: t.notifier.mapErrorTitle,
                body: t.notifier.mapErrorBody,
              },
            }),
          );
        } else {
          const items: SearchResult[] = features.map(
            (feature: {
              properties?: { id?: string; ll_uuid?: string; address?: string };
              geometry?: SearchResult["geometry"];
            }) => ({
              id: feature.properties?.id || feature.properties?.ll_uuid || "",
              address: feature.properties?.address || "",
              ll_uuid: feature.properties?.ll_uuid,
              geometry: feature.geometry,
            }),
          );
          setResults(items);
        }
      }
    } catch {
      window.dispatchEvent(
        new CustomEvent("show-global-toast", {
          detail: {
            type: "error",
            title: t.notifier.mapErrorTitle,
            body: t.notifier.mapErrorBody,
          },
        }),
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.geometry) {
      const geo = result.geometry;
      if (geo.type === "Polygon" && geo.coordinates?.[0]?.[0]) {
        const [lng, lat] = geo.coordinates[0][0];
        setMapCenter([lat, lng]);

        if (result.id && result.address) {
          setAutoOpenParcel({ id: result.id, address: result.address });
        }
      }
    }
    setQuery(result.address || "");
    setResults([]);
  };

  const searchPlaceholder = isFar
    ? t.placeholders.searchZoomIn
    : (t.placeholders.searchInCity as string).replace("{city}", currentCity);

  return (
    <div className="flex flex-col h-[75vh] w-full relative rounded-2xl overflow-hidden shadow-xl border border-outline-variant/30">
      <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-10 w-auto sm:w-[450px] space-y-2">
        <form onSubmit={handleSearch} className="relative">
          <div className="bg-surface/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-outline-variant/30 flex items-center gap-3">
            <Search className="w-5 h-5 text-primary" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) setResults([]);
              }}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant outline-none"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t.common.search
              )}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm shadow-md">
            {searchError}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-surface/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-outline-variant/30 max-h-[40vh] overflow-y-auto custom-scrollbar">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left p-3 border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low flex items-center gap-3 transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-on-surface font-medium truncate">
                  {result.address}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-0">
        <DynamicMap
          center={mapCenter}
          autoOpenId={autoOpenParcel?.id || null}
          onMapMove={handleMapMove}
        />
      </div>
    </div>
  );
}
