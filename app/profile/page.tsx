'use client';

import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import RacePreviewCard from '../components/RacePreviewCard';
import { useRouter } from 'next/navigation';
import { withCsrfHeader } from '@/lib/csrf-client';

type RaceDetails = {
  naziv: string;
  vremePocetka: string;
  planiranaDistancaKm?: number;
  organizatorIme?: string;
  brojPrijava?: number;
  status?: string;
  tezina?: string;
  opis?: string;
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bioText, setBioText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [resultFormOpen, setResultFormOpen] = useState<number | null>(null);
  const [resultData, setResultData] = useState({ predjeniKm: '', vremeTrajanja: '' });
  const [resultError, setResultError] = useState<string | null>(null);
  const [commentFormOpen, setCommentFormOpen] = useState<number | null>(null);
  const [commentData, setCommentData] = useState({ ocena: '5', tekst: '' });
  const [commentError, setCommentError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedRaceDetails, setSelectedRaceDetails] = useState<RaceDetails | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data);
      setBioText(data.bio || '');
      setCurrentUser({ ime: data.imePrezime, slikaUrl: data.slikaUrl ?? null });
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ bio: bioText }),
        credentials: 'include'
      });

      if (res.ok) {
        alert('Biografija sačuvana!');
        setIsEditing(false);
        fetchProfile();
      }
    } catch (err) {
      alert('Greška.');
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Fajl mora biti slika.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Maksimalna veličina slike je 5MB.');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setUploadError('Nedostaje Cloudinary konfiguracija.');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);


      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData?.error?.message || 'Greška pri uploadu slike.');
      }

      const slikaUrl = uploadData.secure_url as string | undefined;
      if (!slikaUrl) {
        throw new Error('Cloudinary nije vratio URL slike.');
      }

      const saveRes = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ slikaUrl }),
        credentials: 'include'
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.message || 'Greška pri čuvanju slike.');
      }

      fetchProfile();
    } catch (error: any) {
      setUploadError(error?.message || 'Greška pri uploadu.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLeave = async (trkaId: number) => {
    if (!confirm('Da li sigurno želiš da otkažeš učešće?')) return;

    try {
      const res = await fetch('/api/races/leave', {
        method: 'DELETE',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ trkaId }),
        credentials: 'include'
      });

      if (res.ok) {
        alert('Otkazano!');
        fetchProfile();
      }
    } catch (err) {
      alert('Greška.');
    }
  };

  if (loading) return <div className="p-10  text-center">Učitavanje profila...</div>;

  const handleDeleteRace = async (trkaId: number) => {
    if (!confirm('Da li sigurno želiš da obrišeš ovu trku?')) return;

    try {
      const res = await fetch('/api/races/delete', {
        method: 'DELETE',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          trkaId: trkaId
        }),
        credentials: 'include'
      });

      if (res.ok) {
        alert('Trka obrisana!');
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.message || 'Greška pri brisanju.');
      }
    } catch (err) {
      alert('Greška na mreži.');
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
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
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
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
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
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ucesceId }),
        credentials: 'include'
      });

      if (res.ok) {
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.message || 'Greška pri prihvatanju.');
      }
    } catch (err) {
      alert('Greška na mreži.');
    }
  };

  const handleRejectRequest = async (ucesceId: number) => {
    try {
      const res = await fetch('/api/races/requests/reject', {
        method: 'PATCH',
        headers: withCsrfHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ucesceId }),
        credentials: 'include'
      });

      if (res.ok) {
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.message || 'Greška pri odbijanju.');
      }
    } catch (err) {
      alert('Greška na mreži.');
    }
  };

  const notificationsCount = user?.obavestenja?.length ?? 0;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <Navbar currentUser={currentUser} />

      <div className="max-w-6xl mx-auto p-6 space-y-8 anim-enter">
        <div className="glass-card p-6 md:p-8 relative anim-enter">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            <div className="flex flex-col items-start gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadingImage}
                className="avatar-button"
                title="Promeni profilnu sliku"
              >
                {user?.slikaUrl ? (
                  <img
                    src={user.slikaUrl}
                    alt={user?.imePrezime || 'Profil'}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-200/20 border border-slate-300/80 dark:border-white/30 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
                <span className="avatar-overlay">Promeni</span>
                {uploadingImage && <span className="avatar-loading">Upload...</span>}
              </button>
              {uploadError && (
                <div className="text-xs text-red-300">{uploadError}</div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.imePrezime}</h1>
                <span className="glass-chip">{user?.uloga}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="glass-stat">
                  <p className="text-xs text-slate-600 dark:text-slate-300">Ukupno km</p>
                  <p className="text-lg font-semibold">{user?.ukupnoPredjeniKm ?? 0}</p>
                </div>
                <div className="glass-stat">
                  <p className="text-xs text-slate-600 dark:text-slate-300">Organizovane trke</p>
                  <p className="text-lg font-semibold">{user?.organizovaneTrke?.length ?? 0}</p>
                </div>
                <div className="glass-stat">
                  <p className="text-xs text-slate-600 dark:text-slate-300">Prijavljene trke</p>
                  <p className="text-lg font-semibold">{user?.ucesca?.length ?? 0}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Biografija</p>
                {!isEditing ? (
                  <div className="mt-2">
                    <p className="text-slate-700 dark:text-slate-200 italic">
                      {user?.bio || 'Nemaš upisanu biografiju.'}
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-300 text-sm font-semibold mt-2 hover:underline"
                    >
                      ✏️ Izmeni biografiju
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    <textarea
                      className="w-full rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400"
                      rows={3}
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Napiši nešto o sebi..."
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button label="Sačuvaj" onClick={handleSaveBio} variant="primary" />
                      <Button label="Otkaži" onClick={() => setIsEditing(false)} variant="secondary" />
                    </div>
                  </div>
                )}
              </div>
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

        <section className="space-y-4 anim-enter delay-1">
          <div className="flex items-center justify-between">
            <h2 className="section-title">ZAHTEVI ZA UČEŠĆE</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {user?.pendingRequests?.length ?? 0} zahteva
            </span>
          </div>
          {user?.pendingRequests?.length === 0 ? (
            <div className="glass-card p-4 text-slate-600 dark:text-slate-300 italic">Nema zahteva.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {user?.pendingRequests?.map((req: any) => (
                <div key={req.id} className="glass-card p-5 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{req.korisnik.imePrezime}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">🏁 {req.trka.naziv}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      📅 {new Date(req.trka.vremePocetka).toLocaleDateString()} • 📏 {req.trka.planiranaDistancaKm} km
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button label="Prihvati" variant="primary" onClick={() => handleApproveRequest(req.id)} />
                    <Button label="Odbij" variant="danger" onClick={() => handleRejectRequest(req.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5 anim-enter delay-2">
          <div className="grid gap-3 text-center lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:text-left">
            <h2 className="section-title lg:text-center">PRIJAVLJENE TRKE</h2>
            <div className="hidden h-10 w-px bg-white/20 lg:block" />
            <h2 className="section-title lg:text-center">ORGANIZOVANE TRKE</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {user?.ucesca?.length === 0 ? (
              <div className="glass-card p-4 text-slate-600 dark:text-slate-300 italic">Nisi prijavljen ni na jednu trku.</div>
              ) : (
                <div className="space-y-4">
                  {user?.ucesca.map((ucesce: any) => (
                    <div key={ucesce.id} className="glass-card p-5 flex flex-col gap-3">
                      <RacePreviewCard
                        naziv={ucesce.trka.naziv}
                        vremePocetka={ucesce.trka.vremePocetka}
                        planiranaDistancaKm={ucesce.trka.planiranaDistancaKm}
                        organizatorIme={ucesce.trka.organizator?.imePrezime}
                        brojPrijava={ucesce.trka._count?.ucesnici}
                        status={ucesce.status}
                        tezina={ucesce.trka.tezina}
                        compact
                        minimal
                        rightAction={
                          <button
                            onClick={() => handleLeave(ucesce.trka.id)}
                            className="text-red-500 dark:text-red-300 text-sm hover:underline font-medium"
                          >
                            Otkaži
                          </button>
                        }
                        onOpenDetails={() =>
                          setSelectedRaceDetails({
                            naziv: ucesce.trka.naziv,
                            vremePocetka: ucesce.trka.vremePocetka,
                            planiranaDistancaKm: ucesce.trka.planiranaDistancaKm,
                            organizatorIme: ucesce.trka.organizator?.imePrezime,
                            brojPrijava: ucesce.trka._count?.ucesnici,
                            status: ucesce.status,
                            tezina: ucesce.trka.tezina,
                            opis: ucesce.trka.opis
                          })
                        }
                        detailsContainerClassName="mt-5"
                      />

                    {ucesce.rezultat && (
                      <div className="glass-subcard text-sm">
                        <div>✅ Rezultat: {ucesce.rezultat.predjeniKm} km</div>
                        <div>⏱ Vreme: {ucesce.rezultat.vremeTrajanja}</div>
                        <div>⚡ Tempo: {formatPace(ucesce.rezultat.predjeniKm, ucesce.rezultat.vremeTrajanja)}</div>
                      </div>
                    )}

                    {ucesce.status === 'PRIHVACENO' &&
                      !ucesce.rezultat
                      && new Date(ucesce.trka.vremePocetka) < new Date()
                      && (
                        <div>
                          {resultFormOpen === ucesce.id ? (
                            <div className="glass-subcard">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="w-full rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-sm text-slate-800 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100"
                                  placeholder="Pređeno km"
                                  value={resultData.predjeniKm}
                                  onChange={(e) => setResultData({ ...resultData, predjeniKm: e.target.value })}
                                />
                                <input
                                  className="w-full rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-sm text-slate-800 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100"
                                  placeholder="Vreme (HH:MM:SS)"
                                  value={resultData.vremeTrajanja}
                                  onChange={(e) => setResultData({ ...resultData, vremeTrajanja: e.target.value })}
                                />
                              </div>
                              {resultError && (
                                <div className="text-xs text-red-300 mt-2">{resultError}</div>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
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
                          <div className="glass-subcard text-sm">
                            <div>💬 Tvoj komentar: {komentar?.tekst}</div>
                            <div>⭐ Ocena: {komentar?.ocena}/5</div>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {commentFormOpen === ucesce.trka.id ? (
                            <div className="glass-subcard">
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  className="w-full rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-sm text-slate-800 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100"
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
                                  className="w-full rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-sm text-slate-800 dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100"
                                  placeholder="Komentar"
                                  value={commentData.tekst}
                                  onChange={(e) => setCommentData({ ...commentData, tekst: e.target.value })}
                                />
                              </div>
                              {commentError && (
                                <div className="text-xs text-red-300 mt-2">{commentError}</div>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
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

            <div className="space-y-4">
              {user?.organizovaneTrke?.length === 0 ? (
              <div className="glass-card p-4 text-slate-600 dark:text-slate-300 italic">Nisi organizovao nijednu trku.</div>
              ) : (
                <div className="space-y-4">
                  {user?.organizovaneTrke.map((trka: any) => (
                    <div key={trka.id} className="glass-card p-5 relative">
                      <RacePreviewCard
                        naziv={trka.naziv}
                        vremePocetka={trka.vremePocetka}
                        planiranaDistancaKm={trka.planiranaDistancaKm}
                        organizatorIme={user?.imePrezime}
                        brojPrijava={trka._count?.ucesnici}
                        status={trka.status}
                        tezina={trka.tezina}
                        compact
                        minimal
                        rightAction={
                          <Button
                            label="Obriši"
                            variant="danger"
                            onClick={() => handleDeleteRace(trka.id)}
                          />
                        }
                        onOpenDetails={() =>
                          setSelectedRaceDetails({
                            naziv: trka.naziv,
                            vremePocetka: trka.vremePocetka,
                            planiranaDistancaKm: trka.planiranaDistancaKm,
                            organizatorIme: user?.imePrezime,
                            brojPrijava: trka._count?.ucesnici,
                            status: trka.status,
                            tezina: trka.tezina,
                            opis: trka.opis
                          })
                        }
                        detailsContainerClassName="mt-5"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {selectedRaceDetails && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRaceDetails(null)}
          />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 glass-card p-6">
            <div className="flex items-center justify-between ">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalji trke</h3>
              <button
                onClick={() => setSelectedRaceDetails(null)}
                className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <RacePreviewCard
                naziv={selectedRaceDetails.naziv}
                vremePocetka={selectedRaceDetails.vremePocetka}
                planiranaDistancaKm={selectedRaceDetails.planiranaDistancaKm}
                organizatorIme={selectedRaceDetails.organizatorIme}
                brojPrijava={selectedRaceDetails.brojPrijava}
                status={selectedRaceDetails.status}
                tezina={selectedRaceDetails.tezina}
                opis={selectedRaceDetails.opis}
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setNotificationsOpen(true)}
        className="fixed right-4 top-28 z-40 glass-fab"
      >
        Obaveštenja
        {notificationsCount > 0 && (
          <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
            {notificationsCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md glass-panel p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Obaveštenja</h3>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-3 overflow-y-auto pr-2 max-h-[calc(100vh-120px)]">
              {user?.obavestenja?.length === 0 ? (
                <div className="glass-card p-4 text-slate-600 dark:text-slate-300 italic">Nema obaveštenja.</div>
              ) : (
                user?.obavestenja?.map((o: any) => (
                  <div key={o.id} className="glass-card p-4">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{o.tekst}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      <style jsx global>{`
        .section-title {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.7);
        }
        .dark .section-title {
          color: rgba(226, 232, 240, 0.9);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.65);
          border: 2px solid rgba(203, 213, 225, 0.9);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
          backdrop-filter: blur(18px);
          border-radius: 20px;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }
        .dark .glass-card {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
        }
        .glass-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.26);
          box-shadow: 0 22px 45px rgba(15, 23, 42, 0.2);
        }
        .dark .glass-card:hover {
          box-shadow: 0 22px 45px rgba(15, 23, 42, 0.45);
        }
        .glass-subcard {
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(203, 213, 225, 0.85);
          border-radius: 14px;
          padding: 12px;
          color: #0f172a;
        }
        .dark .glass-subcard {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #e2e8f0;
        }
        .glass-chip {
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #1e3a8a;
        }
        .dark .glass-chip {
          background: rgba(59, 130, 246, 0.18);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #bfdbfe;
        }
        .glass-stat {
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.75);
          border: 2px solid rgba(203, 213, 225, 0.85);
        }
        .dark .glass-stat {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          border-left: 1px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 24px 0 0 24px;
        }
        .dark .glass-panel {
          background: rgba(10, 15, 28, 0.88);
          border-left: 1px solid rgba(255, 255, 255, 0.12);
        }
        .glass-fab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.9);
          color: #0f172a;
          font-weight: 600;
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(12px);
          transition: transform 200ms ease, background 200ms ease, box-shadow 200ms ease;
        }
        .dark .glass-fab {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.35);
        }
        .glass-fab:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 20px 34px rgba(15, 23, 42, 0.22);
        }
        .dark .glass-fab:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 34px rgba(15, 23, 42, 0.45);
        }
        .avatar-button {
          position: relative;
          border-radius: 999px;
          overflow: hidden;
          transition: transform 200ms ease, box-shadow 200ms ease;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.35);
        }
        .avatar-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.45);
        }
        .avatar-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .avatar-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.55);
          color: #e2e8f0;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 200ms ease;
        }
        .avatar-button:hover .avatar-overlay {
          opacity: 1;
        }
        .avatar-loading {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.7);
          padding: 2px 6px;
          border-radius: 999px;
        }
        .anim-enter {
          animation: fadeUp 0.5s ease both;
        }
        .anim-enter.delay-1 {
          animation-delay: 120ms;
        }
        .anim-enter.delay-2 {
          animation-delay: 240ms;
        }
        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
