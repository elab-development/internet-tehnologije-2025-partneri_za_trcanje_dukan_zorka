'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import RacePreviewCard from '../components/RacePreviewCard';

const DEFAULT_RADIUS_KM = 30;

type CurrentUser = { ime?: string; slikaUrl?: string | null };

type OrganizerRace = {
  id: number;
  naziv: string;
  vremePocetka: string;
  planiranaDistancaKm: number;
  lokacijaLat: number;
  lokacijaLng: number;
  status: string;
  tezina: string;
  udaljenostKm: number | null;
};

type Organizer = {
  id: number;
  imePrezime: string;
  slikaUrl?: string | null;
  bio?: string | null;
  trkeCount: number;
  poslednjaTrka: string | null;
  trke: OrganizerRace[];
};

type OrganizersResponse = {
  organizers: Organizer[];
  meta: {
    radiusKm: number;
    hasLocation: boolean;
    query: string;
    totalRaces: number;
    totalOrganizers: number;
  };
};

export default function OrganizatoriPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<number | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);

  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [meta, setMeta] = useState<OrganizersResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'ready' | 'denied' | 'unsupported'>('idle');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        setCurrentUser({ ime: data.ime, slikaUrl: data.slikaUrl ?? null });
      } catch {
        window.location.href = '/login';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('ready');
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, [authLoading, currentUser]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('radiusKm', String(DEFAULT_RADIUS_KM));
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (location) {
          params.set('lat', String(location.lat));
          params.set('lng', String(location.lng));
        }

        const res = await fetch(`/api/organizers?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null) as { message?: string } | null;
          throw new Error(payload?.message || 'Greška pri učitavanju organizatora.');
        }

        const data = await res.json() as OrganizersResponse;
        setOrganizers(data.organizers ?? []);
        setMeta(data.meta ?? null);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        const message = requestError instanceof Error ? requestError.message : 'Greška pri učitavanju.';
        setError(message);
        setOrganizers([]);
        setMeta(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [authLoading, currentUser, debouncedSearch, location]);

  const selectedRace = useMemo(() => {
    if (!selectedRaceId) return null;
    for (const organizer of organizers) {
      const race = organizer.trke.find((item) => item.id === selectedRaceId);
      if (race) {
        return { race, organizerIme: organizer.imePrezime };
      }
    }
    return null;
  }, [selectedRaceId, organizers]);

  if (authLoading) {
    return <div className="p-8 text-center">Učitavanje...</div>;
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <Navbar currentUser={currentUser} />

      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <section className="glass-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pretraga</p>
              <h1 className="mt-1 text-2xl font-black md:text-3xl">Organizatori trka u blizini</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Prikaz uključuje i prošle i buduće trke.
              </p>
            </div>
            <div className="w-full md:max-w-sm">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Pretraga po imenu i prezimenu"
                className="w-full rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-600 dark:text-slate-300">
            {locationStatus === 'ready' && `Prikaz u radijusu ${DEFAULT_RADIUS_KM} km od tvoje lokacije.`}
            {locationStatus === 'denied' && 'Lokacija je odbijena. Prikazuju se svi organizatori (fallback režim).'}
            {locationStatus === 'unsupported' && 'Geolokacija nije podržana. Prikazuju se svi organizatori (fallback režim).'}
          </div>

          {meta && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 dark:border-white/20 dark:bg-white/10">
                Organizatora: {meta.totalOrganizers}
              </span>
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 dark:border-white/20 dark:bg-white/10">
                Trka: {meta.totalRaces}
              </span>
            </div>
          )}
        </section>

        <section className="mt-6 space-y-4">
          {loading && (
            <div className="glass-card">Učitavanje organizatora...</div>
          )}

          {!loading && error && (
            <div className="glass-card border-red-300/70 text-red-600 dark:text-red-300">{error}</div>
          )}

          {!loading && !error && organizers.length === 0 && (
            <div className="glass-card">
              Nema rezultata za zadate kriterijume.
            </div>
          )}

          {!loading && !error && organizers.map((organizer) => {
            const isOpen = selectedOrganizerId === organizer.id;
            return (
              <article key={organizer.id} className="glass-card">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    {organizer.slikaUrl ? (
                      <Image
                        src={organizer.slikaUrl}
                        alt={organizer.imePrezime}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full border border-white/70 object-cover dark:border-white/20"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full border border-white/70 bg-slate-100 dark:border-white/20 dark:bg-slate-800" />
                    )}
                    <div>
                      <h2 className="text-lg font-bold">{organizer.imePrezime}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Trke u rezultatu: {organizer.trkeCount}
                      </p>
                      {organizer.poslednjaTrka && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Poslednja trka: {new Date(organizer.poslednjaTrka).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/users/${organizer.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
                    >
                      Pogledaj profil
                    </Link>
                    <Button
                      label={isOpen ? 'Sakrij trke' : 'Prikaži trke'}
                      variant="glass"
                      onClick={() => setSelectedOrganizerId(isOpen ? null : organizer.id)}
                    />
                  </div>
                </div>

                {organizer.bio && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{organizer.bio}</p>
                )}

                {isOpen && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {organizer.trke.map((race) => (
                      <RacePreviewCard
                        key={race.id}
                        naziv={race.naziv}
                        vremePocetka={race.vremePocetka}
                        planiranaDistancaKm={race.planiranaDistancaKm}
                        organizatorIme={organizer.imePrezime}
                        status={race.status}
                        tezina={race.tezina}
                        compact
                        onOpenDetails={() => setSelectedRaceId(race.id)}
                        detailsLabel="Detalji trke"
                        rightAction={
                          race.udaljenostKm !== null ? (
                            <span className="rounded-md border border-blue-200/80 bg-blue-50/80 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-300/40 dark:bg-blue-400/15 dark:text-blue-200">
                              {race.udaljenostKm.toFixed(1)} km
                            </span>
                          ) : null
                        }
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>

      {selectedRace && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/55" onClick={() => setSelectedRaceId(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/25 bg-white/95 p-6 shadow-2xl dark:border-white/15 dark:bg-slate-900/95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Detalji trke</h3>
              <button
                onClick={() => setSelectedRaceId(null)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <RacePreviewCard
                naziv={selectedRace.race.naziv}
                vremePocetka={selectedRace.race.vremePocetka}
                planiranaDistancaKm={selectedRace.race.planiranaDistancaKm}
                organizatorIme={selectedRace.organizerIme}
                status={selectedRace.race.status}
                tezina={selectedRace.race.tezina}
                rightAction={
                  selectedRace.race.udaljenostKm !== null ? (
                    <span className="rounded-md border border-blue-200/80 bg-blue-50/80 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-300/40 dark:bg-blue-400/15 dark:text-blue-200">
                      {selectedRace.race.udaljenostKm.toFixed(1)} km
                    </span>
                  ) : null
                }
              />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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
      `}</style>
    </main>
  );
}
