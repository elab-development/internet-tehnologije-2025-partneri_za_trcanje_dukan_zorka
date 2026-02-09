'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Input from './components/Input';
import Button from './components/Button';
import dynamic from 'next/dynamic';

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

export default function Home() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const user = await res.json();
        setIsLoggedIn(true);
        setCurrentUser(user);
        fetchTrke();
      } catch {
        // noop
      }
    };
    checkUser();
  }, []);


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
  
  const upcomingCount = useMemo(() => {
    const now = new Date();
    return trke.filter((t) => new Date(t.vremePocetka) >= now).length;
  }, [trke]);

  const filtersContent = (
    <>
      <p className="text-sm font-semibold">Filtriraj trke</p>
      <div className="mt-3 space-y-2">
        <input
          className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Pretraga po nazivu"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <input
          className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Min distanca (km)"
          type="number"
          value={filters.minDistance}
          onChange={(e) => setFilters({ ...filters, minDistance: e.target.value })}
        />
        <input
          className="w-full rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
        />
      </div>
    </>
  );

  const statsContent = (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Statistika</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="glass-mini text-center">
          <p className="text-xs text-slate-500">Ukupno</p>
          <p className="text-lg font-bold">{trke.length}</p>
        </div>
        <div className="glass-mini text-center">
          <p className="text-xs text-slate-500">Predstojeće</p>
          <p className="text-lg font-bold">{upcomingCount}</p>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-600">
        {racesLoading && "Učitavanje trka..."}
        {!racesLoading && racesError && racesError}
        {!racesLoading && !racesError && filteredTrke.length === 0 && "Nema trka za izabrane filtere."}
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
        fetchTrke(); 
      } else {
        setLoginError(data.message || "Greška pri logovanju.");
      }
    } catch (err) { setLoginError("Greška pri logovanju."); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null);
    window.location.reload();
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
        headers: { 'Content-Type': 'application/json' },
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
    } catch (err) { setRaceFormError("Server greška."); }
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50">
      <div className="z-50 relative">
         <Navbar currentUser={currentUser} /> 
      </div>

      <div className="flex-1 flex relative h-full text-gray-700">
        {!isLoggedIn && (
          <div className="w-full md:w-1/3 p-6 md:p-10 z-40 flex flex-col justify-center h-full absolute md:relative">
            <div className="glass-card animate-fade-in">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Partneri za trčanje</p>
              <h1 className="text-3xl font-black mt-3">Uđi u ritam.</h1>
              <p className="text-slate-600 mt-2">
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
                <p className="text-xs text-slate-500">
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
                <p className="text-slate-600 mt-2">
                  Ne želiš da propustiš ova dešavanja.  <br />Uloguj se za potpunu interakciju.
                </p>
              </div>
            </div>
          )}

          <div className="h-full w-full relative z-0">
            <Map
              interactive={isLoggedIn}
              trke={filteredTrke}
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
                          className="text-sm text-slate-600 hover:text-slate-900"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-3">{filtersContent}</div>
                      <div className="mt-5 rounded-xl bg-white/55 border border-white/70 p-3">
                        {statsContent}
                      </div>
                      <div className="mt-4 glass-pill w-fit">Klikni na mapu da dodaš trku</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isLoggedIn && (
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <Button
                label={`👤 ${currentUser?.ime}`}
                variant="secondary"
                onClick={() => window.location.href = '/profile'}
              />
              <Button label="Odjavi se" variant="danger" onClick={handleLogout} />
            </div>
          )}

          {showNewRaceForm && (
            <div className="text-gray-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glass-card glass-soft z-30 w-96 border border-blue-200">
              <h3 className="font-bold text-lg mb-2 text-center">Nova trka ovde? 📍</h3>
              <p className="text-xs text-slate-500 text-center mb-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Težina staze</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
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
            .glass-soft {
              background: rgba(255, 255, 255, 0.5);
              border: 1px solid rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(22px);
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
