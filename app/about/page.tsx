'use client';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

export default function About() {
  const [currentUser, setCurrentUser] = useState<{ ime: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
    }
  }, []);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900">
      <Navbar currentUser={currentUser} />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-32 -right-24 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-200/40 blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <section className="grid gap-10 md:grid-cols-2 items-center">
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Partneri za trčanje</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-black leading-tight">
                Trči bolje uz zajednicu koja te razume.
              </h1>
              <p className="mt-4 text-slate-600">
                Projekat iz predmeta Internet Tehnologije koji spaja rekreativce, organizatore i
                trkačke događaje u jednoj jednostavnoj platformi.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="glass-pill">Neon.tech + Prisma</span>
                <span className="glass-pill">Next.js</span>
                <span className="glass-pill">Leaflet mape</span>
              </div>
            </div>

            <div className="glass-card animate-fade-in-up">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-2xl">
                  🏃‍♀️
                </div>
                <div>
                  <h2 className="text-xl font-bold">Naša misija</h2>
                  <p className="text-slate-600 text-sm">
                    Kreiramo sigurnu i živu trkačku zajednicu gde je organizacija događaja jednostavna,
                    a pronalaženje partnera za trčanje intuitivno.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="glass-mini">
                  <p className="text-xs text-slate-500">Trke</p>
                  <p className="text-4xl font-bold">∞</p>
                </div>
                <div className="glass-mini">
                  <p className="text-xs text-slate-500">Korisnici</p>
                  <p className="text-4xl font-bold">∞</p>
                </div>
                <div className="glass-mini">
                  <p className="text-xs text-slate-500">Organizatori</p>
                  <p className="text-4xl font-bold">∞</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="glass-card hover-float">
              <h3 className="font-bold text-lg">Pametno povezivanje</h3>
              <p className="text-slate-600 mt-2 text-sm">
                Pronađi trke i ljude prema lokaciji, težini i vremenu događaja.
              </p>
            </div>
            <div className="glass-card hover-float">
              <h3 className="font-bold text-lg">Organizuj bez stresa</h3>
              <p className="text-slate-600 mt-2 text-sm">
                Kreiranje trke je jedan klik, a pregled prijavljenih učesnika uvek pri ruci.
              </p>
            </div>
            <div className="glass-card hover-float">
              <h3 className="font-bold text-lg">Transparentna pravila</h3>
              <p className="text-slate-600 mt-2 text-sm">
                Jasne uloge, jednostavna administracija i pouzdano iskustvo.
              </p>
            </div>
          </section>

          <section className="mt-14 grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <div className="glass-card">
              <h2 className="text-xl font-bold">Tehnologije</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="glass-mini">Next.js + TypeScript</div>
                <div className="glass-mini">Tailwind CSS</div>
                <div className="glass-mini">PostgreSQL (Neon.tech)</div>
                <div className="glass-mini">Prisma ORM</div>
                <div className="glass-mini">Leaflet + React Leaflet</div>
                <div className="glass-mini">Custom auth</div>
              </div>
            </div>
            <div className="glass-card">
              <h2 className="text-xl font-bold">Kako radimo</h2>
              <div className="mt-4 space-y-3">
                <div className="flex gap-3">
                  <span className="step-dot" />
                  <div>
                    <p className="font-semibold">Planiranje trka</p>
                    <p className="text-sm text-slate-600">Organizatori dodaju događaje i detalje.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="step-dot" />
                  <div>
                    <p className="font-semibold">Prijave i mapa</p>
                    <p className="text-sm text-slate-600">Korisnici se prijavljuju uz mapu lokacije.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="step-dot" />
                  <div>
                    <p className="font-semibold">Administracija</p>
                    <p className="text-sm text-slate-600">Sigurna kontrola i pregled aktivnosti.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-16 glass-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">Pridruži se zajednici</h2>
              <p className="text-slate-600 mt-2">
                Ubrzaj svoj napredak, pronađi inspiraciju i trči sa društvom.
              </p>
              <p className="text-xs text-slate-500 mt-3">Autori: Nikola Dukić, Ognjen Zorkić, 2026.</p>
            </div>
            <div className="flex gap-3">
              <span className="glass-pill">Sigurna prijava</span>
              <span className="glass-pill">Laka organizacija</span>
            </div>
          </section>
        </div>
      </div>

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
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(18px);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
        }
        .glass-mini {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(14px);
          border-radius: 14px;
          padding: 12px 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .glass-pill {
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }
        .step-dot {
          width: 10px;
          height: 10px;
          margin-top: 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, #60a5fa, #22d3ee);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
        }
        .hover-float {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .hover-float:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 70px rgba(14, 165, 233, 0.18);
        }
      `}</style>
    </main>
  );
}