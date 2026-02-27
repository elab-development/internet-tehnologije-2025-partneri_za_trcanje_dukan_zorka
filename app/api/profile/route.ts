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
                 _count: {
                   select: {
                     ucesnici: {
                       where: {
                         status: 'PRIHVACENO'
                       }
                     }
                   }
                 }
               }
            },
            rezultat: true
          }
        },
        organizovaneTrke: {
          include: {
            organizator: { select: { id: true, imePrezime: true } },
            _count: {
              select: {
                ucesnici: {
                  where: {
                    status: 'PRIHVACENO'
                  }
                }
              }
            }
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

    const now = new Date();

    const sharedRuns = await prisma.ucesce.findMany({
      where: {
        status: 'PRIHVACENO',
        korisnikId: { not: korisnik.id },
        trka: {
          vremePocetka: { lt: now },
          OR: [
            {
              organizatorId: korisnik.id
            },
            {
              ucesnici: {
                some: {
                  korisnikId: korisnik.id,
                  status: 'PRIHVACENO'
                }
              }
            }
          ]
        }
      },
      select: {
        korisnikId: true,
        korisnik: {
          select: {
            id: true,
            imePrezime: true,
            slikaUrl: true
          }
        },
        trka: {
          select: {
            id: true,
            naziv: true,
            vremePocetka: true,
            planiranaDistancaKm: true,
            tezina: true,
            status: true,
            opis: true,
            organizator: {
              select: {
                id: true,
                imePrezime: true
              }
            }
          }
        }
      }
    });

    const organizerRuns = await prisma.ucesce.findMany({
      where: {
        korisnikId: korisnik.id,
        status: 'PRIHVACENO',
        trka: {
          vremePocetka: { lt: now },
          organizatorId: { not: korisnik.id }
        }
      },
      select: {
        trka: {
          select: {
            id: true,
            naziv: true,
            vremePocetka: true,
            planiranaDistancaKm: true,
            tezina: true,
            status: true,
            opis: true,
            organizator: {
              select: {
                id: true,
                imePrezime: true,
                slikaUrl: true
              }
            }
          }
        }
      }
    });

    const partnersMap = new Map<number, {
      id: number;
      imePrezime: string;
      slikaUrl: string | null;
      zajednickeTrkeCount: number;
      poslednjaZajednickaTrka: Date;
      poslednjaZajednickaTrkaNaziv: string;
      zajednickeTrke: Array<{
        id: number;
        naziv: string;
        vremePocetka: Date;
        planiranaDistancaKm: number;
        tezina: string;
        status: string;
        opis: string | null;
        organizatorIme: string;
      }>;
    }>();

    const upsertPartnerRace = (
      partnerId: number,
      partner: { id: number; imePrezime: string; slikaUrl: string | null },
      race: {
        id: number;
        naziv: string;
        vremePocetka: Date;
        planiranaDistancaKm: number;
        tezina: string;
        status: string;
        opis: string | null;
        organizatorIme: string;
      }
    ) => {
      const existing = partnersMap.get(partnerId);
      if (!existing) {
        partnersMap.set(partnerId, {
          id: partner.id,
          imePrezime: partner.imePrezime,
          slikaUrl: partner.slikaUrl,
          zajednickeTrkeCount: 1,
          poslednjaZajednickaTrka: race.vremePocetka,
          poslednjaZajednickaTrkaNaziv: race.naziv,
          zajednickeTrke: [race]
        });
        return;
      }

      if (existing.zajednickeTrke.some((r) => r.id === race.id)) {
        return;
      }

      existing.zajednickeTrkeCount += 1;
      if (race.vremePocetka > existing.poslednjaZajednickaTrka) {
        existing.poslednjaZajednickaTrka = race.vremePocetka;
        existing.poslednjaZajednickaTrkaNaziv = race.naziv;
      }
      existing.zajednickeTrke.push(race);
    };

    for (const run of sharedRuns) {
      upsertPartnerRace(
        run.korisnikId,
        {
          id: run.korisnik.id,
          imePrezime: run.korisnik.imePrezime,
          slikaUrl: run.korisnik.slikaUrl ?? null
        },
        {
          id: run.trka.id,
          naziv: run.trka.naziv,
          vremePocetka: run.trka.vremePocetka,
          planiranaDistancaKm: run.trka.planiranaDistancaKm,
          tezina: run.trka.tezina,
          status: run.trka.status,
          opis: run.trka.opis,
          organizatorIme: run.trka.organizator.imePrezime
        }
      );
    }

    for (const run of organizerRuns) {
      upsertPartnerRace(
        run.trka.organizator.id,
        {
          id: run.trka.organizator.id,
          imePrezime: run.trka.organizator.imePrezime,
          slikaUrl: run.trka.organizator.slikaUrl ?? null
        },
        {
        id: run.trka.id,
        naziv: run.trka.naziv,
        vremePocetka: run.trka.vremePocetka,
        planiranaDistancaKm: run.trka.planiranaDistancaKm,
        tezina: run.trka.tezina,
        status: run.trka.status,
        opis: run.trka.opis,
        organizatorIme: run.trka.organizator.imePrezime
        }
      );
    }

    const runningPartners = Array.from(partnersMap.values())
      .map((partner) => ({
        ...partner,
        zajednickeTrke: partner.zajednickeTrke
          .sort((a, b) => b.vremePocetka.getTime() - a.vremePocetka.getTime())
          .slice(0, 10)
      }))
      .sort((a, b) => {
        if (b.zajednickeTrkeCount !== a.zajednickeTrkeCount) {
          return b.zajednickeTrkeCount - a.zajednickeTrkeCount;
        }
        return b.poslednjaZajednickaTrka.getTime() - a.poslednjaZajednickaTrka.getTime();
      })
      .slice(0, 12);

    const res = NextResponse.json({ ...korisnik, pendingRequests, runningPartners }, { status: 200 });
    await ensureCsrfCookie(res);
    return res;
  } catch {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
