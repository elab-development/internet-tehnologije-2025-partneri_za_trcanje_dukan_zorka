import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { trkaId, userId } = body; 

   
    const trka = await prisma.trka.findUnique({
      where: { id: parseInt(trkaId) }
    });

    if (!trka) return NextResponse.json({ message: 'Trka ne postoji.' }, { status: 404 });

    
    const korisnik = await prisma.korisnik.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!korisnik) return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });

   
    const isOwner = trka.organizatorId === korisnik.id;
    const isAdmin = korisnik.uloga === 'ADMIN'; 

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Nemaš dozvolu da obrišeš ovu trku.' }, { status: 403 });
    }

    await prisma.komentar.deleteMany({ where: { trkaId: parseInt(trkaId) } });
    await prisma.ucesce.deleteMany({ where: { trkaId: parseInt(trkaId) } });
    await prisma.trka.delete({ where: { id: parseInt(trkaId) } });

    return NextResponse.json({ message: 'Trka obrisana.' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}