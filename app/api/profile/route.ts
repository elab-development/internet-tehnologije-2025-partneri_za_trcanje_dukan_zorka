import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { ensureCsrfCookie } from '@/lib/csrf';

export async function POST() {
  try {
    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: auth.id },
      include: {
        ucesca: {
          include: {
            trka: { 
               include: {
                 organizator: true,
                 _count: { select: { ucesnici: true } }
               }
            },
            rezultat: true
          }
        },
        organizovaneTrke: {
          include: {
            organizator: { select: { id: true, imePrezime: true } },
            _count: { select: { ucesnici: true } }
          },
          orderBy: { vremePocetka: 'desc' }
        },
        komentari: {
          select: { id: true, trkaId: true, tekst: true, ocena: true, createdAt: true }
        },
        obavestenja: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    const pendingRequests = await prisma.ucesce.findMany({
      where: {
        status: 'NA_CEKANJU',
        trka: { organizatorId: korisnik.id }
      },
      include: {
        korisnik: { select: { id: true, imePrezime: true, email: true } },
        trka: { select: { id: true, naziv: true, vremePocetka: true, planiranaDistancaKm: true } }
      },
      orderBy: { id: 'desc' }
    });

    const res = NextResponse.json({ ...korisnik, pendingRequests }, { status: 200 });
    await ensureCsrfCookie(res);
    return res;
  } catch {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
