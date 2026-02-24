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

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }
    if (auth.uloga !== 'ADMIN') {
      return NextResponse.json({ message: 'Nemaš pristup.' }, { status: 403 });
    }

    const { targetUserId } = await req.json();
    const id = Number(targetUserId);

    if (isNaN(id)) {
      return NextResponse.json({ message: 'Nevalidan ID korisnika.' }, { status: 400 });
    }
    if (id === auth.id) {
      return NextResponse.json({ message: 'Ne možeš obrisati svoj nalog iz admin panela.' }, { status: 403 });
    }

    const trkeKorisnika = await prisma.trka.findMany({
      where: { organizatorId: id },
      select: { id: true }
    });
    const trkeIds = trkeKorisnika.map(t => t.id);

   
    const ucescaIds = await prisma.ucesce.findMany({
      where: {
        OR: [
          { korisnikId: id },
          { trkaId: { in: trkeIds } }
        ]
      },
      select: { id: true }
    });
    const idsZaBrisanjeRezultata = ucescaIds.map(u => u.id);

    await prisma.$transaction([
      
      prisma.rezultat.deleteMany({
        where: { ucesceId: { in: idsZaBrisanjeRezultata } }
      }),

      
      prisma.komentar.deleteMany({
        where: {
          OR: [
            { autorId: id },
            { trkaId: { in: trkeIds } }
          ]
        }
      }),

     
      prisma.ucesce.deleteMany({
        where: {
          OR: [
            { korisnikId: id },
            { trkaId: { in: trkeIds } }
          ]
        }
      }),

      prisma.obavestenje.deleteMany({ where: { korisnikId: id } }),

      prisma.trka.deleteMany({ where: { organizatorId: id } }),

      prisma.korisnik.delete({ where: { id: id } })
    ]);

    return NextResponse.json({ message: 'Korisnik i apsolutno svi povezani podaci obrisani.' });
  } catch (error: any) {
    console.error("DETALJNA GREŠKA U TERMINALU:", error);
    return NextResponse.json({ message: 'Greška pri brisanju: ' + error.message }, { status: 500 });
  }
}
