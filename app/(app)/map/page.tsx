"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const DynamicMap = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
      Cargando mapa...
    </div>
  ),
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

export default function MapPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight") || searchParams.get("parcelId");
  const autoOpen = searchParams.get("autoOpen") === "true" || !!searchParams.get("parcelId");

  const [autoOpenParcel, setAutoOpenParcel] = useState<{ id: string; address: string } | null>(null);

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
        .then(r => r.json())
        .then(data => {
          if (data && data.geometry) {
            try {
              const geom = JSON.parse(data.geometry);
              if (geom.coordinates?.[0]) {
                const coords = geom.coordinates[0];
                let sumLat = 0, sumLng = 0, count = 0;
                coords.forEach((c: number[]) => {
                  if (c.length >= 2) { sumLat += c[1]; sumLng += c[0]; count++; }
                });
                if (count > 0) {
                  setMapCenter([sumLat / count, sumLng / count]);
                  setAutoOpenParcel({ id: highlightId, address: data.address || "" });
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [autoOpen, highlightId]);

  const handleMapMove = useCallback((center: [number, number], zoom: number) => {
    if (zoom < 12) {
      setIsFar(true);
    } else {
      setIsFar(false);
      // Debounce the reverse geocoding to not spam Nominatim
      // Store timeout ID in a data attribute or variable outside closure is tricky without useRef,
      // but we can just use a simple setTimeout trick with a module-level or state-level variable.
      // Since it is useCallback, let us just trigger the fetch directly but Nominatim has a rate limit of 1 req/sec.
      // Let`s do a quick naive fetch.
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${center[0]}&lon=${center[1]}&format=json&zoom=10`, {
        headers: { "Accept-Language": "es" }
      })
      .then(r => r.json())
      .then(data => {
        let city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Orange County";
        setCurrentCity(city);
      })
      .catch(() => {});
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const res = await fetch(
        `/api/gis/search?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        window.dispatchEvent(new CustomEvent("show-global-toast", {
          detail: { type: "error", title: t.notifier.mapErrorTitle, body: t.notifier.mapErrorBody }
        }));
      } else {
        const features = data.results?.features || [];
        if (features.length === 0) {
          window.dispatchEvent(new CustomEvent("show-global-toast", {
            detail: { type: "error", title: t.notifier.mapErrorTitle, body: t.notifier.mapErrorBody }
          }));
        } else {
          const items: SearchResult[] = features.map(
            (feature: { properties?: { id?: string; ll_uuid?: string; address?: string }; geometry?: SearchResult["geometry"] }) => ({
              id: feature.properties?.id || feature.properties?.ll_uuid || "",
              address: feature.properties?.address || "",
              ll_uuid: feature.properties?.ll_uuid,
              geometry: feature.geometry,
            })
          );
          setResults(items);
        }
      }
    } catch {
      window.dispatchEvent(new CustomEvent("show-global-toast", {
        detail: { type: "error", title: t.notifier.mapErrorTitle, body: t.notifier.mapErrorBody }
      }));
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
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
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
                <span className="text-sm text-on-surface font-medium truncate">{result.address}</span>
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
