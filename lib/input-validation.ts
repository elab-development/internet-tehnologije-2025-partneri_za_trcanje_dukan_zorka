type ValidationSuccess<T> = { ok: true; data: T };
type ValidationFailure = { ok: false; message: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

type ProfileUpdateData = { bio?: string | null; slikaUrl?: string | null };
type CommentData = { tekst: string; ocena: number };
type RaceData = {
  naziv: string;
  vremePocetka: Date;
  planiranaDistancaKm: number;
  lokacijaLat: number;
  lokacijaLng: number;
  opis: string;
  tezina: string;
};

export const validateProfileUpdateInput = (input: {
  bio?: unknown;
  slikaUrl?: unknown;
}): ValidationResult<ProfileUpdateData> => {
  const { bio, slikaUrl } = input;
  const data: ProfileUpdateData = {};

  if (bio !== undefined) {
    if (bio === null) {
      data.bio = null;
    } else if (typeof bio === 'string') {
      const normalizedBio = bio.trim();
      if (normalizedBio.length > 500) {
        return { ok: false, message: 'Biografija je preduga (maks. 500 karaktera).' };
      }
      data.bio = normalizedBio;
    } else {
      return { ok: false, message: 'Neispravan format biografije.' };
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
        return { ok: false, message: 'Neispravan URL profilne slike.' };
      }

      const isHttps = parsed.protocol === 'https:';
      const isCloudinary = parsed.hostname === 'res.cloudinary.com';
      if (!isHttps || !isCloudinary) {
        return { ok: false, message: 'Profilna slika mora biti HTTPS Cloudinary URL.' };
      }

      data.slikaUrl = normalizedUrl;
    } else {
      return { ok: false, message: 'Neispravan format URL-a slike.' };
    }
  }

  return { ok: true, data };
};

export const validateCommentInput = (input: {
  tekst?: unknown;
  ocena?: unknown;
}): ValidationResult<CommentData> => {
  if (input.tekst !== undefined && typeof input.tekst !== 'string') {
    return { ok: false, message: 'Komentar mora biti tekst.' };
  }

  const normalizedText = (input.tekst ?? '').toString().trim();
  const rating = Number(input.ocena);

  if (Number.isNaN(rating)) {
    return { ok: false, message: 'Neispravni podaci.' };
  }
  if (normalizedText.length > 500) {
    return { ok: false, message: 'Komentar je predugačak (maks. 500 karaktera).' };
  }
  if (rating < 1 || rating > 5) {
    return { ok: false, message: 'Ocena mora biti 1-5.' };
  }

  return {
    ok: true,
    data: {
      tekst: normalizedText,
      ocena: rating
    }
  };
};

export const validateRaceInput = (input: {
  naziv?: unknown;
  vreme?: unknown;
  distanca?: unknown;
  lat?: unknown;
  lng?: unknown;
  opis?: unknown;
  tezina?: unknown;
}): ValidationResult<RaceData> => {
  const nazivText = typeof input.naziv === 'string' ? input.naziv.trim() : '';
  const opisText = typeof input.opis === 'string' ? input.opis.trim() : '';
  const tezinaText = typeof input.tezina === 'string' ? input.tezina.trim() : 'Rekreativno';
  const latNum = Number(input.lat);
  const lngNum = Number(input.lng);
  const distancaNum = Number(input.distanca);
  const parsedStart = new Date(input.vreme as string);

  if (!nazivText || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return { ok: false, message: 'Nedostaju ili su neispravni podaci.' };
  }
  if (nazivText.length > 120) {
    return { ok: false, message: 'Naziv trke je predugačak (maks. 120 karaktera).' };
  }
  if (input.opis !== undefined && typeof input.opis !== 'string') {
    return { ok: false, message: 'Opis mora biti tekst.' };
  }
  if (opisText.length > 1000) {
    return { ok: false, message: 'Opis trke je predugačak (maks. 1000 karaktera).' };
  }
  if (input.tezina !== undefined && typeof input.tezina !== 'string') {
    return { ok: false, message: 'Težina trke mora biti tekst.' };
  }
  if (!tezinaText || tezinaText.length > 50) {
    return { ok: false, message: 'Neispravna vrednost za težinu trke.' };
  }
  if (!Number.isFinite(distancaNum) || distancaNum <= 0) {
    return { ok: false, message: 'Distanca mora biti broj veći od 0.' };
  }
  if (Number.isNaN(parsedStart.getTime())) {
    return { ok: false, message: 'Neispravno vreme početka trke.' };
  }

  return {
    ok: true,
    data: {
      naziv: nazivText,
      vremePocetka: parsedStart,
      planiranaDistancaKm: distancaNum,
      lokacijaLat: latNum,
      lokacijaLng: lngNum,
      opis: opisText,
      tezina: tezinaText
    }
  };
};
