import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { bio } = body;

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    
    const azuriranKorisnik = await prisma.korisnik.update({
      where: { id: auth.id },
      data: {
        bio: bio 
      }
    });

    return NextResponse.json({ message: 'Profil ažuriran!', user: azuriranKorisnik }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
