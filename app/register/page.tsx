'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 

export default function Register() {
  const router = useRouter(); 
  const [formData, setFormData] = useState({
    ime: '',
    email: '',
    lozinka: '',
    potvrdaLozinke: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(formData.lozinka !== formData.potvrdaLozinke) {
      alert("Lozinke se ne poklapaju!");
      return;
    }

    try {
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          ime: formData.ime,
          email: formData.email,
          lozinka: formData.lozinka
        }),
      });

     
      const data = await response.json();

      if (response.ok) {
        
        alert('Registracija uspešna!');
        router.push('/login'); 
      } else {
       
        alert(data.message || 'Došlo je do greške.');
      }

    } catch (error) {
      
      console.error("Greška:", error);
      alert("Nije uspelo povezivanje sa serverom.");
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <Navbar />

      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-10 md:pt-14">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
          <h1 className="mb-2 text-center text-3xl font-bold text-blue-600">
            Pridruži se!
          </h1>
          <p className="mb-8 text-center text-gray-500 dark:text-slate-300">
            Napravi nalog i pronađi partnera za trčanje.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Ime i Prezime" 
              name="ime" 
              placeholder="Petar Petrović" 
              value={formData.ime}
              onChange={handleChange}
            />

            <Input 
              label="Email adresa" 
              name="email" 
              type="email"
              placeholder="petar@email.com" 
              value={formData.email}
              onChange={handleChange}
            />

            <Input 
              label="Lozinka" 
              name="lozinka" 
              type="password" 
              placeholder="********" 
              value={formData.lozinka}
              onChange={handleChange}
            />

            <Input 
              label="Potvrdi lozinku" 
              name="potvrdaLozinke" 
              type="password" 
              placeholder="********" 
              value={formData.potvrdaLozinke}
              onChange={handleChange}
            />

            <div className="pt-4">
              <Button 
                label="Registruj se" 
                type="submit" 
                fullWidth={true} 
              />
            </div>
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-slate-300">
            Već imaš nalog?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Prijavi se ovde
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
