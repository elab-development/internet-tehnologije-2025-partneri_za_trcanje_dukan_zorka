'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Input from './components/Input';
import Button from './components/Button';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';


const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-200 animate-pulse flex items-center justify-center">Učitavanje mape...</div>
});

export default function Home() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: number, ime: string} | null>(null);
  const [trke, setTrke] = useState([]); 
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [showNewRaceForm, setShowNewRaceForm] = useState(false);
  const [newRaceData, setNewRaceData] = useState({
    naziv: '',
    vreme: '',
    distanca: '',
    lat: 0,
    lng: 0,
    tezina: 'Rekreativno'
  });

  useEffect(() => {
    const checkUser = () => {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        const user = JSON.parse(saved);
        setIsLoggedIn(true);
        setCurrentUser(user);
        fetchTrke(); 
      }
    };
    checkUser();
  }, []);


  const fetchTrke = async () => {
    try {
      const res = await fetch('/api/races'); 
      const data = await res.json();
      setTrke(data);
    } catch (err) {
      console.error("Greska pri ucitavanju trka", err);
    }
  };


  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, lozinka: loginForm.password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        fetchTrke(); 
      } else {
        alert(data.message);
      }
    } catch (err) { alert("Greška pri logovanju"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isLoggedIn) return;
    setNewRaceData({ ...newRaceData, lat, lng });
    setShowNewRaceForm(true);
  };

  const handleCreateRace = async () => {
    try {
      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRaceData,
          organizatorId: currentUser?.id 
        })
      });

      if (res.ok) {
        alert("Trka uspešno kreirana! 🏁");
        setShowNewRaceForm(false); 
        setNewRaceData({ naziv: '', vreme: '', distanca: '', lat: 0, lng: 0 , tezina: 'Rekreativno' }); 
        fetchTrke(); 
      } else {
        alert("Greška pri kreiranju trke.");
      }
    } catch (err) { alert("Server greška."); }
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <div className="z-50 bg-white shadow-md relative">
         <Navbar currentUser={currentUser} /> 

      </div>

      <div className="flex-1 flex relative h-full">
        
        {!isLoggedIn && (
          <div className="w-full md:w-1/3 bg-white p-8 shadow-2xl z-40 flex flex-col justify-center h-full absolute md:relative">
            <h1 className="text-3xl font-bold mb-2">Dobrodošli! 👋</h1>
            <p className="text-gray-500 mb-8">Prijavi se za trčanje.</p>
            <div className="space-y-4">
              <Input label="Email" name="email" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} />
              <Input label="Lozinka" name="password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
              <Button label="Prijavi se" fullWidth onClick={handleLogin} />
            </div>
          </div>
        )}

        
        <div className={`relative h-full transition-all duration-500 ${isLoggedIn ? 'w-full' : 'w-full md:w-2/3'}`}>
          
          
          {!isLoggedIn && (
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-[5000] flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl shadow-2xl font-bold">🔒 Prijavi se za mapu</div>
            </div>
          )}

          <div className="h-full w-full relative z-0">
            <Map 
              interactive={isLoggedIn} 
              trke={trke} 
              onMapClick={handleMapClick} 
            />
          </div>

          {isLoggedIn && (
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button 
                  label={`👤 ${currentUser?.ime}`} 
                  variant="secondary" 
                  onClick={() => window.location.href = '/profile'} 
                />             
           <Button label="🚪 Odjavi se" variant="danger" onClick={handleLogout} />
            </div>
          )}

          {showNewRaceForm && (
            <div className="text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-[2000] w-80 border border-blue-500">
              <h3 className="font-bold text-lg mb-4 text-center">Nova trka ovde? 📍</h3>
              <div className="space-y-3">
                <Input 
                  label="Naziv trke" name="naziv" 
                  value={newRaceData.naziv} 
                  onChange={(e) => setNewRaceData({...newRaceData, naziv: e.target.value})} 
                />
                <Input 
                  label="Datum i vreme" name="vreme" type="datetime-local"
                  value={newRaceData.vreme} 
                  onChange={(e) => setNewRaceData({...newRaceData, vreme: e.target.value})} 
                />
                <Input 
                  label="Distanca (km)" name="distanca" type="number"
                  value={newRaceData.distanca} 
                  onChange={(e) => setNewRaceData({...newRaceData, distanca: e.target.value})} 
                />
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Težina staze</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                  value={newRaceData.tezina} 
                  onChange={(e) => setNewRaceData({...newRaceData, tezina: e.target.value})}
                >
                  <option value="Početnik">🟢 Početnik (Lagano)</option>
                  <option value="Rekreativno">🔵 Rekreativno (Srednje)</option>
                  <option value="Maraton">🔴 Maraton (Teško)</option>
                </select>
              </div>
                <div className="flex gap-2 mt-4">
                  <Button label="Otkaži" variant="secondary" onClick={() => setShowNewRaceForm(false)} />
                  <Button label="Kreiraj" variant="primary" onClick={handleCreateRace} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}