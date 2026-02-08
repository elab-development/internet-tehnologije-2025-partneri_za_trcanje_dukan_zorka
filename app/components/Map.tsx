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
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  const openProfile = async (userId?: number | string | null) => {
    const numericId = typeof userId === 'string' ? parseInt(userId) : userId ?? null;
    if (!numericId || Number.isNaN(numericId)) {
      setProfileOpen(true);
      setProfileLoading(false);
      setProfileError('Neispravan ID korisnika.');
      setProfileData(null);
      return;
    }
    try {
      setProfileOpen(true);
      setProfileLoading(true);
      setProfileError(null);
      const res = await fetch(`/api/users/${numericId}`);
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.message || 'Greška pri učitavanju profila.');
        setProfileData(null);
      } else {
        setProfileData(data);
      }
    } catch {
      setProfileError('Greška pri učitavanju profila.');
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  
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
      className="map-root"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapRevalidator interactive={interactive} />
      
      {interactive && !profileOpen && <MapEvents onMapClick={onMapClick} />}

      {draftLocation && (
        <Marker position={[draftLocation.lat, draftLocation.lng]} icon={draftIcon}>
          <Popup>
            <div className="text-center text-sm text-gray-700">
              📍 Nova trka ovde
            </div>
          </Popup>
        </Marker>
      )}

      {trke.map((trka) => {
        const isPast = new Date(trka.vremePocetka) < new Date();
        return (
        <Marker key={trka.id} position={[trka.lokacijaLat, trka.lokacijaLng]} icon={raceIcon}>
          <Popup>
            <div className="text-center min-w-150px glass-popup">
              <h3 className="font-bold text-lg text-blue-600">{trka.naziv}</h3>
              <div className="text-sm text-gray-600 my-2">
                <p>📅 {new Date(trka.vremePocetka).toLocaleDateString()} u {new Date(trka.vremePocetka).toLocaleTimeString().slice(0,5)}h</p>
                <p>📏 Distanca: {trka.planiranaDistancaKm} km</p>
                <p>
                  👤 Org:{' '}
                  <button
                    onClick={() => openProfile(trka.organizator?.id ?? trka.organizatorId)}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {trka.organizator?.imePrezime || 'Nepoznato'}
                  </button>
                </p>
                
                <p className="font-semibold mt-1">
                  Prijavljeno: {trka.ucesnici ? trka.ucesnici.length : 0}
                </p>
              </div>

              <button 
                onClick={() => !isPast && handleJoin(trka.id)}
                disabled={isPast}
                className={`px-4 py-2 rounded-full text-sm font-bold transition w-full mt-1 ${
                  isPast
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isPast ? 'Trka završena' : 'Pridruži se +'}
              </button>
            </div>
          </Popup>
        </Marker>
      )})}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 pointer-events-auto"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setProfileOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl text-gray-700 relative"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setProfileOpen(false);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              aria-label="Zatvori"
            >
              ✕
            </button>

            {profileLoading && (
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
              </div>
            )}

            {!profileLoading && profileError && (
              <div className="text-sm text-red-600">{profileError}</div>
            )}

            {!profileLoading && profileData && (
              <div className="flex flex-col items-center text-center gap-3">
                {profileData.slikaUrl ? (
                  <img
                    src={profileData.slikaUrl}
                    alt={profileData.imePrezime}
                    className="h-16 w-16 rounded-full object-cover border border-white/80 shadow"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{profileData.imePrezime}</h3>
                  <p className="text-xs text-gray-500">{profileData.uloga}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {profileData.bio || 'Korisnik nema biografiju.'}
                </p>
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/70 border border-white/80 py-2">
                    <p className="text-xs text-gray-500">Organizuje</p>
                    <p className="font-bold">{profileData.organizovaneTrkeCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 border border-white/80 py-2">
                    <p className="text-xs text-gray-500">Ukupno km</p>
                    <p className="font-bold">{profileData.ukupnoPredjeniKm ?? 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
