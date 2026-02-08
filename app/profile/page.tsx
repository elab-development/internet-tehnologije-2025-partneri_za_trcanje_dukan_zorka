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

  const fetchProfile = async () => {

    const localUser = localStorage.getItem('currentUser');
    if (!localUser) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(localUser);
    setCurrentUser(parsedUser);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parsedUser.email })
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
      body: JSON.stringify({ email: user.email, bio: bioText })
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
        body: JSON.stringify({ trkaId, korisnikId: user.id })
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
        trkaId: trkaId, 
        userId: user.id  
      })
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

  const handleApproveRequest = async (ucesceId: number) => {
    try {
      const res = await fetch('/api/races/requests/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ucesceId, organizerId: user.id })
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
        body: JSON.stringify({ ucesceId, organizerId: user.id })
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
                <div key={ucesce.id} className="bg-white text-gray-500 p-5 rounded-lg shadow border border-gray-100 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{ucesce.trka.naziv}</h3>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(ucesce.trka.vremePocetka).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      📍 {ucesce.trka.planiranaDistancaKm} km
                    </p>
                  </div>
                  <button 
                    onClick={() => handleLeave(ucesce.trka.id)}
                    className="text-red-500 text-sm hover:underline font-medium"
                  >
                    Otkaži
                  </button>
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
