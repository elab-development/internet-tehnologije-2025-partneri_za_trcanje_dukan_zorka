import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { setCsrfCookie } from '@/lib/csrf';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, lozinka } = body;

    
    if (!email || !lozinka) {
      return NextResponse.json({ message: 'Unesite email i lozinku.' }, { status: 400 });
    }

    
    const korisnik = await prisma.korisnik.findUnique({
      where: { email }// SELECT * FROM korisnik WHERE email = ?
    });

    
    if (!korisnik) {
      return NextResponse.json({ message: 'Pogrešan email ili lozinka.' }, { status: 401 });
    }
    
    
    const lozinkaJeTacna = await bcrypt.compare(lozinka, korisnik.lozinkaHash);

    if (!lozinkaJeTacna) {
      return NextResponse.json({ message: 'Pogrešan email ili lozinka.' }, { status: 401 });
    }

    const payload = {
      id: korisnik.id,
      email: korisnik.email,
      ime: korisnik.imePrezime,
      uloga: korisnik.uloga
    };

    const token = signToken(payload);
    const res = NextResponse.json({ 
      message: 'Uspešna prijava!',
      user: {
        ...payload,
        slikaUrl: korisnik.slikaUrl ?? null
      }
    }, { status: 200 });

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    setCsrfCookie(res);

    return res;

  } catch (error) {
    console.error('Login greška:', error);
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}
