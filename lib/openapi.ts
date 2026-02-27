export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TREP API',
    version: '1.0.0',
    description: 'API dokumentacija za aplikaciju Partneri za trcanje (TREP).'
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: 'Aktivno okruzenje'
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token',
        description: 'JWT sesija u cookie-ju'
      },
      csrfHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-csrf-token',
        description: 'CSRF token za mutacione rute'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Greška na serveru.' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'lozinka'],
        properties: {
          email: { type: 'string', format: 'email', example: 'korisnik@example.com' },
          lozinka: { type: 'string', example: 'tajna123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Uspešna prijava!' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              email: { type: 'string', format: 'email' },
              ime: { type: 'string', example: 'Pera Peric' },
              uloga: { type: 'string', example: 'TRKAC' },
              slikaUrl: { type: 'string', nullable: true }
            }
          }
        }
      },
      RaceItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          naziv: { type: 'string' },
          vremePocetka: { type: 'string', format: 'date-time' },
          lokacijaLat: { type: 'number' },
          lokacijaLng: { type: 'number' },
          planiranaDistancaKm: { type: 'number' },
          organizatorId: { type: 'integer' },
          tezina: { type: 'string' },
          status: { type: 'string' },
          organizator: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              imePrezime: { type: 'string' },
              slikaUrl: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true }
            }
          },
          _count: {
            type: 'object',
            properties: {
              ucesnici: { type: 'integer' }
            }
          },
          mojStatusPrijave: { type: 'string', nullable: true, example: 'NA_CEKANJU' }
        }
      },
      OrganizerRaceItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          naziv: { type: 'string' },
          vremePocetka: { type: 'string', format: 'date-time' },
          planiranaDistancaKm: { type: 'number' },
          lokacijaLat: { type: 'number' },
          lokacijaLng: { type: 'number' },
          status: { type: 'string', example: 'PLANIRANA' },
          tezina: { type: 'string', example: 'Rekreativno' },
          udaljenostKm: { type: 'number', nullable: true, example: 12.4 }
        }
      },
      OrganizerItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          imePrezime: { type: 'string', example: 'Pera Peric' },
          slikaUrl: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          trkeCount: { type: 'integer', example: 4 },
          poslednjaTrka: { type: 'string', format: 'date-time', nullable: true },
          trke: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrganizerRaceItem' }
          }
        }
      },
      OrganizersResponse: {
        type: 'object',
        properties: {
          organizers: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrganizerItem' }
          },
          meta: {
            type: 'object',
            properties: {
              radiusKm: { type: 'number', example: 30 },
              hasLocation: { type: 'boolean', example: true },
              query: { type: 'string', example: 'pera' },
              totalRaces: { type: 'integer', example: 12 },
              totalOrganizers: { type: 'integer', example: 5 }
            }
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Prijava korisnika',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Uspešna prijava',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          400: { description: 'Nevalidan zahtev' },
          401: { description: 'Pogrešni kredencijali' },
          500: {
            description: 'Serverska greška',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Odjava korisnika',
        security: [{ cookieAuth: [], csrfHeader: [] }],
        responses: {
          200: { description: 'Uspešna odjava' },
          403: { description: 'CSRF token nije validan' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Trenutno prijavljen korisnik',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Podaci o korisniku' },
          401: { description: 'Nije prijavljen' },
          404: { description: 'Korisnik ne postoji' }
        }
      }
    },
    '/api/races': {
      get: {
        tags: ['Races'],
        summary: 'Lista planiranih trka',
        responses: {
          200: {
            description: 'Uspešno vraćena lista trka',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RaceItem' }
                }
              }
            }
          },
          500: { description: 'Serverska greška' }
        }
      },
      post: {
        tags: ['Races'],
        summary: 'Kreiranje nove trke',
        security: [{ cookieAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['naziv', 'vreme', 'distanca', 'lat', 'lng'],
                properties: {
                  naziv: { type: 'string' },
                  vreme: { type: 'string', format: 'date-time' },
                  distanca: { type: 'string', example: '5' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  opis: { type: 'string' },
                  tezina: { type: 'string', example: 'Rekreativno' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Trka kreirana' },
          400: { description: 'Nevalidni podaci' },
          401: { description: 'Nije prijavljen' },
          403: { description: 'CSRF token nije validan' },
          500: { description: 'Serverska greška' }
        }
      }
    },
    '/api/races/join': {
      post: {
        tags: ['Races'],
        summary: 'Slanje zahteva za prijavu na trku',
        security: [{ cookieAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['trkaId'],
                properties: {
                  trkaId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Zahtev poslat' },
          400: { description: 'Nevalidan zahtev' },
          401: { description: 'Nije prijavljen' },
          403: { description: 'CSRF token nije validan' },
          404: { description: 'Trka ili korisnik ne postoji' },
          409: { description: 'Već prijavljen' }
        }
      }
    },
    '/api/races/delete': {
      delete: {
        tags: ['Races'],
        summary: 'Brisanje trke',
        security: [{ cookieAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['trkaId'],
                properties: {
                  trkaId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Trka obrisana' },
          401: { description: 'Nije prijavljen' },
          403: { description: 'Nema dozvolu ili CSRF problem' },
          404: { description: 'Trka ne postoji' }
        }
      }
    },
    '/api/profile/update': {
      put: {
        tags: ['Profile'],
        summary: 'Ažuriranje biografije/profilne slike',
        security: [{ cookieAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bio: { type: 'string', nullable: true },
                  slikaUrl: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Profil ažuriran' },
          401: { description: 'Nije prijavljen' },
          403: { description: 'CSRF token nije validan' }
        }
      }
    },
    '/api/organizers': {
      get: {
        tags: ['Organizers'],
        summary: 'Pretraga organizatora trka (prošle + buduće), opciono po lokaciji',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'q',
            required: false,
            schema: { type: 'string', maxLength: 80 },
            description: 'Pretraga po imenu i prezimenu organizatora'
          },
          {
            in: 'query',
            name: 'lat',
            required: false,
            schema: { type: 'number', minimum: -90, maximum: 90 },
            description: 'Latitude korisnika'
          },
          {
            in: 'query',
            name: 'lng',
            required: false,
            schema: { type: 'number', minimum: -180, maximum: 180 },
            description: 'Longitude korisnika'
          },
          {
            in: 'query',
            name: 'radiusKm',
            required: false,
            schema: { type: 'number', minimum: 1, default: 30 },
            description: 'Radijus pretrage u km'
          }
        ],
        responses: {
          200: {
            description: 'Lista organizatora i njihovih trka',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrganizersResponse' }
              }
            }
          },
          400: { description: 'Neispravni query parametri' },
          401: { description: 'Nije prijavljen' },
          500: { description: 'Serverska greška' }
        }
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Autentifikacija korisnika' },
    { name: 'Races', description: 'Upravljanje trkama i prijavama' },
    { name: 'Profile', description: 'Profil korisnika' },
    { name: 'Organizers', description: 'Pretraga i pregled organizatora trka' }
  ]
} as const;
