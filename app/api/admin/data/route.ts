import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.korisnik.findMany();
  const races = await prisma.trka.findMany();
  return NextResponse.json({ users, races });
}