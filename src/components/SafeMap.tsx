import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { Hotspot, SafeHaven } from "@/lib/threat-analysis";

// Fix default icon paths for bundlers
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  user: { lat: number; lng: number };
  hotspots: Hotspot[];
  havens: SafeHaven[];
  route?: [number, number][];
  destination?: SafeHaven;
}

export function SafeMap({ user, hotspots, havens, route, destination }: Props) {
  return (
    <MapContainer
      center={[user.lat, user.lng]}
      zoom={15}
      style={{ height: "100%", width: "100%", minHeight: 360 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[user.lat, user.lng]}>
        <Popup>You are here</Popup>
      </Marker>
      {hotspots.map((h, i) => (
        <Circle
          key={i}
          center={[h.lat, h.lng]}
          radius={120 + h.intensity * 180}
          pathOptions={{
            color: h.intensity > 0.7 ? "#ef4444" : h.intensity > 0.5 ? "#f59e0b" : "#fbbf24",
            fillOpacity: 0.25,
            weight: 1,
          }}
        >
          <Popup>{h.label} — risk {Math.round(h.intensity * 100)}%</Popup>
        </Circle>
      ))}
      {havens.map((h, i) => (
        <Marker key={i} position={[h.lat, h.lng]}>
          <Popup>
            <strong>{h.name}</strong>
            <br />
            {h.type}
          </Popup>
        </Marker>
      ))}
      {route && route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "#34d399", weight: 5, opacity: 0.9 }} />
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>Safe destination: {destination.name}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
