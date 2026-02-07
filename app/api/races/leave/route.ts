import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { trkaId, korisnikId } = body;

    
    await prisma.ucesce.deleteMany({
      where: {
        trkaId: parseInt(trkaId),
        korisnikId: parseInt(korisnikId)
      }
    });

    return NextResponse.json({ message: 'Uspešno otkazano.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}