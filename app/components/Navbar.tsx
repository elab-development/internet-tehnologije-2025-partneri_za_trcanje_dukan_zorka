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
    <nav className="bg-white shadow-md py-2 md:px-12 relative">
      <div className="max-w-9xl mx-auto flex justify-between items-center">
       
        <Link href="/">
          <Image
            src={logoGif}
            alt="TREP"
            className="h-12 w-auto md:h-14 object-contain"
            priority 
          />
        </Link>

       
        <div className="md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-900 focus:outline-none"
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
        
      
        <div className="flex items-center gap-2">
          <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium hidden md:block">
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
        </div>
      </div>

       
       {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-700 shadow-lg border-t z-50">
          <div className="flex flex-col p-4 gap-4">
            <Link 
              href="/about" 
              className="text-gray-600 font-medium"
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