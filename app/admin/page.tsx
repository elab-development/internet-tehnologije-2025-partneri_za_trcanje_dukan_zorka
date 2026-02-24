'use client';
import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RacePreviewCard from '../components/RacePreviewCard';
import { withCsrfHeader } from '@/lib/csrf-client';

type User = {
  id: number;
  imePrezime: string;
  uloga: string;
};

type Race = {
  id: number;
  naziv: string;
  vremePocetka: string;
  planiranaDistancaKm: number;
  status: string;
  tezina?: string | null;
  opis?: string | null;
  organizator: {
    id: number;
    imePrezime: string;
  };
  _count: {
    ucesnici: number;
  };
};

type PendingDelete =
  | { kind: 'user'; id: number; label: string }
  | { kind: 'race'; id: number; label: string }
  | null;

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ ime: string } | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) { router.push('/'); return; }
        const user = await res.json();
        if (user.uloga !== 'ADMIN') {
          alert("Nemaš pristup ovoj stranici!");
          router.push('/');
          return;
        }
        setIsAdmin(true);
        setCurrentUser(user);
        fetchData();
      } catch {
        router.push('/');
      }
    };
    load();
  }, [router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/admin/data', { credentials: 'include' });
      if (!res.ok) throw new Error('Ne mogu da učitam podatke.');
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
      setRaces(Array.isArray(data.races) ? data.races : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDelete = (next: PendingDelete) => {
    setPendingDelete(next);
    setConfirmChecked(false);
    setConfirmText('');
  };

  const closeDelete = () => {
    setPendingDelete(null);
    setConfirmChecked(false);
    setConfirmText('');
  };

  const isConfirmReady = useMemo(() => {
    return confirmChecked && confirmText.trim().toUpperCase() === 'OBRISI';
  }, [confirmChecked, confirmText]);

  const confirmDelete = async () => {
    if (!pendingDelete || !isConfirmReady) return;
    try {
      if (pendingDelete.kind === 'user') {
        await fetch('/api/admin/delete-user', {
          method: 'DELETE',
          headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ targetUserId: pendingDelete.id }),
          credentials: 'include',
        });
      } else {
        await fetch('/api/races/delete', {
          method: 'DELETE',
          headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ trkaId: pendingDelete.id }),
          credentials: 'include',
        });
      }
      closeDelete();
      fetchData();
    } catch {
      setError('Brisanje nije uspelo.');
      closeDelete();
    }
  };

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <Navbar currentUser={currentUser} />
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Admin</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Kontrolni Panel</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Upravljanje korisnicima i trkama.</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Prijavljen kao ADMIN</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* KORISNICI */}
          <div className="bg-white backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-6 transition-all duration-300 hover:border-slate-300 hover:-translate-y-1 dark:bg-white/5 dark:border-white/10 dark:shadow-[0_0_40px_rgba(15,23,42,0.45)] dark:hover:border-white/20 dark:hover:shadow-[0_0_60px_rgba(56,189,248,0.15)] animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Korisnici</h2>
              <span className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200 shimmer">
                {users.length} ukupno
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {isLoading && (
                <div className="space-y-3">
                  <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                </div>
              )}
              {!isLoading && users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2 rounded-md px-2 py-1 transition-all duration-200 hover:bg-slate-50 hover:translate-x-1 dark:border-white/10 dark:hover:bg-white/5">
                  <span className="text-slate-800 dark:text-slate-100">
                    <Link
                      href={`/users/${u.id}`}
                      className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                    >
                      {u.imePrezime}
                    </Link>{' '}
                    <span className="text-xs text-slate-500 dark:text-slate-400">({u.uloga})</span>
                  </span>
                  {u.uloga !== 'ADMIN' && (
                    <button
                      onClick={() => openDelete({ kind: 'user', id: u.id, label: u.imePrezime })}
                      className="text-red-300 hover:text-red-200 font-semibold transition"
                    >
                      Banuj
                    </button>
                  )}
                </div>
              ))}
              {!isLoading && users.length === 0 && (
                <div className="text-sm text-slate-400">Nema korisnika.</div>
              )}
            </div>
          </div>

          {/* TRKE */}
          <div className="bg-white backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-6 transition-all duration-300 hover:border-slate-300 hover:-translate-y-1 dark:bg-white/5 dark:border-white/10 dark:shadow-[0_0_40px_rgba(15,23,42,0.45)] dark:hover:border-white/20 dark:hover:shadow-[0_0_60px_rgba(244,63,94,0.15)] animate-fade-in-up delay-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Trke</h2>
              <span className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200 shimmer">
                {races.length} ukupno
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {isLoading && (
                <div className="space-y-3">
                  <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                </div>
              )}
              {!isLoading && races.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2 rounded-md px-2 py-1 transition-all duration-200 hover:bg-slate-50 hover:translate-x-1 dark:border-white/10 dark:hover:bg-white/5">
                  <div className="min-w-0">
                    <p className="truncate text-slate-900 dark:text-slate-100 font-semibold">{r.naziv}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(r.vremePocetka).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setSelectedRace(r)}
                      className="text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200 text-sm font-semibold transition"
                    >
                      Detalji
                    </button>
                    <button
                      onClick={() => openDelete({ kind: 'race', id: r.id, label: r.naziv })}
                      className="text-red-300 hover:text-red-200 font-semibold transition"
                    >
                      Obriši
                    </button>
                  </div>
                </div>
              ))}
              {!isLoading && races.length === 0 && (
                <div className="text-sm text-slate-400">Nema trka.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-slate-300 bg-white/95 backdrop-blur p-6 shadow-2xl animate-pop-in dark:border-white/10 dark:bg-slate-950/90">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Potvrda brisanja</h3>
            <p className="text-sm text-slate-300 mt-2">
              {pendingDelete.kind === 'user'
                ? `Brišeš korisnika: ${pendingDelete.label}.`
                : `Brišeš trku: ${pendingDelete.label}.`}
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="accent-red-500"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                />
                Razumem da je ovo nepovratna akcija.
              </label>
              <div>
                <label className="text-xs text-slate-400">Upiši `OBRISI` da potvrdiš</label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="OBRISI"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={closeDelete}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:border-slate-400 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/30"
              >
                Odustani
              </button>
              <button
                onClick={confirmDelete}
                disabled={!isConfirmReady}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500"
              >
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRace && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRace(null)}
          />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-slate-300 bg-white/95 p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950/90">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalji trke</h3>
              <button
                onClick={() => setSelectedRace(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <RacePreviewCard
              naziv={selectedRace.naziv}
              vremePocetka={selectedRace.vremePocetka}
              planiranaDistancaKm={selectedRace.planiranaDistancaKm}
              organizatorSlot={
                <Link
                  href={`/users/${selectedRace.organizator.id}`}
                  className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                >
                  {selectedRace.organizator.imePrezime}
                </Link>
              }
              brojPrijava={selectedRace._count.ucesnici}
              status={selectedRace.status}
              tezina={selectedRace.tezina}
              opis={selectedRace.opis || 'Trka nema dodatni opis.'}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease both; }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease both; }
        .delay-150 { animation-delay: 150ms; }
        .animate-pop-in { animation: pop-in 0.25s ease both; }
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmer 2.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          to { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}
