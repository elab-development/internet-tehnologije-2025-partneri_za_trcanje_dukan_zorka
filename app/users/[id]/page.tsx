'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import RacePreviewCard from '../../components/RacePreviewCard';
import Image from 'next/image';

type PublicUser = {
  id: number;
  imePrezime: string;
  bio?: string | null;
  slikaUrl?: string | null;
  uloga: string;
  ukupnoPredjeniKm: number;
  organizovaneTrkeCount: number;
  organizovaneTrke: {
    id: number;
    naziv: string;
    vremePocetka: string;
    planiranaDistancaKm: number;
    status: string;
    tezina?: string | null;
    opis?: string | null;
    _count: { ucesnici: number };
  }[];
  avgOcena: number | null;
  brojOcena: number;
  komentari: {
    id: number;
    tekst: string;
    ocena: number;
    createdAt: string;
    autor: { imePrezime: string };
    trka: { naziv: string };
  }[];
};

export default function PublicProfile() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [currentUser, setCurrentUser] = useState<{ ime: string } | null>(null);
  const [data, setData] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' });
        if (me.ok) {
          const user = await me.json();
          setCurrentUser(user);
        }
      } catch {
        // noop
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/users/${id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Greška pri učitavanju profila.');
          setData(null);
        } else {
          setData(json);
        }
      } catch {
        setError('Greška pri učitavanju profila.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <Navbar currentUser={currentUser} />

      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {loading && (
          <div className="rounded-2xl bg-white/70 border border-white/80 p-6 shadow dark:bg-slate-900/60 dark:border-white/10">
            Učitavanje profila...
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-600 shadow">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            <section className="glass-card flex flex-col md:flex-row gap-6 items-center">
              {data.slikaUrl ? (
                <Image
                  src={data.slikaUrl}
                  alt={data.imePrezime}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover border border-white/80 shadow dark:border-white/20"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-black">{data.imePrezime}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{data.uloga}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-3">
                  {data.bio || 'Korisnik nema biografiju.'}
                </p>
              </div>
              <div className="ml-auto grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="glass-mini text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ukupno km</p>
                  <p className="text-lg font-bold">{data.ukupnoPredjeniKm ?? 0}</p>
                </div>
                <div className="glass-mini text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Organizuje</p>
                  <p className="text-lg font-bold">{data.organizovaneTrkeCount}</p>
                </div>
                <div className="glass-mini text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ocena</p>
                  <p className="text-lg font-bold">
                    {data.avgOcena ? data.avgOcena.toFixed(1) : '-'}
                  </p>
                </div>
                <div className="glass-mini text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Broj ocena</p>
                  <p className="text-lg font-bold">{data.brojOcena}</p>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="glass-card">
                <h2 className="text-lg font-bold">Poslednje organizovane trke</h2>
                {data.organizovaneTrke.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Nema organizovanih trka.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.organizovaneTrke.map((t) => (
                      <RacePreviewCard
                        key={t.id}
                        naziv={t.naziv}
                        vremePocetka={t.vremePocetka}
                        planiranaDistancaKm={t.planiranaDistancaKm}
                        organizatorIme={data.imePrezime}
                        brojPrijava={t._count?.ucesnici}
                        status={t.status}
                        tezina={t.tezina}
                        compact
                        minimal
                        onOpenDetails={() => setSelectedRaceId(t.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card">
                <h2 className="text-lg font-bold">Komentari o trkama</h2>
                {data.komentari.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Nema komentara.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.komentari.map((k) => (
                      <div key={k.id} className="rounded-lg bg-white/70 border border-white/80 p-3 dark:bg-slate-900/60 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{k.autor.imePrezime}</p>
                          <span className="text-xs text-slate-500 dark:text-slate-400">⭐ {k.ocena}/5</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Trka: {k.trka.naziv}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">{k.tekst}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {!loading && data && selectedRaceId && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRaceId(null)}
          />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 glass-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Detalji trke</h3>
              <button
                onClick={() => setSelectedRaceId(null)}
                className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              {(() => {
                const trka = data.organizovaneTrke.find((r) => r.id === selectedRaceId);
                if (!trka) return null;
                return (
                  <RacePreviewCard
                    naziv={trka.naziv}
                    vremePocetka={trka.vremePocetka}
                    planiranaDistancaKm={trka.planiranaDistancaKm}
                    organizatorIme={data.imePrezime}
                    brojPrijava={trka._count?.ucesnici}
                    status={trka.status}
                    tezina={trka.tezina}
                    opis={trka.opis}
                  />
                );
              })()}
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
      `}</style>
    </main>
  );
}
