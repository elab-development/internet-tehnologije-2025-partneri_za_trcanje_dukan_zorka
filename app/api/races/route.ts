import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET() {
  try {
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
          select: { id: true, imePrezime: true, email: true, slikaUrl: true, bio: true }
        },
        ucesnici: { select: { id: true } }
      }
    });

    return NextResponse.json(trke, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška pri dohvatanju trka.' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { naziv, vreme, distanca, lat, lng, organizatorId, opis, tezina } = body;
   
    if (!naziv || !lat || !lng || !organizatorId) {
      return NextResponse.json({ message: 'Nedostaju podaci.' }, { status: 400 });
    }

    const novaTrka = await prisma.trka.create({
      data: {
        naziv,
        vremePocetka: new Date(vreme), 
        planiranaDistancaKm: parseFloat(distanca),
        lokacijaLat: lat,
        lokacijaLng: lng,
        opis: opis || "",
        organizatorId: parseInt(organizatorId),
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
