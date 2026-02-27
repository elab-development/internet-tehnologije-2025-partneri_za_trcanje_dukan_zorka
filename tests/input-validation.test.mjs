import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCommentInput,
  validateProfileUpdateInput,
  validateRaceInput
} from '../lib/input-validation.ts';

test('profile update: prihvata validan bio i cloudinary https url', () => {
  const result = validateProfileUpdateInput({
    bio: '  Trcim maratone.  ',
    slikaUrl: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg'
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.bio, 'Trcim maratone.');
    assert.equal(result.data.slikaUrl, 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg');
  }
});

test('profile update: odbija javascript url', () => {
  const result = validateProfileUpdateInput({
    slikaUrl: 'javascript:alert(1)'
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, 'Profilna slika mora biti HTTPS Cloudinary URL.');
  }
});

test('profile update: odbija non-cloudinary host', () => {
  const result = validateProfileUpdateInput({
    slikaUrl: 'https://example.com/pic.jpg'
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, 'Profilna slika mora biti HTTPS Cloudinary URL.');
  }
});

test('comment input: trimuje i prihvata validan komentar', () => {
  const result = validateCommentInput({
    tekst: '  Odlicna trka!  ',
    ocena: '5'
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.tekst, 'Odlicna trka!');
    assert.equal(result.data.ocena, 5);
  }
});

test('comment input: prihvata ocenu bez komentara', () => {
  const result = validateCommentInput({
    ocena: 4
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.tekst, '');
    assert.equal(result.data.ocena, 4);
  }
});

test('comment input: odbija ocenu van opsega', () => {
  const result = validateCommentInput({
    tekst: 'Super',
    ocena: 7
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, 'Ocena mora biti 1-5.');
  }
});

test('comment input: odbija predug komentar', () => {
  const longText = 'a'.repeat(501);
  const result = validateCommentInput({
    tekst: longText,
    ocena: 4
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, 'Komentar je predugačak (maks. 500 karaktera).');
  }
});

test('race input: prihvata validan payload', () => {
  const result = validateRaceInput({
    naziv: '  Jutarnja 5k  ',
    vreme: '2026-04-01T10:00:00.000Z',
    distanca: '5',
    lat: 44.7866,
    lng: 20.4489,
    opis: '  Lagano trcanje  ',
    tezina: '  Rekreativno  '
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.naziv, 'Jutarnja 5k');
    assert.equal(result.data.planiranaDistancaKm, 5);
    assert.equal(result.data.opis, 'Lagano trcanje');
    assert.equal(result.data.tezina, 'Rekreativno');
  }
});

test('race input: odbija invalidan datum', () => {
  const result = validateRaceInput({
    naziv: 'Test trka',
    vreme: 'nije-datum',
    distanca: 5,
    lat: 44.7,
    lng: 20.4
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, 'Neispravno vreme početka trke.');
  }
});

test('race input: odbija distancu <= 0', () => {
  const result = validateRaceInput({
    naziv: 'Test trka',
    vreme: '2026-04-01T10:00:00.000Z',
    distanca: 0,
    lat: 44.7,
    lng: 20.4
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, 'Distanca mora biti broj veći od 0.');
  }
});
