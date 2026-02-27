'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Input from './components/Input';
import Button from './components/Button';
import BlurText from './components/BlurText';
import dynamic from 'next/dynamic';
import { withCsrfHeader } from '@/lib/csrf-client';

const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-200 animate-pulse flex items-center justify-center">Učitavanje mape...</div>
});

type User = { id: number; ime: string; email?: string; uloga?: string };
type Trka = {
  id: number;
  naziv: string;
  vremePocetka: string;
  planiranaDistancaKm: number;
  lokacijaLat: number;
  lokacijaLng: number;
  organizator?: { imePrezime?: string };
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NEARBY_RADIUS_KM = 30;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceInKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export default function Home() {
  const AUTH_UI_CACHE_KEY = 'auth_ui_cache';
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'ready' | 'denied' | 'unsupported'>('idle');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [trke, setTrke] = useState<Trka[]>([]); 
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesError, setRacesError] = useState<string | null>(null);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [showNewRaceForm, setShowNewRaceForm] = useState(false);
  const [draftLocation, setDraftLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newRaceData, setNewRaceData] = useState({
    naziv: '',
    vreme: '',
    distanca: '',
    lat: 0,
    lng: 0,
    tezina: 'Rekreativno'
  });
  const [raceFormError, setRaceFormError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    minDistance: '',
    fromDate: '',
  });

  const handleHeroAnimationComplete = () => {
    console.log('BlurText animation completed.');
  };

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

  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('ready');
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, [isLoggedIn]);

  useEffect(() => {
    const checkUser = async () => {
      const cached = localStorage.getItem(AUTH_UI_CACHE_KEY);
      if (cached) {
        try {
          const cachedUser = JSON.parse(cached) as User;
          setIsLoggedIn(true);
          setCurrentUser(cachedUser);
          setAuthLoading(false);
        } catch {
          localStorage.removeItem(AUTH_UI_CACHE_KEY);
        }
      }

      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          setIsLoggedIn(false);
          setCurrentUser(null);
          localStorage.removeItem(AUTH_UI_CACHE_KEY);
          return;
        }
        const user = await res.json();
        setIsLoggedIn(true);
        setCurrentUser(user);
        localStorage.setItem(AUTH_UI_CACHE_KEY, JSON.stringify(user));
        fetchTrke();
      } catch {
        setIsLoggedIn(false);
        setCurrentUser(null);
        localStorage.removeItem(AUTH_UI_CACHE_KEY);
      } finally {
        setAuthLoading(false);
      }
    };
    checkUser();
  }, []);

  const filterInputClass = isDarkMode
    ? 'w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500'
    : 'w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500';


  const fetchTrke = async () => {
    try {
      setRacesLoading(true);
      setRacesError(null);
      const res = await fetch('/api/races', { credentials: 'include' }); 
      const data = await res.json();
      setTrke(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Greska pri ucitavanju trka", err);
      setRacesError("Ne mogu da učitam trke.");
    } finally {
      setRacesLoading(false);
    }
  };

  const filteredTrke = useMemo(() => {
    return trke.filter((t) => {
      const matchSearch = filters.search
        ? t.naziv?.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const minDist = filters.minDistance ? Number(filters.minDistance) : null;
      const matchDist = minDist ? t.planiranaDistancaKm >= minDist : true;
      const matchDate = filters.fromDate
        ? new Date(t.vremePocetka) >= new Date(filters.fromDate)
        : true;
      return matchSearch && matchDist && matchDate;
    });
  }, [trke, filters]);

  const mapVisibleTrke = useMemo(() => {
    const now = Date.now();
    return filteredTrke.filter((t) => {
      const startMs = new Date(t.vremePocetka).getTime();
      return Number.isFinite(startMs) && now - startMs <= WEEK_MS;
    });
  }, [filteredTrke]);

  const nearbyCount = useMemo(() => {
    if (!userLocation) return null;
    return mapVisibleTrke.filter((t) => {
      const km = distanceInKm(userLocation.lat, userLocation.lng, t.lokacijaLat, t.lokacijaLng);
      return km <= NEARBY_RADIUS_KM;
    }).length;
  }, [mapVisibleTrke, userLocation]);

  const nearbyVisibleTrke = useMemo(() => {
    if (!userLocation) return mapVisibleTrke;
    return mapVisibleTrke.filter((t) => {
      const km = distanceInKm(userLocation.lat, userLocation.lng, t.lokacijaLat, t.lokacijaLng);
      return km <= NEARBY_RADIUS_KM;
    });
  }, [mapVisibleTrke, userLocation]);

  const filtersContent = (
    <>
      <p className="text-sm font-semibold">Filtriraj trke</p>
      <div className="mt-3 space-y-2" key={isDarkMode ? 'filters-dark' : 'filters-light'}>
        <input
          className={filterInputClass}
          placeholder="Pretraga po nazivu"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <input
          className={filterInputClass}
          placeholder="Min distanca (km)"
          type="number"
          value={filters.minDistance}
          onChange={(e) => setFilters({ ...filters, minDistance: e.target.value })}
        />
        <input
          className={filterInputClass}
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
        />
      </div>
    </>
  );

  const statsContent = (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mape u blizini</p>
      <div className="mt-2">
        <div className="glass-mini text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">U krugu {NEARBY_RADIUS_KM} km</p>
          <p className="text-lg font-bold">{nearbyCount ?? '—'}</p>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        {locationStatus === 'denied' && 'Dozvoli lokaciju u browseru za prikaz trka u blizini.'}
        {locationStatus === 'unsupported' && 'Geolokacija nije podržana na ovom uređaju.'}
        {racesLoading && "Učitavanje trka..."}
        {!racesLoading && racesError && racesError}
        {!racesLoading && !racesError && nearbyVisibleTrke.length === 0 && "Nema trka za izabrane filtere."}
      </div>
    </>
  );


  const handleLogin = async () => {
    try {
      setLoginError(null);
      if (!loginForm.email || !loginForm.password) {
        setLoginError("Unesi email i lozinku.");
        return;
      }
      setLoginLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, lozinka: loginForm.password }),
        credentials: 'include',
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        localStorage.setItem(AUTH_UI_CACHE_KEY, JSON.stringify(data.user));
        fetchTrke(); 
      } else {
        setLoginError(data.message || "Greška pri logovanju.");
      }
    } catch { setLoginError("Greška pri logovanju."); }
    finally { setLoginLoading(false); }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isLoggedIn) return;
    setNewRaceData({ ...newRaceData, lat, lng });
    setDraftLocation({ lat, lng });
    setShowNewRaceForm(true);
  };

  const handleCancelNewRace = () => {
    setShowNewRaceForm(false);
    setDraftLocation(null);
  };

  const handleCreateRace = async () => {
    try {
      setRaceFormError(null);
      if (!newRaceData.naziv || !newRaceData.vreme || !newRaceData.distanca) {
        setRaceFormError("Popuni naziv, datum i distancu.");
        return;
      }
      if (Number(newRaceData.distanca) <= 0) {
        setRaceFormError("Distanca mora biti veća od 0.");
        return;
      }
      const res = await fetch('/api/races', {
        method: 'POST',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...newRaceData
        }),
        credentials: 'include',
      });

      if (res.ok) {
        alert("Trka uspešno kreirana! 🏁");
        setShowNewRaceForm(false); 
        setDraftLocation(null);
        setNewRaceData({ naziv: '', vreme: '', distanca: '', lat: 0, lng: 0 , tezina: 'Rekreativno' }); 
        fetchTrke(); 
      } else {
        setRaceFormError("Greška pri kreiranju trke.");
      }
    } catch { setRaceFormError("Server greška."); }
  };

  if (authLoading) {
    return (
      <main className="h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="glass-card max-w-sm w-full text-center">
          <p className="text-sm font-semibold">Učitavanje...</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-linear-to-r from-blue-500 to-cyan-400" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="z-50 relative">
         <Navbar currentUser={currentUser} /> 
      </div>

      <div className="flex-1 flex relative h-full text-slate-700 dark:text-slate-100">
        {!isLoggedIn && (
          <div className="w-full md:w-1/3 p-6 md:p-10 z-40 flex flex-col justify-center h-full absolute md:relative">
            <div className="glass-card animate-fade-in">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Partneri za trčanje</p>
              <BlurText
                text="Uđi u ritam."
                delay={200}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleHeroAnimationComplete}
                className="text-3xl font-black mt-3"
              />
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Prijavi se i otključaj mapu trka, prijave i organizaciju događaja.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="glass-pill">Mapa trka</span>
                <span className="glass-pill">Prijave</span>
                <span className="glass-pill">Organizacija</span>
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                <Input
                  label="Email"
                  name="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
                <Input
                  label="Lozinka"
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                {loginError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {loginError}
                  </div>
                )}
                <Button label={loginLoading ? "Učitavanje..." : "Prijavi se"} fullWidth type="submit" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nemaš nalog? Registruj se u 30 sekundi.
                </p>
              </form>
            </div>
          </div>
        )}

        <div className={`relative h-full transition-all duration-500 ${isLoggedIn ? 'w-full' : 'w-full md:w-2/3'}`}>
          {!isLoggedIn && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-6">
              <div className="glass-card max-w-md text-center">
                <h3 className="text-lg font-bold">🔒 Prijavi se za mapu</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  Ne želiš da propustiš ova dešavanja.  <br />Uloguj se za potpunu interakciju.
                </p>
              </div>
            </div>
          )}

          <div className="h-full w-full relative z-0">
            <Map
              interactive={isLoggedIn}
              trke={nearbyVisibleTrke}
              draftLocation={draftLocation}
              currentUser={currentUser}
              onMapClick={handleMapClick}
            />
          </div>

          {isLoggedIn && (
            <>
              <div className="absolute top-4 left-4 z-20 hidden md:flex flex-col gap-3 max-w-xs">
                <div className="glass-card p-4 animate-fade-in-up">
                  {filtersContent}
                </div>

                <div className="glass-card p-4 hover-float">
                  {statsContent}
                </div>

                <div className="glass-pill w-fit">Klikni na mapu da dodaš trku</div>
              </div>

              <div className="absolute top-4 left-4 z-20 md:hidden">
                <button
                  onClick={() => setShowFilters(true)}
                  className="glass-pill shadow-lg"
                >
                  🔍 Filteri
                </button>
              </div>

              {showFilters && (
                <div className="fixed inset-0 z-40 md:hidden">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    aria-label="Zatvori filtere"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="glass-card glass-soft">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Filteri i statistika</p>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-3">{filtersContent}</div>
                      <div className="mt-5 rounded-xl bg-white/55 border border-white/70 p-3 dark:bg-slate-900/60 dark:border-white/10">
                        {statsContent}
                      </div>
                      <div className="mt-4 glass-pill w-fit">Klikni na mapu da dodaš trku</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {showNewRaceForm && (
            <div className="absolute top-1/2 left-1/2 z-30 w-96 -translate-x-1/2 -translate-y-1/2 transform border border-blue-200 text-slate-800 glass-card glass-soft dark:border-white/20 dark:text-slate-100">
              <h3 className="mb-2 text-center text-lg font-bold text-slate-900 dark:text-white">Organizuj trku</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
                Lokacija: {newRaceData.lat.toFixed(4)}, {newRaceData.lng.toFixed(4)}
              </p>
              <div className="space-y-3">
                <Input
                  label="Naziv trke" name="naziv"
                  value={newRaceData.naziv}
                  onChange={(e) => setNewRaceData({ ...newRaceData, naziv: e.target.value })}
                />
                <Input
                  label="Datum i vreme" name="vreme" type="datetime-local"
                  value={newRaceData.vreme}
                  onChange={(e) => setNewRaceData({ ...newRaceData, vreme: e.target.value })}
                />
                <Input
                  label="Distanca (km)" name="distanca" type="number"
                  value={newRaceData.distanca}
                  onChange={(e) => setNewRaceData({ ...newRaceData, distanca: e.target.value })}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Težina staze</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100"
                    value={newRaceData.tezina}
                    onChange={(e) => setNewRaceData({ ...newRaceData, tezina: e.target.value })}
                  >
                    <option value="Početnik">🟢 Početnik (Lagano)</option>
                    <option value="Rekreativno">🔵 Rekreativno (Srednje)</option>
                    <option value="Maraton">🔴 Maraton (Teško)</option>
                  </select>
                </div>
                {raceFormError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {raceFormError}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button label="Otkaži" variant="secondary" onClick={handleCancelNewRace} />
                  <Button label="Kreiraj" variant="primary" onClick={handleCreateRace} />
                </div>
              </div>
            </div>
          )}

          <style jsx global>{`
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.6s ease both; }
            .animate-fade-in-up { animation: fade-in-up 0.8s ease both; }
            .glass-card {
              background: rgba(255, 255, 255, 0.65);
              border: 1px solid rgba(255, 255, 255, 0.8);
              backdrop-filter: blur(18px);
              border-radius: 20px;
              padding: 24px;
              box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
            }
            .dark .glass-card {
              background: rgba(15, 23, 42, 0.55);
              border: 1px solid rgba(255, 255, 255, 0.16);
              box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
            }
            .glass-soft {
              background: rgba(255, 255, 255, 0.5);
              border: 1px solid rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(22px);
            }
            .dark .glass-soft {
              background: rgba(15, 23, 42, 0.4);
              border: 1px solid rgba(255, 255, 255, 0.18);
            }
            .glass-mini {
              background: rgba(255, 255, 255, 0.7);
              border: 1px solid rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(12px);
              border-radius: 14px;
              padding: 10px 12px;
              font-weight: 700;
              color: #0f172a;
            }
            .dark .glass-mini {
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.18);
              color: #e2e8f0;
            }
            .glass-pill {
              background: rgba(255, 255, 255, 0.75);
              border: 1px solid rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(10px);
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
            }
            .dark .glass-pill {
              background: rgba(255, 255, 255, 0.12);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: #e2e8f0;
            }
            .hover-float {
              transition: transform 200ms ease, box-shadow 200ms ease;
            }
            .hover-float:hover {
              transform: translateY(-4px);
              box-shadow: 0 24px 70px rgba(14, 165, 233, 0.18);
            }
            .race-marker {
              filter: drop-shadow(0 6px 8px rgba(59, 130, 246, 0.35));
            }
            .draft-marker {
              filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.55));
              animation: marker-pulse 1.6s ease-in-out infinite;
            }
            @keyframes marker-pulse {
              0%, 100% { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.45)); }
              50% { filter: drop-shadow(0 0 16px rgba(59, 130, 246, 0.9)); }
            }
          `}</style>
        </div>
      </div>
    </main>
  );
}
