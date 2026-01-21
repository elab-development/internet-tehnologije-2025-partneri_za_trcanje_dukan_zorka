'use client';

import React, { useState } from 'react';
import Navbar from './components/Navbar'; 
import Input from './components/Input';
import Button from './components/Button';
import dynamic from 'next/dynamic';


const Map = dynamic(() => import('./components/map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-200 animate-pulse flex items-center justify-center">Učitavanje mape...</div>
});

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    
    if(email && password) {
      setIsLoggedIn(true);
      alert("Uspešna prijava!");
    }
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      
      <div className="z-50 bg-white shadow-md relative">
        <Navbar /> 
      </div>

      <div className="flex-1 flex relative h-full">
        
        {!isLoggedIn && (
          <div className="w-full md:w-1/3 bg-white p-8 shadow-[10px_0_20px_rgba(0,0,0,0.1)] z-40 flex flex-col justify-center h-full absolute md:relative top-0 left-0">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dobrodošli! 👋</h1>
            <p className="text-gray-500 mb-8">Prijavi se da pronađeš partnera za trčanje.</p>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <Input label="Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Lozinka" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button label="Prijavi se i Trči" fullWidth onClick={handleLogin} />
            </form>
          </div>
        )}

        <div className={`relative h-full transition-all duration-500 ease-in-out ${isLoggedIn ? 'w-full' : 'w-full md:w-2/3'}`}>
          
          {!isLoggedIn && (
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-[5000] flex items-center justify-center cursor-not-allowed">
              <div className="bg-white/90 p-6 rounded-xl shadow-2xl font-bold text-gray-800 transform scale-110">
                🔒 Prijavi se za mapu
              </div>
            </div>
          )}

          <div className="h-full w-full relative z-0">
            <Map />
          </div>

          {isLoggedIn && (
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button label="➕ Nova Trka" variant="primary" onClick={() => {}} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}