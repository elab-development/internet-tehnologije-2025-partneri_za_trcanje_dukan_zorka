import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';


export async function GET() {
  try {
    const auth = await getAuthPayloadFromCookies();

    const trke = await prisma.trka.findMany({
      where: {
        status: 'PLANIRANA' 
      },
      select: {
        id: true,
        naziv: true,
        vremePocetka: true,
        lokacijaLat: true,
        lokacijaLng: true,
        planiranaDistancaKm: true,
        organizatorId: true,
        tezina: true,
        status: true,
        organizator: {
          select: { id: true, imePrezime: true, slikaUrl: true, bio: true }
        },
        _count: {
          select: {
            ucesnici: true
          }
        },
        ucesnici: {
          where: auth ? { korisnikId: auth.id } : { korisnikId: -1 },
          select: {
            status: true
          }
        }
      }
    });

    const response = trke.map((trka) => ({
      id: trka.id,
      naziv: trka.naziv,
      vremePocetka: trka.vremePocetka,
      lokacijaLat: trka.lokacijaLat,
      lokacijaLng: trka.lokacijaLng,
      planiranaDistancaKm: trka.planiranaDistancaKm,
      organizatorId: trka.organizatorId,
      tezina: trka.tezina,
      status: trka.status,
      organizator: trka.organizator,
      _count: trka._count,
      mojStatusPrijave: trka.ucesnici[0]?.status ?? null
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška pri dohvatanju trka.' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { naziv, vreme, distanca, lat, lng, opis, tezina } = body;

    const nazivText = typeof naziv === 'string' ? naziv.trim() : '';
    const opisText = typeof opis === 'string' ? opis.trim() : '';
    const tezinaText = typeof tezina === 'string' ? tezina.trim() : 'Rekreativno';
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const distancaNum = Number(distanca);
    const parsedStart = new Date(vreme);

    if (!nazivText || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return NextResponse.json({ message: 'Nedostaju ili su neispravni podaci.' }, { status: 400 });
    }
    if (nazivText.length > 120) {
      return NextResponse.json({ message: 'Naziv trke je predugačak (maks. 120 karaktera).' }, { status: 400 });
    }
    if (opis !== undefined && typeof opis !== 'string') {
      return NextResponse.json({ message: 'Opis mora biti tekst.' }, { status: 400 });
    }
    if (opisText.length > 1000) {
      return NextResponse.json({ message: 'Opis trke je predugačak (maks. 1000 karaktera).' }, { status: 400 });
    }
    if (tezina !== undefined && typeof tezina !== 'string') {
      return NextResponse.json({ message: 'Težina trke mora biti tekst.' }, { status: 400 });
    }
    if (!tezinaText || tezinaText.length > 50) {
      return NextResponse.json({ message: 'Neispravna vrednost za težinu trke.' }, { status: 400 });
    }
    if (!Number.isFinite(distancaNum) || distancaNum <= 0) {
      return NextResponse.json({ message: 'Distanca mora biti broj veći od 0.' }, { status: 400 });
    }
    if (Number.isNaN(parsedStart.getTime())) {
      return NextResponse.json({ message: 'Neispravno vreme početka trke.' }, { status: 400 });
    }

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const novaTrka = await prisma.trka.create({
      data: {
        naziv: nazivText,
        vremePocetka: parsedStart,
        planiranaDistancaKm: distancaNum,
        lokacijaLat: latNum,
        lokacijaLng: lngNum,
        opis: opisText,
        organizatorId: auth.id,
        tezina: tezinaText,
        status: 'PLANIRANA'
      }
    });

    return NextResponse.json(novaTrka, { status: 201 });
  } catch (error) {
    console.error("Greška pri kreiranju trke:", error);
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}
