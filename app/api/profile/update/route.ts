import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { validateProfileUpdateInput } from '@/lib/input-validation';

export async function PUT(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { bio, slikaUrl } = body;

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const validation = validateProfileUpdateInput({ bio, slikaUrl });
    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const azuriranKorisnik = await prisma.korisnik.update({
      where: { id: auth.id },
      data: validation.data
    });

    return NextResponse.json({ message: 'Profil ažuriran!', user: azuriranKorisnik }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
