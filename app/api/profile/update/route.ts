import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { bio, slikaUrl } = body;

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    
    const data: { bio?: string | null; slikaUrl?: string | null } = {};
    if (bio !== undefined) data.bio = bio;
    if (slikaUrl !== undefined) data.slikaUrl = slikaUrl;

    const azuriranKorisnik = await prisma.korisnik.update({
      where: { id: auth.id },
      data
    });

    return NextResponse.json({ message: 'Profil ažuriran!', user: azuriranKorisnik }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
