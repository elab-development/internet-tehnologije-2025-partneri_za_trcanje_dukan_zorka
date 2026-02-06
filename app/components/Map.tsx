'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Ikone za mapu
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Pomocna komponenta koja slusa klikove na mapi
function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}


interface MapProps {
  trke?: any[]; 
  onMapClick?: (lat: number, lng: number) => void; 
  interactive?: boolean; 
}

export default function Map({ trke = [], onMapClick, interactive = true }: MapProps) {
  
  // Fix za Leaflet ikone 
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer 
      center={[44.7866, 20.4489]} 
      zoom={13} 
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
      // Ako nije interaktivna (npr. nisi ulogovan), gasimo zumiranje i pomeranje
      dragging={interactive}
      zoomControl={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {interactive && <MapEvents onMapClick={onMapClick} />}

      {trke.map((trka) => (
        <Marker key={trka.id} position={[trka.lokacijaLat, trka.lokacijaLng]} icon={icon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-lg">{trka.naziv}</h3>
              <p>{new Date(trka.vremePocetka).toLocaleDateString()}</p>
              <p>📍 {trka.planiranaDistancaKm} km</p>
              <p className="text-sm text-gray-500">Org: {trka.organizator?.imePrezime}</p>
              <button className="bg-blue-500 text-white px-2 py-1 rounded mt-2 text-xs">
                Pridruži se
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}