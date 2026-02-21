import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';

export async function GET() {
  const auth = await getAuthPayloadFromCookies();
  if (!auth) {
    return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
  }
  if (auth.uloga !== 'ADMIN') {
    return NextResponse.json({ message: 'Nemaš pristup.' }, { status: 403 });
  }

  const users = await prisma.korisnik.findMany({
    select: {
      id: true,
      imePrezime: true,
      uloga: true
    },
    orderBy: { imePrezime: 'asc' }
  });

  const races = await prisma.trka.findMany({
    select: {
      id: true,
      naziv: true,
      vremePocetka: true,
      planiranaDistancaKm: true,
      status: true,
      tezina: true,
      opis: true,
      organizator: {
        select: {
          id: true,
          imePrezime: true
        }
      },
      _count: {
        select: {
          ucesnici: true
        }
      }
    },
    orderBy: { vremePocetka: 'desc' }
  });

  return NextResponse.json({ users, races });
}
