'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import markerIcon from '../images/icon.png';

const markerIconUrl = typeof markerIcon === 'string' ? markerIcon : markerIcon.src;

const raceIcon = L.icon({
  iconUrl: markerIconUrl,
  iconSize: [104, 58],
  iconAnchor: [42, 46],
  popupAnchor: [0, -46],
  className: 'race-marker',
});

const draftIcon = L.icon({
  iconUrl: markerIconUrl,
  iconSize: [104, 58],
  iconAnchor: [52, 58],
  popupAnchor: [0, -58],
  className: 'draft-marker',
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
  draftLocation?: { lat: number; lng: number } | null;
}

export default function Map({ trke = [], onMapClick, interactive = true, draftLocation }: MapProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) setCurrentUser(JSON.parse(user));
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
        alert("Zahtev je poslat! Organizator treba da potvrdi.");
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

      {draftLocation && (
        <Marker position={[draftLocation.lat, draftLocation.lng]} icon={draftIcon}>
          <Popup>
            <div className="text-center text-sm text-gray-700">
              📍 Nova trka ovde
            </div>
          </Popup>
        </Marker>
      )}

      {trke.map((trka) => (
        <Marker key={trka.id} position={[trka.lokacijaLat, trka.lokacijaLng]} icon={raceIcon}>
          <Popup>
            <div className="text-center min-w-150px glass-popup">
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
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
          border-radius: 16px;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
        }
        .leaflet-popup-content {
          margin: 12px 14px;
        }
        .glass-popup {
          text-align: center;
        }
      `}</style>
    </MapContainer>
  );
}
