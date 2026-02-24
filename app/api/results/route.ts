import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export async function PUT(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { ucesceId, predjeniKm, vremeTrajanja } = body;

    if (!ucesceId || !predjeniKm || !vremeTrajanja) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }
    const korisnikId = auth.id;

    const uId = Number(ucesceId);
    const kId = Number(korisnikId);
    const km = parseFloat(predjeniKm);

    if (Number.isNaN(uId) || Number.isNaN(kId) || Number.isNaN(km) || km <= 0) {
      return NextResponse.json({ message: 'Neispravni podaci.' }, { status: 400 });
    }

    const ucesce = await prisma.ucesce.findUnique({
      where: { id: uId },
      include: { trka: true }
    });

    if (!ucesce) {
      return NextResponse.json({ message: 'Učešće ne postoji.' }, { status: 404 });
    }

    if (ucesce.korisnikId !== kId) {
      return NextResponse.json({ message: 'Nemaš dozvolu.' }, { status: 403 });
    }

    if (ucesce.status !== 'PRIHVACENO') {
      return NextResponse.json({ message: 'Učešće nije prihvaćeno.' }, { status: 400 });
    }

    const rezultat = await prisma.rezultat.upsert({
      where: { ucesceId: uId },
      update: { predjeniKm: km, vremeTrajanja },
      create: {
        ucesceId: uId,
        predjeniKm: km,
        vremeTrajanja
      }
    });

    const results = await prisma.rezultat.findMany({
      where: { ucesce: { korisnikId: kId } },
      select: { predjeniKm: true }
    });
    const total = results.reduce((sum, r) => sum + r.predjeniKm, 0);
    await prisma.korisnik.update({
      where: { id: kId },
      data: { ukupnoPredjeniKm: total }
    });

    return NextResponse.json(rezultat, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
