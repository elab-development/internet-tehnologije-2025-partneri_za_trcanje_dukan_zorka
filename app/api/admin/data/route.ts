import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';

export async function GET() {
  const auth = await getAuthPayloadFromCookies();
  if (!auth) {
    return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
  }
  if (auth.uloga !== 'ADMIN') {
    return NextResponse.json({ message: 'Nemaš pristup.' }, { status: 403 });
  }

  const users = await prisma.korisnik.findMany();
  const races = await prisma.trka.findMany();
  return NextResponse.json({ users, races });
}
