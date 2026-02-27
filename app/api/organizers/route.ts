import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';

const DEFAULT_RADIUS_KM = 30;
const MAX_RADIUS_KM = 200;

type OrganizerRace = {
  id: number;
  naziv: string;
  vremePocetka: Date;
  planiranaDistancaKm: number;
  lokacijaLat: number;
  lokacijaLng: number;
  status: string;
  tezina: string;
  udaljenostKm: number | null;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceInKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const parseCoordinate = (value: string | null, min: number, max: number) => {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return Number.NaN;
  }
  return parsed;
};

export async function GET(req: Request) {
  try {
    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') ?? '').trim();
    if (query.length > 80) {
      return NextResponse.json({ message: 'Pretraga je predugačka.' }, { status: 400 });
    }

    const lat = parseCoordinate(searchParams.get('lat'), -90, 90);
    const lng = parseCoordinate(searchParams.get('lng'), -180, 180);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ message: 'Neispravna lokacija.' }, { status: 400 });
    }

    const radiusInput = Number(searchParams.get('radiusKm') ?? DEFAULT_RADIUS_KM);
    if (!Number.isFinite(radiusInput) || radiusInput <= 0) {
      return NextResponse.json({ message: 'Neispravan radijus.' }, { status: 400 });
    }
    const radiusKm = Math.min(radiusInput, MAX_RADIUS_KM);

    const hasLocation = lat !== null && lng !== null;
    const where: {
      status: { in: Array<'PLANIRANA' | 'U_TOKU' | 'ZAVRSENA'> };
      organizatorId: { not: number };
      organizator?: { imePrezime: { contains: string; mode: 'insensitive' } };
      lokacijaLat?: { gte: number; lte: number };
      lokacijaLng?: { gte: number; lte: number };
    } = {
      status: { in: ['PLANIRANA', 'U_TOKU', 'ZAVRSENA'] },
      organizatorId: { not: auth.id }
    };

    if (query) {
      where.organizator = {
        imePrezime: { contains: query, mode: 'insensitive' }
      };
    }

    if (hasLocation) {
      const latDelta = radiusKm / 111;
      const longitudeDivider = Math.max(Math.cos(toRadians(lat)), 0.1);
      const lngDelta = radiusKm / (111 * longitudeDivider);
      where.lokacijaLat = { gte: lat - latDelta, lte: lat + latDelta };
      where.lokacijaLng = { gte: lng - lngDelta, lte: lng + lngDelta };
    }

    const races = await prisma.trka.findMany({
      where,
      select: {
        id: true,
        naziv: true,
        vremePocetka: true,
        planiranaDistancaKm: true,
        lokacijaLat: true,
        lokacijaLng: true,
        status: true,
        tezina: true,
        organizator: {
          select: {
            id: true,
            imePrezime: true,
            slikaUrl: true,
            bio: true
          }
        }
      },
      orderBy: { vremePocetka: 'desc' }
    });

    const filteredRaces = hasLocation
      ? races
          .map((race) => {
            const udaljenostKm = distanceInKm(lat, lng, race.lokacijaLat, race.lokacijaLng);
            return {
              ...race,
              udaljenostKm
            };
          })
          .filter((race) => race.udaljenostKm <= radiusKm)
      : races.map((race) => ({ ...race, udaljenostKm: null }));

    const organizersMap = new Map<
      number,
      {
        id: number;
        imePrezime: string;
        slikaUrl: string | null;
        bio: string | null;
        trke: OrganizerRace[];
      }
    >();

    for (const race of filteredRaces) {
      const existing = organizersMap.get(race.organizator.id);
      const raceSummary: OrganizerRace = {
        id: race.id,
        naziv: race.naziv,
        vremePocetka: race.vremePocetka,
        planiranaDistancaKm: race.planiranaDistancaKm,
        lokacijaLat: race.lokacijaLat,
        lokacijaLng: race.lokacijaLng,
        status: race.status,
        tezina: race.tezina,
        udaljenostKm: race.udaljenostKm
      };

      if (!existing) {
        organizersMap.set(race.organizator.id, {
          id: race.organizator.id,
          imePrezime: race.organizator.imePrezime,
          slikaUrl: race.organizator.slikaUrl,
          bio: race.organizator.bio,
          trke: [raceSummary]
        });
        continue;
      }

      existing.trke.push(raceSummary);
    }

    const organizers = Array.from(organizersMap.values())
      .map((organizer) => ({
        id: organizer.id,
        imePrezime: organizer.imePrezime,
        slikaUrl: organizer.slikaUrl,
        bio: organizer.bio,
        trkeCount: organizer.trke.length,
        poslednjaTrka: organizer.trke
          .slice()
          .sort((a, b) => b.vremePocetka.getTime() - a.vremePocetka.getTime())[0]?.vremePocetka ?? null,
        trke: organizer.trke
          .slice()
          .sort((a, b) => b.vremePocetka.getTime() - a.vremePocetka.getTime())
          .slice(0, 12)
      }))
      .sort((a, b) => {
        if (b.trkeCount !== a.trkeCount) {
          return b.trkeCount - a.trkeCount;
        }
        const aLast = a.poslednjaTrka ? new Date(a.poslednjaTrka).getTime() : 0;
        const bLast = b.poslednjaTrka ? new Date(b.poslednjaTrka).getTime() : 0;
        return bLast - aLast;
      });

    return NextResponse.json(
      {
        organizers,
        meta: {
          radiusKm,
          hasLocation,
          query,
          totalRaces: filteredRaces.length,
          totalOrganizers: organizers.length
        }
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: 'Greška pri učitavanju organizatora.' }, { status: 500 });
  }
}
