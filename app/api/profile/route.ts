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
        organizovaneTrke: true 
      }
    });

    return NextResponse.json(korisnik, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}