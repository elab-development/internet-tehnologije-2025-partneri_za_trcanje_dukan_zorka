"use client";
import React, { useState } from 'react';
import Button from './Button'; 
import Link from 'next/link';
import Image from 'next/image';
import logoGif from '../images/logo3.gif'; 

interface NavbarProps {
  currentUser?: { ime: string } | null;
}


export default function Navbar({ currentUser }: NavbarProps) {
   const [isOpen, setIsOpen] = useState(false);


  return (
    <nav className="relative bg-linear-to-r from-white via-slate-50 to-blue-50/80 border-b border-blue-100/80 shadow-[0_8px_24px_rgba(15,23,42,0.08)] py-2 md:px-12">
      <div className="max-w-9xl mx-auto flex items-center gap-4">
       
        <Link href="/">
          <Image
            src={logoGif}
            alt="TREP"
            className="h-12 w-auto md:h-14 object-contain"
            priority 
          />
        </Link>
      
        <div className="ml-auto flex items-center gap-2">
          <Link href="/about" className="text-slate-600 hover:text-slate-900 font-semibold hidden md:block relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full">
            O nama
          </Link>

          {!currentUser && (
            <div className="flex gap-2">
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
            className="md:hidden text-slate-900 focus:outline-none rounded-lg p-2 hover:bg-blue-50 transition"
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
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur border-t border-blue-100 shadow-xl z-50">
          <div className="flex flex-col p-4 gap-4">
            <Link 
              href="/about" 
              className="text-slate-700 font-semibold"
              onClick={() => setIsOpen(false)} 
            >
              O nama
            </Link>
            
            
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
