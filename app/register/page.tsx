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
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <Navbar />

      <div className="max-w-md mx-auto mt-10 p-8  bg-white rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-600">
          Pridruži se!
        </h1>
        <p className="text-gray-500 text-center mb-8">
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

        <p className="text-center mt-6 text-gray-600">
          Već imaš nalog?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Prijavi se ovde
          </Link>
        </p>
      </div>
    </main>
  );
}