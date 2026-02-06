import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, lozinka } = body;

    
    if (!email || !lozinka) {
      return NextResponse.json({ message: 'Unesite email i lozinku.' }, { status: 400 });
    }

    
    const korisnik = await prisma.korisnik.findUnique({
      where: { email }
    });

   
    if (!korisnik) {
      return NextResponse.json({ message: 'Pogrešan email ili lozinka.' }, { status: 401 });
    }

    
    const lozinkaJeTacna = await bcrypt.compare(lozinka, korisnik.lozinkaHash);

    if (!lozinkaJeTacna) {
      return NextResponse.json({ message: 'Pogrešan email ili lozinka.' }, { status: 401 });
    }

    // moguce dodavanje JWT tokena kasnije
    return NextResponse.json({ 
      message: 'Uspešna prijava!',
      user: {
        id: korisnik.id,
        email: korisnik.email,
        ime: korisnik.imePrezime,
        uloga: korisnik.uloga
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login greška:', error);
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}