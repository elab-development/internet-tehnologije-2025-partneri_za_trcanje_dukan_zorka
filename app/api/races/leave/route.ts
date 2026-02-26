import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export async function DELETE(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { trkaId } = body;

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }
    const korisnikId = auth.id;

    
    await prisma.ucesce.deleteMany({
      where: {
        trkaId: Number(trkaId),
        korisnikId: Number(korisnikId)
      }
    });

    return NextResponse.json({ message: 'Uspešno otkazano.' }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
