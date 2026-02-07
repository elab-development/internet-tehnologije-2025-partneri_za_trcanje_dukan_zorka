'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';


const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapRevalidator({ interactive }: { interactive: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize(); 
    }, 500);
    return () => clearTimeout(timer);
  }, [interactive, map]);

  return null;
}

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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) setCurrentUser(JSON.parse(user));
    
   
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  
  const handleJoin = async (trkaId: number) => {
    if (!currentUser) return alert("Moraš biti ulogovan!");

    try {
      const res = await fetch('/api/races/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trkaId, korisnikId: currentUser.id })
      });

      if (res.ok) {
        alert("Uspešno si se pridružio trci! 🏃‍♂️");
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "Greška.");
      }
    } catch (err) { alert("Greška na serveru."); }
  };

  return (
    <MapContainer 
      center={[44.7866, 20.4489]} 
      zoom={13} 
      style={{ height: "100%", width: "100%" }}
      dragging={true} 
      zoomControl={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapRevalidator interactive={interactive} />
      
      {interactive && <MapEvents onMapClick={onMapClick} />}

      {trke.map((trka) => (
        <Marker key={trka.id} position={[trka.lokacijaLat, trka.lokacijaLng]} icon={icon}>
          <Popup>
            <div className="text-center min-w-[150px]">
              <h3 className="font-bold text-lg text-blue-600">{trka.naziv}</h3>
              <div className="text-sm text-gray-600 my-2">
                <p>📅 {new Date(trka.vremePocetka).toLocaleDateString()} u {new Date(trka.vremePocetka).toLocaleTimeString().slice(0,5)}h</p>
                <p>📏 Distanca: {trka.planiranaDistancaKm} km</p>
                <p>👤 Org: {trka.organizator?.imePrezime}</p>
                
                <p className="font-semibold mt-1">
                  Prijavljeno: {trka.ucesnici ? trka.ucesnici.length : 0}
                </p>
              </div>

              <button 
                onClick={() => handleJoin(trka.id)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold transition w-full mt-1"
              >
                Pridruži se +
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}