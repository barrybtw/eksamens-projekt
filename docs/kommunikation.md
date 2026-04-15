# Servicekommunikation

## Oversigt over services

```
┌─────────────┐        ┌──────────────────────┐        ┌──────────────┐
│   Browser   │        │  React Router (SSR)  │        │  .NET API    │
│             │◄──────►│  Node.js / port 5173 │        │  port 5110   │
│             │        └──────────────────────┘        │              │
│             │                                         │              │
│             │◄───────── HTTP/JSON + cookie ──────────►│              │
└─────────────┘                                         └──────┬───────┘
                                                               │
                                                               │ EF Core
                                                               ▼
                                                        ┌──────────────┐
                                                        │  PostgreSQL  │
                                                        └──────────────┘
```

Systemet består af tre services: en React Router frontend (SSR), en .NET authentication API og en PostgreSQL database.

---

## Frontend → Browser

React Router kører med SSR (Server-Side Rendering). Det betyder at siden renderes på serveren og sendes som færdig HTML til browseren ved første load. Efterfølgende navigation sker client-side.

```
Browser                   React Router (Node.js)
  │                               │
  │── GET / (første besøg) ──────►│
  │◄── HTML (færdigrenderet) ─────│
  │                               │
  │── (client-side routing) ──────► ingen ny serverforespørgsel
```

---

## Frontend → .NET API

Alle API-kald laves direkte fra browseren (client-side fetch) til `.NET`-serveren på port `5110`. Der sendes og modtages JSON. Session holdes via en cookie (`.auth.session`).

```
Browser                          .NET API (port 5110)
  │                                      │
  │── POST /register ───────────────────►│
  │   { username, password }             │── validér input
  │                                      │── tjek om bruger eksisterer (DB)
  │                                      │── hash kodeord (bcrypt)
  │                                      │── gem bruger (DB)
  │◄── 200 OK ────────────────────────── │
  │
  │── POST /login ──────────────────────►│
  │   { username, password }             │── find bruger (DB)
  │                                      │── verificér kodeord (bcrypt)
  │                                      │── opret session
  │◄── 200 OK + Set-Cookie ─────────────│
  │
  │── GET /me (med cookie) ────────────►│
  │                                      │── læs session
  │◄── { username } ────────────────────│
  │
  │── POST /logout ─────────────────────►│
  │                                      │── slet session
  │◄── 200 OK ──────────────────────────│
  │
  │── PUT /change-password ─────────────►│
  │   { currentPassword, newPassword }   │── verificér nuværende kodeord
  │                                      │── opdatér hash (DB)
  │◄── 200 OK ──────────────────────────│
  │
  │── DELETE /delete-account ───────────►│
  │                                      │── slet bruger (DB)
  │                                      │── slet session
  │◄── 200 OK ──────────────────────────│
```

CORS er konfigureret til at tillade `localhost:5173` og `localhost:3000` med cookies (`AllowCredentials`).

---

## .NET API → PostgreSQL

.NET API'en kommunikerer med PostgreSQL via Entity Framework Core (EF Core). Der er én tabel: `Users` med kolonnerne `Id`, `Username` og `PasswordHash`.

```
.NET API                          PostgreSQL
  │                                   │
  │── SELECT * FROM Users ───────────►│  (login, /me, change-password)
  │── INSERT INTO Users ─────────────►│  (register)
  │── UPDATE Users SET ... ──────────►│  (change-password)
  │── DELETE FROM Users ─────────────►│  (delete-account)
```

Databasetabellerne oprettes automatisk ved opstart via `EnsureCreated()`.

---

## Session-håndtering

Sessionen lever udelukkende i .NET API'ens serverhukommelse (distribueret memory cache). Browseren modtager kun en cookie med et session-ID.

```
Browser                    .NET API (hukommelse)
  │                               │
  │── POST /login ───────────────►│
  │◄── Set-Cookie: .auth.session ─│  gemmer { username } i session-store
  │                               │
  │── GET /me + cookie ──────────►│
  │                               │── slår session-ID op → finder username
  │◄── { username } ─────────────│
```

Sessionen udløber efter **2 timer** uden aktivitet.
