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
    const userId = auth.id;

    if (trkaId === undefined || trkaId === null) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }
    const trkaIdNum = Number(trkaId);
    if (Number.isNaN(trkaIdNum)) {
      return NextResponse.json({ message: 'Neispravan ID trke.' }, { status: 400 });
    }

   
    const trka = await prisma.trka.findUnique({
      where: { id: trkaIdNum }
    });

    if (!trka) return NextResponse.json({ message: 'Trka ne postoji.' }, { status: 404 });

    
    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(userId) }
    });

    if (!korisnik) return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });

   
    const isOwner = trka.organizatorId === korisnik.id;
    const isAdmin = korisnik.uloga === 'ADMIN'; 

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Nemaš dozvolu da obrišeš ovu trku.' }, { status: 403 });
    }

    await prisma.rezultat.deleteMany({
      where: { ucesce: { trkaId: trkaIdNum } }
    });
    await prisma.komentar.deleteMany({ where: { trkaId: trkaIdNum } });
    await prisma.ucesce.deleteMany({ where: { trkaId: trkaIdNum } });
    await prisma.trka.delete({ where: { id: trkaIdNum } });

    return NextResponse.json({ message: 'Trka obrisana.' }, { status: 200 });

  } catch (error) {
    console.error('DELETE /api/races/delete error:', error);
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}
