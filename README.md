# TREP - Partneri za trcanje

Web aplikacija za povezivanje trkaca, pronalazak i organizaciju trka na mapi, prijavu ucesnika, unos rezultata i pracenje profila.

## Glavne funkcionalnosti

- JWT autentifikacija korisnika (`register`, `login`, `logout`, `me`)
- Prikaz trka na interaktivnoj mapi (Leaflet)
- Kreiranje trke, slanje zahteva za ucesce, odobravanje/odbijanje zahteva
- Upravljanje profilom korisnika (bio, profilna slika preko Cloudinary)
- Komentari i ocene zavrsenih trka
- Admin panel za pregled podataka i brisanje korisnika
- Stranica za pretragu organizatora trka u blizini (`/organizatori`)
- Swagger API dokumentacija (`/api-docs`)

## Tehnologije

- Next.js 16 (App Router, TypeScript)
- React 19
- Prisma ORM
- PostgreSQL (Neon)
- JWT (`jsonwebtoken` + `jose`)
- bcryptjs
- Tailwind CSS 4
- Leaflet / React-Leaflet
- Cloudinary API
- Docker + Docker Compose
- GitHub Actions (CI/CD)

## Eksterni API-ji

- Cloudinary API: upload i hostovanje profilnih slika
- Map tiles API (OpenStreetMap / Stadia Maps): prikaz mape i slojeva

## Struktura projekta

```text
app/
  api/                 # Next.js API rute
  components/          # UI komponente
  profile/             # Korisnicki profil
  users/[id]/          # Javni profil korisnika
  organizatori/        # Pretraga organizatora trka
  api-docs/            # Swagger UI
lib/
  auth.ts              # JWT helperi
  csrf.ts              # CSRF mehanizam (cookie + header + origin)
  csrf-client.ts       # Client helper za x-csrf-token header
  input-validation.ts  # Validacija ulaznih podataka
  openapi.ts           # OpenAPI specifikacija
prisma/
  schema.prisma
  migrations/
.github/workflows/
  ci-cd.yml
```

## Pokretanje lokalno

### 1. Instalacija

```bash
npm ci
```

### 2. Konfiguracija okruzenja

Kreiraj `.env` fajl sa sledecim varijablama:

```env
DATABASE_URL=
DATABASE_URL_UNPOOLED=
JWT_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
# opciono:
# CSRF_TRUSTED_ORIGINS=http://localhost:3000,https://tvoj-domen.com
```

### 3. Prisma i pokretanje

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Aplikacija: `http://localhost:3000`

## NPM skripte

- `npm run dev` - development server
- `npm run build` - produkcioni build
- `npm run start` - pokretanje produkcionog build-a
- `npm run lint` - ESLint provera
- `npm test` - automatizovani testovi

## Bezbednost (implementirano)

- SQL Injection:
Prisma koristi parametrizovane upite (prepared statements) kroz ORM metode.
- CSRF:
`sameSite: 'strict'` cookie politika + CSRF token mehanizam (`csrf_token` cookie + `x-csrf-token` header) + Origin provera.
- IDOR/BOLA:
Mutacione rute proveravaju vlasnistvo resursa i/ili ulogu korisnika (npr. rezultati, komentari, admin akcije, brisanje trke/korisnika).
- XSS:
React escaping + backend validacija i ogranicenje ulaznih polja (`lib/input-validation.ts`).

## Swagger / OpenAPI

- OpenAPI JSON: `GET /api/openapi`
- Swagger UI: `GET /api-docs`

Dokumentovane su kljucne auth, race, profile i organizers rute sa status kodovima (`200/201/400/401/403/404/409/500`).

## Testovi

Automatizovani testovi su u `tests/` i trenutno pokrivaju validaciju unosa (ukljucujuci sigurnosne negativne slucajeve za input format).

Pokretanje:

```bash
npm test
```

## CI/CD

Workflow: `.github/workflows/ci-cd.yml`

Na svaki `push` i `pull_request`:

1. `npm ci`
2. `npx prisma generate`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. build Docker image (`docker build -t trep-app:ci .`)

Deploy korak se pokrece na `main` i opcionalno aktivira webhook preko GitHub Secret-a:

- `DEPLOY_WEBHOOK_URL`

## Docker

Lokalno (compose):

```bash
docker compose up --build
```

Docker koristi `.env` iz root-a projekta.

## Cloud deploy

Aktuelna produkciona instanca:

- https://trep-app.onrender.com

Tipican Render setup:

- Build command: `npm ci && npx prisma generate && npm run build`
- Start command: `npx prisma migrate deploy && npm run start`
- Environment Variables: iste kao u `.env` (bez navodjenja tajnih vrednosti)

## Git grane

Koriscene grane:

- `main` (stabilna produkciona grana)
- `develop` (integraciona grana)
- `devops` (infrastruktura, CI/CD, deploy)
- `ui-glass`
- `ui-glass-jwt-auth`

## Napomena

Ako `npm run build` padne lokalno zbog Google fontova (`Geist`), uzrok je najcesce ogranicen mrezi pristup iz okruzenja. Na cloud platformama (Render/Vercel) build tipicno prolazi normalno.
