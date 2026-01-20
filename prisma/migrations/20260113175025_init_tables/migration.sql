-- CreateEnum
CREATE TYPE "Uloga" AS ENUM ('GOST', 'TRKAC', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusTrke" AS ENUM ('PLANIRANA', 'U_TOKU', 'ZAVRSENA', 'OTKAZANA');

-- CreateEnum
CREATE TYPE "StatusPrijave" AS ENUM ('NA_CEKANJU', 'PRIHVACENO', 'ODBIJENO');

-- CreateTable
CREATE TABLE "Korisnik" (
    "id" SERIAL NOT NULL,
    "imePrezime" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lozinkaHash" TEXT NOT NULL,
    "slikaUrl" TEXT,
    "ukupnoPredjeniKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uloga" "Uloga" NOT NULL DEFAULT 'TRKAC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Korisnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trka" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "vremePocetka" TIMESTAMP(3) NOT NULL,
    "lokacijaLat" DOUBLE PRECISION NOT NULL,
    "lokacijaLng" DOUBLE PRECISION NOT NULL,
    "planiranaDistancaKm" DOUBLE PRECISION NOT NULL,
    "opis" TEXT,
    "status" "StatusTrke" NOT NULL DEFAULT 'PLANIRANA',
    "organizatorId" INTEGER NOT NULL,

    CONSTRAINT "Trka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ucesce" (
    "id" SERIAL NOT NULL,
    "status" "StatusPrijave" NOT NULL DEFAULT 'NA_CEKANJU',
    "korisnikId" INTEGER NOT NULL,
    "trkaId" INTEGER NOT NULL,

    CONSTRAINT "Ucesce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rezultat" (
    "id" SERIAL NOT NULL,
    "predjeniKm" DOUBLE PRECISION NOT NULL,
    "vremeTrajanja" TEXT NOT NULL,
    "ucesceId" INTEGER NOT NULL,

    CONSTRAINT "Rezultat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Komentar" (
    "id" SERIAL NOT NULL,
    "tekst" TEXT NOT NULL,
    "ocena" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" INTEGER NOT NULL,
    "trkaId" INTEGER NOT NULL,

    CONSTRAINT "Komentar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obavestenje" (
    "id" SERIAL NOT NULL,
    "tekst" TEXT NOT NULL,
    "procitano" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "korisnikId" INTEGER NOT NULL,

    CONSTRAINT "Obavestenje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_email_key" ON "Korisnik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ucesce_korisnikId_trkaId_key" ON "Ucesce"("korisnikId", "trkaId");

-- CreateIndex
CREATE UNIQUE INDEX "Rezultat_ucesceId_key" ON "Rezultat"("ucesceId");

-- AddForeignKey
ALTER TABLE "Trka" ADD CONSTRAINT "Trka_organizatorId_fkey" FOREIGN KEY ("organizatorId") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ucesce" ADD CONSTRAINT "Ucesce_korisnikId_fkey" FOREIGN KEY ("korisnikId") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ucesce" ADD CONSTRAINT "Ucesce_trkaId_fkey" FOREIGN KEY ("trkaId") REFERENCES "Trka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezultat" ADD CONSTRAINT "Rezultat_ucesceId_fkey" FOREIGN KEY ("ucesceId") REFERENCES "Ucesce"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Komentar" ADD CONSTRAINT "Komentar_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Komentar" ADD CONSTRAINT "Komentar_trkaId_fkey" FOREIGN KEY ("trkaId") REFERENCES "Trka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obavestenje" ADD CONSTRAINT "Obavestenje_korisnikId_fkey" FOREIGN KEY ("korisnikId") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
