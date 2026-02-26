'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import RacePreviewCard from './RacePreviewCard';
import blackIconImg from '../images/icon.png';
import blueIconImg from '../images/blueIcon.png';
import blackFinishImg from '../images/black-finish.png';
import blueFinishImg from '../images/blue-finish.png';
import { withCsrfHeader } from '@/lib/csrf-client';

type ParticipationStatus = 'NA_CEKANJU' | 'PRIHVACENO' | 'ODBIJENO' | null;

type RaceMapItem = {
  id: number;
  naziv: string;
  vremePocetka: string;
  lokacijaLat: number;
  lokacijaLng: number;
  planiranaDistancaKm: number;
  organizatorId?: number;
  tezina?: string;
  status?: string;
  organizator?: {
    id?: number;
    imePrezime?: string;
    slikaUrl?: string | null;
    bio?: string | null;
  } | null;
  _count?: { ucesnici: number };
  mojStatusPrijave?: ParticipationStatus;
};

type PublicProfileData = {
  id: number;
  imePrezime: string;
  slikaUrl?: string | null;
  uloga: string;
  bio?: string | null;
  organizovaneTrkeCount: number;
  ukupnoPredjeniKm?: number;
};

const getIconUrl = (imgImport: string | StaticImageData) =>
  typeof imgImport === 'string' ? imgImport : imgImport.src;

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
  trke?: RaceMapItem[];
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  draftLocation?: { lat: number; lng: number } | null;
  currentUser?: { id: number } | null;
}

