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

      <div className="max-w-md mx-auto mt-40 p-8 bg-white rounded-xl shadow-lg border border-gray-100 ">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-600">
          Dobrodošli nazad!
        </h1>
        <p className="text-gray-500 text-center mb-8">
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

        <p className="text-center mt-6 text-gray-600">
          Nemaš nalog?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Registruj se besplatno
          </Link>
        </p>
      </div>
    </main>
  );
}
