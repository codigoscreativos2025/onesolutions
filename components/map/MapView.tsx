"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const parcels = [
  {
    id: "parcel-1",
    positions: [
      [28.385, -81.365],
      [28.385, -81.364],
      [28.384, -81.364],
      [28.384, -81.365],
    ] as [number, number][],
    color: "#ba1a1a",
  },
  {
    id: "parcel-2",
    positions: [
      [28.386, -81.363],
      [28.386, -81.362],
      [28.385, -81.362],
      [28.385, -81.363],
    ] as [number, number][],
    color: "#fb7800",
  },
  {
    id: "parcel-3",
    positions: [
      [28.384, -81.367],
      [28.384, -81.366],
      [28.383, -81.366],
      [28.383, -81.367],
    ] as [number, number][],
    color: "#006e00",
  },
];

export default function MapView() {
  const position: [number, number] = [28.385, -81.365];

  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
      />
      {parcels.map((parcel) => (
        <Polygon
          key={parcel.id}
          positions={parcel.positions}
          pathOptions={{
            color: parcel.color,
            fillColor: parcel.color,
            fillOpacity: 0.4,
            weight: 2,
          }}
          eventHandlers={{
            click: () => {
              console.log("Parcel clicked", parcel.id);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
