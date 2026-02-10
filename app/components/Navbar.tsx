"use client";
import React, { useEffect, useState } from 'react';
import Button from './Button'; 
import Link from 'next/link';
import Image from 'next/image';
import logoGif from '../images/logo3.gif'; 

interface NavbarProps {
  currentUser?: { ime: string } | null;
}


export default function Navbar({ currentUser }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = prefersDark ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('theme-change'));
  }, [theme]);


  return (
    <nav className="relative bg-linear-to-r from-white via-slate-50 to-blue-50/80 dark:to-slate-950 dark:via-slate-900 dark:from-indigo-950 border-b border-blue-100/80 dark:border-white/10 shadow-[0_8px_24px_rgba(15,23,42,0.08)] py-2 md:px-12">
      <div className="max-w-9xl mx-auto flex items-center gap-4">
       
        <Link href="/">
          <Image
            src={logoGif}
            alt="TREP"
            className="h-12 w-auto md:h-14 object-contain"
            priority 
          />
        </Link>
      
        <div className="ml-auto flex items-center gap-2 gap-x-8">
          <Link href="/about" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white font-semibold hidden md:block relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">
            O nama
          </Link>
          {theme && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
              title={theme === 'dark' ? 'Prebaci na svetlu temu' : 'Prebaci na tamnu temu'}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          )}

          {!currentUser && (
            <div className="flex gap-2 ">
               <Link href="/login" className="hidden md:block">
                  <Button label="Prijavi se" variant="secondary" onClick={() => {}} />
               </Link>
               <Link href="/register" className="hidden md:block">
                  <Button label="Registracija" variant="primary" onClick={() => {}} />
               </Link>
            </div>
          )}

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-slate-900 dark:text-slate-100 focus:outline-none rounded-lg p-2 hover:bg-blue-50 dark:hover:bg-white/10 transition"
            aria-label="Otvori meni"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> 
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /> 
              )}
            </svg>
          </button>
        </div>
      </div>

       
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-blue-100 dark:border-white/10 shadow-xl z-50">
          <div className="flex flex-col p-4 gap-4">
            <Link 
              href="/about" 
              className="text-slate-700 dark:text-slate-200 font-semibold"
              onClick={() => setIsOpen(false)} 
            >
              O nama
            </Link>
            {theme && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
                title={theme === 'dark' ? 'Prebaci na svetlu temu' : 'Prebaci na tamnu temu'}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
            
            
            {!currentUser && (
              <div className="flex flex-col gap-2">
                <Link href="/login">
                  <Button label="Prijavi se" variant="secondary" onClick={() => {}} />
                </Link>
                <Link href="/register">
                  <Button label="Registracija" variant="primary" onClick={() => {}} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
