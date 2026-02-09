import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: 'Neispravan ID.' }, { status: 400 });
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id },
      select: {
        id: true,
        imePrezime: true,
        bio: true,
        slikaUrl: true,
        uloga: true,
        ukupnoPredjeniKm: true,
        organizovaneTrke: {
          select: {
            id: true,
            naziv: true,
            vremePocetka: true,
            planiranaDistancaKm: true
          },
          orderBy: { vremePocetka: 'desc' },
          take: 5
        }
      }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    const ratingAgg = await prisma.komentar.aggregate({
      where: { trka: { organizatorId: id } },
      _avg: { ocena: true },
      _count: { ocena: true }
    });

    const recentComments = await prisma.komentar.findMany({
      where: { trka: { organizatorId: id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        autor: { select: { imePrezime: true } },
        trka: { select: { naziv: true } }
      }
    });

    return NextResponse.json({
      ...korisnik,
      organizovaneTrkeCount: korisnik.organizovaneTrke.length,
      organizovaneTrke: korisnik.organizovaneTrke,
      avgOcena: ratingAgg._avg.ocena ?? null,
      brojOcena: ratingAgg._count.ocena,
      komentari: recentComments
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
