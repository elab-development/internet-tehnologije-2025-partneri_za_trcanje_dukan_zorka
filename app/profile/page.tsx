'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ ime: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioText, setBioText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [resultFormOpen, setResultFormOpen] = useState<number | null>(null);
  const [resultData, setResultData] = useState({ predjeniKm: '', vremeTrajanja: '' });
  const [resultError, setResultError] = useState<string | null>(null);
  const [commentFormOpen, setCommentFormOpen] = useState<number | null>(null);
  const [commentData, setCommentData] = useState({ ocena: '5', tekst: '' });
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const parsedUser = await meRes.json();
      setCurrentUser(parsedUser);

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });
      const data = await res.json();
      setUser(data);
      setBioText(data.bio || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
  try {
    const res = await fetch('/api/profile/update', {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bioText }),
      credentials: 'include'
    });

    if (res.ok) {
      alert("Biografija sačuvana!");
      setIsEditing(false);
      fetchProfile(); 
    }
  } catch (err) { alert("Greška."); }
};


  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLeave = async (trkaId: number) => {
    if(!confirm("Da li sigurno želiš da otkažeš učešće?")) return;

    try {
      const res = await fetch('/api/races/leave', {
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trkaId }),
        credentials: 'include'
      });

      if (res.ok) {
        alert("Otkazano!");
        fetchProfile();
      }
    } catch (err) { alert("Greška."); }
  };

  if (loading) return <div className="p-10 text-center">Učitavanje profila...</div>;

  const handleDeleteRace = async (trkaId: number) => {
  if (!confirm("Da li sigurno želiš da obrišeš ovu trku?")) return;

  try {
    const res = await fetch('/api/races/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        trkaId: trkaId
      }),
      credentials: 'include'
    });

    if (res.ok) {
      alert("Trka obrisana!");
      fetchProfile();
    } else {
      const data = await res.json();
      alert(data.message || "Greška pri brisanju.");
    }
  } catch (err) {
    alert("Greška na mreži.");
  }
};

  const parseDurationToSeconds = (value: string) => {
    const parts = value.split(':').map((p) => parseInt(p, 10));
    if (parts.some((p) => Number.isNaN(p))) return null;
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) {
      return parts[0] * 60;
    }
    return null;
  };

  const formatPace = (km: number, vremeTrajanja: string) => {
    const total = parseDurationToSeconds(vremeTrajanja);
    if (!total || km <= 0) return '-';
    const secPerKm = Math.round(total / km);
    const minutes = Math.floor(secPerKm / 60);
    const seconds = secPerKm % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  const openResultForm = (ucesceId: number) => {
    setResultFormOpen(ucesceId);
    setResultData({ predjeniKm: '', vremeTrajanja: '' });
    setResultError(null);
  };

  const handleSaveResult = async (ucesceId: number) => {
    try {
      setResultError(null);
      if (!resultData.predjeniKm || !resultData.vremeTrajanja) {
        setResultError('Unesi km i vreme.');
        return;
      }

      const res = await fetch('/api/results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ucesceId,
          predjeniKm: resultData.predjeniKm,
          vremeTrajanja: resultData.vremeTrajanja
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setResultFormOpen(null);
        fetchProfile();
      } else {
        const data = await res.json();
        setResultError(data.message || 'Greška pri snimanju.');
      }
    } catch (err) {
      setResultError('Greška na mreži.');
    }
  };

  const openCommentForm = (trkaId: number) => {
    setCommentFormOpen(trkaId);
    setCommentData({ ocena: '5', tekst: '' });
    setCommentError(null);
  };

  const handleSaveComment = async (trkaId: number) => {
    try {
      setCommentError(null);
      if (!commentData.tekst || !commentData.ocena) {
        setCommentError('Unesi komentar i ocenu.');
        return;
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trkaId,
          tekst: commentData.tekst,
          ocena: commentData.ocena
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setCommentFormOpen(null);
        fetchProfile();
      } else {
        const data = await res.json();
        setCommentError(data.message || 'Greška pri slanju komentara.');
      }
    } catch (err) {
      setCommentError('Greška na mreži.');
    }
  };
  const handleApproveRequest = async (ucesceId: number) => {
    try {
      const res = await fetch('/api/races/requests/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ucesceId }),
        credentials: 'include'
      });

      if (res.ok) {
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.message || "Greška pri prihvatanju.");
      }
    } catch (err) {
      alert("Greška na mreži.");
    }
  };

  const handleRejectRequest = async (ucesceId: number) => {
    try {
      const res = await fetch('/api/races/requests/reject', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ucesceId }),
        credentials: 'include'
      });

      if (res.ok) {
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.message || "Greška pri odbijanju.");
      }
    } catch (err) {
      alert("Greška na mreži.");
    }
  };


  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <Navbar currentUser={currentUser} />
      
      <div className="max-w-4xl mx-auto p-6">
      
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 flex items-center gap-6 relative">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.imePrezime}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2 inline-block">
              {user?.uloga}
            </span>
            <div className="mt-2 text-sm text-gray-600">
              Ukupno km: <span className="font-semibold">{user?.ukupnoPredjeniKm ?? 0}</span>
            </div>
          </div>
          {user?.uloga === 'ADMIN' && (
            <div className="absolute top-4 right-4">
              <Button
                label="Admin panel"
                variant="secondary"
                onClick={() => router.push('/admin')}
              />
            </div>
          )}
        </div>

        <div className="text-gray-400 mt-4 pt-4 border-t border-blue-100 w-full">
  {!isEditing ? (
    <div>
      <p className="text-gray-200 italic">
        {user?.bio || "Nemaš upisanu biografiju."}
      </p>
      <button 
        onClick={() => setIsEditing(true)}
        className="text-blue-600 text-sm font-semibold mt-2 hover:underline"
      >
        ✏️ Izmeni biografiju
      </button>
    </div>
  ) : (
    <div className="mt-2">
      <textarea
        className="w-full p-2 border rounded-md text-sm mb-2"
        rows={3}
        value={bioText}
        onChange={(e) => setBioText(e.target.value)}
        placeholder="Napiši nešto o sebi..."
      />
      <div className="flex gap-2">
        <Button label="Sačuvaj" onClick={handleSaveBio} variant="primary" />
        <Button label="Otkaži" onClick={() => setIsEditing(false)} variant="secondary" />
      </div>
    </div>
  )}
