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
   
    if (!naziv || !lat || !lng) {
      return NextResponse.json({ message: 'Nedostaju podaci.' }, { status: 400 });
    }

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const novaTrka = await prisma.trka.create({
      data: {
        naziv,
        vremePocetka: new Date(vreme), 
        planiranaDistancaKm: parseFloat(distanca),
        lokacijaLat: lat,
        lokacijaLng: lng,
        opis: opis || "",
        organizatorId: auth.id,
        tezina: tezina || "Rekreativno",
        status: 'PLANIRANA'
      }
    });

    return NextResponse.json(novaTrka, { status: 201 });
  } catch (error) {
    console.error("Greška pri kreiranju trke:", error);
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}
