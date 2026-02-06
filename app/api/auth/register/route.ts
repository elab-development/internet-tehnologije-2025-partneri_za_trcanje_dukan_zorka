import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';


export async function POST(req: Request) {
  try {
   
    const body = await req.json();
    const { email, lozinka, ime } = body;

   
    if (!email || !lozinka || !ime) {
      return NextResponse.json(
        { message: 'Sva polja su obavezna.' },
        { status: 400 }
      );
    }

   
    const postojeciKorisnik = await prisma.korisnik.findUnique({
      where: { email: email }
    });

    if (postojeciKorisnik) {
      return NextResponse.json(
        { message: 'Korisnik sa ovim email-om već postoji.' },
        { status: 409 }
      );
    }

   
    const hashedPassword = await bcrypt.hash(lozinka, 10);
    
    const noviKorisnik = await prisma.korisnik.create({
      data: {
        email,
        imePrezime: ime,
        lozinkaHash: hashedPassword,
        uloga: 'TRKAC' 
      }
    });

   
    return NextResponse.json(
      { message: 'Korisnik uspešno kreiran!', user: { id: noviKorisnik.id, email: noviKorisnik.email } },
      { status: 201 }
    );

  } catch (error) {
    console.error('Greška pri registraciji:', error);
    return NextResponse.json(
      { message: 'Došlo je do greške na serveru.' },
      { status: 500 }
    );
  }
}