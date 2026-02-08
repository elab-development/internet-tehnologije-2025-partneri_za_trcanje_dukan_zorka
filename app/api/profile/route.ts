import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    const korisnik = await prisma.korisnik.findUnique({
      where: { email },
      include: {
        ucesca: {
          include: {
            trka: { 
               include: { organizator: true }
            }
          }
        },
        organizovaneTrke: true,
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

    return NextResponse.json({ ...korisnik, pendingRequests }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
