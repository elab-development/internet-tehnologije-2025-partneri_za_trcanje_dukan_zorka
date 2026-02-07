'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const localUser = localStorage.getItem('currentUser');
    if (!localUser) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(localUser);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parsedUser.email })
      });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
      
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 flex items-center gap-6">
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
        </div>

       
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🏃‍♂️ Trke na koje sam prijavljen
          </h2>
          
          {user?.ucesca?.length === 0 ? (
            <p className="text-gray-500 italic">Nisi prijavljen ni na jednu trku.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {user?.ucesca.map((ucesce: any) => (
                <div key={ucesce.id} className="bg-white p-5 rounded-lg shadow border border-gray-100 flex justify-between items-start">
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
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📢 Trke koje organizujem
          </h2>
          {user?.organizovaneTrke?.length === 0 ? (
             <p className="text-gray-500 italic">Nisi organizovao nijednu trku.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {user?.organizovaneTrke.map((trka: any) => (
                <div key={trka.id} className=" p-5 rounded-lg shadow border border-yellow-100 bg-yellow-50/30">
                  <h3 className="font-bold text-lg">{trka.naziv}</h3>
                  <p className="text-sm text-gray-600">Status: {trka.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}