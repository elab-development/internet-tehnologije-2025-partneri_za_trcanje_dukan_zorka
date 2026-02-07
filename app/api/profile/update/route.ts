import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, bio } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email je obavezan.' }, { status: 400 });
    }

    
    const azuriranKorisnik = await prisma.korisnik.update({
      where: { email },
      data: {
        bio: bio 
      }
    });

    return NextResponse.json({ message: 'Profil ažuriran!', user: azuriranKorisnik }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}