export default function Map({ trke = [], onMapClick, interactive = true, draftLocation, currentUser }: MapProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const applyTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setIsDarkMode(storedTheme === 'dark');
        return;
      }
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    applyTheme();
    window.addEventListener('theme-change', applyTheme);
    window.addEventListener('storage', applyTheme);
    return () => {
      window.removeEventListener('theme-change', applyTheme);
      window.removeEventListener('storage', applyTheme);
    };
  }, []);

  const { raceIcon, draftIcon, finishIcon } = useMemo(() => {
    const baseUrl = isDarkMode ? getIconUrl(blueIconImg) : getIconUrl(blackIconImg);
    const finishUrl = isDarkMode ? getIconUrl(blueFinishImg) : getIconUrl(blackFinishImg);

    return {
      raceIcon: L.icon({
        iconUrl: baseUrl,
        iconSize: [124, 72],
        iconAnchor: [62, 72],
        popupAnchor: [0, -72],
        className: 'race-marker',
      }),
      draftIcon: L.icon({
        iconUrl: baseUrl,
        iconSize: [124, 72],
        iconAnchor: [62, 72],
        popupAnchor: [0, -72],
        className: 'draft-marker',
      }),
      finishIcon: L.icon({
        iconUrl: finishUrl,
        iconSize: [52, 58],
        iconAnchor: [26, 58],
        popupAnchor: [0, -58],
        className: 'finish-marker',
      }),
    };
  }, [isDarkMode]);


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
      const data = (await res.json()) as PublicProfileData | { message?: string };
      if (!res.ok) {
        setProfileError(('message' in data && data.message) || 'Greška pri učitavanju profila.');
        setProfileData(null);
      } else {
        setProfileData(data as PublicProfileData);
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
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ trkaId }),
        credentials: 'include'
      });

      if (res.ok) {
        alert("Zahtev je poslat! Organizator treba da potvrdi.");
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "Greška.");
      }
    } catch { alert("Greška na serveru."); }
  };

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const mapThemeClass = isDarkMode ? 'map-theme-dark' : 'map-theme-light';
  const miniProfileModalClass = isDarkMode
    ? 'w-full max-w-sm rounded-2xl border border-slate-600/70 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl text-slate-100 relative'
    : 'w-full max-w-sm rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl text-gray-700 relative';

  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={[44.7866, 20.4489]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
        dragging={true} 
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        className={`map-root ${mapThemeClass}`}
      >
        {isDarkMode ? (
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
      
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
        const startMs = new Date(trka.vremePocetka).getTime();
        const isPast = startMs < now;
        const isOlderThanWeek = now - startMs > sevenDaysMs;
        if (isOlderThanWeek) return null;
        const isOrganizer = !!currentUser && trka.organizatorId === currentUser.id;

        const userParticipationStatus = trka.mojStatusPrijave as 'NA_CEKANJU' | 'PRIHVACENO' | 'ODBIJENO' | null;

        const joinState = (() => {
          if (isPast) {
            return {
              label: 'Trka završena',
              disabled: true,
              className: isDarkMode
                ? 'bg-slate-700 text-slate-300 border border-slate-500/80 cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            };
          }
          if (isOrganizer) {
            return {
              label: 'Ti si organizator',
              disabled: true,
              className: isDarkMode
                ? 'bg-slate-700/80 text-slate-100 border border-slate-500/80 cursor-not-allowed'
                : 'bg-slate-200 text-slate-800 border border-slate-300 cursor-not-allowed'
            };
          }
          if (!userParticipationStatus) {
            return {
              label: 'Pridruži se +',
              disabled: false,
              className: isDarkMode
                ? 'bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/60 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            };
          }
          if (userParticipationStatus === 'NA_CEKANJU') {
            return {
              label: 'Na čekanju',
              disabled: true,
              className: isDarkMode
                ? 'bg-amber-700/70 text-amber-100 border border-amber-500/60 cursor-not-allowed'
                : 'bg-amber-300 text-amber-900 cursor-not-allowed'
            };
          }
          if (userParticipationStatus === 'PRIHVACENO') {
            return {
              label: 'Prijavljen',
              disabled: true,
              className: isDarkMode
                ? 'bg-blue-700/70 text-blue-100 border border-blue-500/60 cursor-not-allowed'
                : 'bg-blue-400 text-blue-950 cursor-not-allowed'
            };
          }
          return {
            label: 'Odbijen',
            disabled: true,
            className: isDarkMode
              ? 'bg-rose-700/70 text-rose-100 border border-rose-500/60 cursor-not-allowed'
              : 'bg-red-300 text-red-900 cursor-not-allowed'
          };
        })();

        return (
        <Marker
          key={trka.id}
          position={[trka.lokacijaLat, trka.lokacijaLng]}
          icon={isPast ? finishIcon : raceIcon}
        >
          <Popup maxWidth={420} minWidth={320} className="race-popup">
            <div className="glass-popup w-[320px] max-w-[78vw]">
              <RacePreviewCard
                naziv={trka.naziv}
                vremePocetka={trka.vremePocetka}
                planiranaDistancaKm={trka.planiranaDistancaKm}
                organizatorIme={trka.organizator?.imePrezime || 'Nepoznato'}
                organizatorSlot={
                  <button
                    onClick={() => openProfile(trka.organizator?.id ?? trka.organizatorId)}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {trka.organizator?.imePrezime || 'Nepoznato'}
                  </button>
                }
                brojPrijava={trka._count?.ucesnici ?? 0}
                status={trka.status}
                tezina={trka.tezina}
                compact
                theme={isDarkMode ? 'dark' : 'light'}
                className="bg-transparent p-0 text-left shadow-none"
              />

              <button
                onClick={() => !joinState.disabled && handleJoin(trka.id)}
                disabled={joinState.disabled}
                className={`px-4 py-2 rounded-full text-sm font-bold transition w-full mt-1 ${joinState.className}`}
              >
                {joinState.label}
              </button>
            </div>
          </Popup>
        </Marker>
      )})}
      {profileOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4 pointer-events-auto"
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
            className={miniProfileModalClass}
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
              className={`absolute top-3 right-3 ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
              aria-label="Zatvori"
            >
              ✕
            </button>

            {profileLoading && (
              <div className="space-y-3">
                <div className={`h-12 w-12 rounded-full animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <div className={`h-4 w-2/3 animate-pulse rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <div className={`h-3 w-full animate-pulse rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
              </div>
            )}

            {!profileLoading && profileError && (
              <div className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{profileError}</div>
            )}

            {!profileLoading && profileData && (
              <div className="flex flex-col items-center text-center gap-3">
                {profileData.slikaUrl ? (
                  <Image
                    src={profileData.slikaUrl}
                    alt={profileData.imePrezime}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover border border-white/80 shadow"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{profileData.imePrezime}</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>{profileData.uloga}</p>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-600'}`}>
                  {profileData.bio || 'Korisnik nema biografiju.'}
                </p>
                <div className="w-full grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-lg py-2 ${
                      isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-white/70 border border-white/80'
                    }`}
                  >
                    <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Organizuje</p>
                    <p className="font-bold">{profileData.organizovaneTrkeCount}</p>
                  </div>
                  <div
                    className={`rounded-lg py-2 ${
                      isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-white/70 border border-white/80'
                    }`}
                  >
                    <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Ukupno km</p>
                    <p className="font-bold">{profileData.ukupnoPredjeniKm ?? 0}</p>
                  </div>
                </div>
                <Link
                  href={`/users/${profileData.id}`}
                  className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white! text-sm font-semibold hover:bg-blue-700"
                >
                  Pogledaj profil
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </MapContainer>
    </div>
  );
}
