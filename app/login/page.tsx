'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Navbar from '../components/Navbar'; 
import Input from '../components/Input';
import Button from '../components/Button';
import Link from 'next/link';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    lozinka: ''
  });
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Dobrodošli nazad!');
        router.push('/'); 
      } else {
        alert(data.message || 'Greška pri prijavi.');
      }
    } catch (error) {
      console.error(error);
      alert('Nije uspelo povezivanje sa serverom.');
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <Navbar />

      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-16 md:pt-24">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
          <h1 className="mb-2 text-center text-3xl font-bold text-blue-600">
            Dobrodošli nazad!
          </h1>
          <p className="mb-8 text-center text-gray-500 dark:text-slate-300">
            Prijavi se da vidiš nove trke.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button 
              label="Prijavi se" 
              type="submit" 
              fullWidth={true} 
            />
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-slate-300">
            Nemaš nalog?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Registruj se besplatno
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