</div>

        <div className="mb-8">
          <h2 className="text-white-800 text-2xl font-bold mb-4 mt-7 flex items-center gap-2">
            🔔 Obaveštenja
          </h2>
          {user?.obavestenja?.length === 0 ? (
            <p className="text-gray-200 italic">Nema obaveštenja.</p>
          ) : (
            <div className="space-y-3">
              {user?.obavestenja?.map((o: any) => (
                <div key={o.id} className="bg-white/90 text-gray-700 p-4 rounded-lg shadow border border-blue-100">
                  <p className="text-sm">{o.tekst}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-white-800 text-2xl font-bold mb-4 mt-7 flex items-center gap-2">
            ⏳ Zahtevi za učešće
          </h2>
          {user?.pendingRequests?.length === 0 ? (
            <p className="text-gray-200 italic">Nema zahteva.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {user?.pendingRequests?.map((req: any) => (
                <div key={req.id} className="bg-white text-gray-600 p-5 rounded-lg shadow border border-gray-100 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-lg">{req.korisnik.imePrezime}</h3>
                    <p className="text-sm text-gray-600">🏁 {req.trka.naziv}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      📅 {new Date(req.trka.vremePocetka).toLocaleDateString()} • 📏 {req.trka.planiranaDistancaKm} km
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button label="Prihvati" variant="primary" onClick={() => handleApproveRequest(req.id)} />
                    <Button label="Odbij" variant="danger" onClick={() => handleRejectRequest(req.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

       
        <div className="mb-8">
          <h2 className="text-white-800 text-2xl font-bold mb-4 mt-7 flex items-center gap-2">
            🏃‍♂️ Trke na koje sam prijavljen
          </h2>
          
          {user?.ucesca?.length === 0 ? (
            <p className="text-gray-200 italic">Nisi prijavljen ni na jednu trku.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {user?.ucesca.map((ucesce: any) => (
                <div key={ucesce.id} className="bg-white text-gray-500 p-5 rounded-lg shadow border border-gray-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{ucesce.trka.naziv}</h3>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(ucesce.trka.vremePocetka).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 {ucesce.trka.planiranaDistancaKm} km
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Status: {ucesce.status}</p>
                    </div>
                    <button 
                      onClick={() => handleLeave(ucesce.trka.id)}
                      className="text-red-500 text-sm hover:underline font-medium"
                    >
                      Otkaži
                    </button>
                  </div>

                  {ucesce.rezultat && (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-sm text-gray-700">
                      <div>✅ Rezultat: {ucesce.rezultat.predjeniKm} km</div>
                      <div>⏱ Vreme: {ucesce.rezultat.vremeTrajanja}</div>
                      <div>⚡ Tempo: {formatPace(ucesce.rezultat.predjeniKm, ucesce.rezultat.vremeTrajanja)}</div>
                    </div>
                  )}

                  {ucesce.status === 'PRIHVACENO' &&
                    !ucesce.rezultat
                     &&  new Date(ucesce.trka.vremePocetka) < new Date() 
                     && (
                    <div>
                      {resultFormOpen === ucesce.id ? (
                        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Pređeno km"
                              value={resultData.predjeniKm}
                              onChange={(e) => setResultData({ ...resultData, predjeniKm: e.target.value })}
                            />
                            <input
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Vreme (HH:MM:SS)"
                              value={resultData.vremeTrajanja}
                              onChange={(e) => setResultData({ ...resultData, vremeTrajanja: e.target.value })}
                            />
                          </div>
                          {resultError && (
                            <div className="text-xs text-red-600 mt-2">{resultError}</div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button label="Sačuvaj" variant="primary" onClick={() => handleSaveResult(ucesce.id)} />
                            <Button label="Otkaži" variant="secondary" onClick={() => setResultFormOpen(null)} />
                          </div>
                        </div>
                      ) : (
                        <Button label="Unesi rezultat" variant="secondary" onClick={() => openResultForm(ucesce.id)} />
                      )}
                    </div>
                  )}

                  {ucesce.status === 'PRIHVACENO' &&
                    !ucesce.rezultat 
                    && new Date(ucesce.trka.vremePocetka) >= new Date()
                     && (
                    <Button label="Rezultat nakon trke" variant="secondary" disabled />
                  )}

                  {(() => {
                    const hasComment = user?.komentari?.some((k: any) => k.trkaId === ucesce.trka.id);
                    const isPast = new Date(ucesce.trka.vremePocetka) < new Date();

                    if (ucesce.status !== 'PRIHVACENO' || !isPast) return null;

                    if (hasComment) {
                      const komentar = user?.komentari?.find((k: any) => k.trkaId === ucesce.trka.id);
                      return (
                        <div className="bg-green-50/70 border border-green-100 rounded-lg p-3 text-sm text-gray-700">
                          <div>💬 Tvoj komentar: {komentar?.tekst}</div>
                          <div>⭐ Ocena: {komentar?.ocena}/5</div>
                        </div>
                      );
                    }

                    return (
                      <div>
                        {commentFormOpen === ucesce.trka.id ? (
                          <div className="rounded-lg border border-green-100 bg-green-50/70 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                                value={commentData.ocena}
                                onChange={(e) => setCommentData({ ...commentData, ocena: e.target.value })}
                              >
                                <option value="5">5 - Odlično</option>
                                <option value="4">4 - Vrlo dobro</option>
                                <option value="3">3 - Dobro</option>
                                <option value="2">2 - Loše</option>
                                <option value="1">1 - Jako loše</option>
                              </select>
                              <input
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                                placeholder="Komentar"
                                value={commentData.tekst}
                                onChange={(e) => setCommentData({ ...commentData, tekst: e.target.value })}
                              />
                            </div>
                            {commentError && (
                              <div className="text-xs text-red-600 mt-2">{commentError}</div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button label="Sačuvaj komentar" variant="primary" onClick={() => handleSaveComment(ucesce.trka.id)} />
                              <Button label="Otkaži" variant="secondary" onClick={() => setCommentFormOpen(null)} />
                            </div>
                          </div>
                        ) : (
                          <Button label="Ostavi komentar" variant="secondary" onClick={() => openCommentForm(ucesce.trka.id)} />
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

       
        <div>
          <h2 className="text-2xl text-white-800 font-bold mb-4 flex items-center gap-2">
            📢 Trke koje organizujem
          </h2>
          {user?.organizovaneTrke?.length === 0 ? (
             <p className="text-gray-200 italic">Nisi organizovao nijednu trku.</p>
          ) : (
              <div className="grid gap-4 md:grid-cols-2">
            {user?.organizovaneTrke.map((trka: any) => (
              
              <div key={trka.id} className="relative text-gray-200 p-5 rounded-lg shadow border border-yellow-100 bg-yellow-50/30">
                
               
                <div className="absolute top-4 right-4">
                  <Button 
                    label={`Obriši`} 
                    variant="danger" 
                    onClick={() => handleDeleteRace(trka.id)} 
                  />
                </div>

                <h3 className="font-bold text-lg">{trka.naziv}</h3>
                <p className="text-sm text-gray-300">Status: {trka.status}</p>
        </div>
  ))}
</div>
          )}
        </div>

      </div>
    </main>
  );
}
