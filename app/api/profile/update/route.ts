import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export async function PUT(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { bio, slikaUrl } = body;

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const data: { bio?: string | null; slikaUrl?: string | null } = {};

    if (bio !== undefined) {
      if (bio === null) {
        data.bio = null;
      } else if (typeof bio === 'string') {
        const normalizedBio = bio.trim();
        if (normalizedBio.length > 500) {
          return NextResponse.json({ message: 'Biografija je preduga (maks. 500 karaktera).' }, { status: 400 });
        }
        data.bio = normalizedBio;
      } else {
        return NextResponse.json({ message: 'Neispravan format biografije.' }, { status: 400 });
      }
    }

    if (slikaUrl !== undefined) {
      if (slikaUrl === null || slikaUrl === '') {
        data.slikaUrl = null;
      } else if (typeof slikaUrl === 'string') {
        const normalizedUrl = slikaUrl.trim();
        let parsed: URL;

        try {
          parsed = new URL(normalizedUrl);
        } catch {
          return NextResponse.json({ message: 'Neispravan URL profilne slike.' }, { status: 400 });
        }

        const isHttps = parsed.protocol === 'https:';
        const isCloudinary = parsed.hostname === 'res.cloudinary.com';

        if (!isHttps || !isCloudinary) {
          return NextResponse.json(
            { message: 'Profilna slika mora biti HTTPS Cloudinary URL.' },
            { status: 400 }
          );
        }

        data.slikaUrl = normalizedUrl;
      } else {
        return NextResponse.json({ message: 'Neispravan format URL-a slike.' }, { status: 400 });
      }
    }

    const azuriranKorisnik = await prisma.korisnik.update({
      where: { id: auth.id },
      data
    });

    return NextResponse.json({ message: 'Profil ažuriran!', user: azuriranKorisnik }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
