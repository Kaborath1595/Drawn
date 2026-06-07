# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Drawn** is a monorepo consisting of three applications for the MindShift anxiety tracking system:
- **drawn-api**: NestJS backend API (Node 20, MongoDB)
- **drawn-web**: React web application (Vite PWA)
- **drawn-app**: React Native mobile app (Expo)

Patients press an "Anxiety" button to log episodes. Specialists view totals and rankings by date range.

## Monorepo Structure

```
Drawn/
├── drawn-api/          # NestJS backend
├── drawn-web/          # React web frontend (Vite)
├── drawn-app/          # React Native mobile (Expo)
└── drawn.code-workspace
```

Each workspace folder is independent with its own `package.json` and build pipeline.

## Build & Development Commands

### drawn-api (NestJS Backend)
```bash
# Install dependencies
cd drawn-api && yarn

# Development server with hot-reload
yarn start:dev

# Build for production
yarn build

# Run in production
yarn start:prod

# Linting and formatting
yarn lint        # ESLint with auto-fix
yarn format      # Prettier

# Testing
yarn test              # Unit tests (Jest)
yarn test:watch        # Watch mode
yarn test:cov          # Coverage report
yarn test:debug        # Debug mode
yarn test:e2e          # E2E tests
```

**Configuration:**
- TypeScript: `tsconfig.json` (ES2023, decorators enabled)
- Port: 3000 (or via `PORT` env var)
- `.env` required: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`
- Jest config in `package.json`; E2E config in `test/jest-e2e.json`

### drawn-web (Vite + React)
```bash
cd drawn-web && yarn

yarn dev        # Dev server (http://localhost:5173)
yarn build      # Build to dist/
yarn lint       # ESLint
yarn preview    # Preview production build
```

**Configuration:**
- `vite.config.ts`: React plugin + PWA plugin (service worker auto-update)
- `.env`: `VITE_API_URL` (defaults to http://localhost:3000)
- Manifest icons: `public/icon-192.png`, `public/icon-512.png`

### drawn-app (Expo + React Native)
```bash
cd drawn-app && yarn

yarn start     # Expo development server (choose platform at prompt)
yarn android   # Run on Android
yarn ios       # Run on iOS
yarn web       # Run web variant
```

**Configuration:**
- `app.json`: Expo config (app name, icon, Android/iOS settings)
- `.env`: `EXPO_PUBLIC_API_URL` (defaults to http://localhost:3000)
- Change IP in `.env` when testing on physical device

## High-Level Architecture

### Modular MVC

El **drawn-api** usa arquitectura modular MVC plana (migrado desde hexagonal el 2026-06-07). Cada módulo tiene controller + service + schema + DTOs, sin capas de dominio ni ports abstractos.

```
src/modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts       # login, register (bcrypt + JWT)
│   ├── auth.module.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
├── users/
│   ├── users.service.ts      # findByUsername, existsByUsername, create
│   ├── users.module.ts       # exporta UsersService → lo usa AuthModule
│   └── schemas/
│       └── user.schema.ts
└── clicks/
    ├── clicks.controller.ts
    ├── clicks.service.ts     # registerClick, getSummary, getRanking
    ├── clicks.module.ts      # importa AuthModule para JwtAuthGuard
    ├── schemas/
    │   └── click.schema.ts
    └── dto/
        └── clicks-filter.dto.ts
```

### Authentication Flow

1. **Registration** (`POST /auth/register`): Username + password → hashed with bcrypt → stored in MongoDB
2. **Login** (`POST /auth/login`): Username + password → bcrypt verify → JWT signed
3. **Protected routes** (`/clicks/*`): JWT decoded by `JwtStrategy` → user attached to request
4. JWT payload: `{ sub: userId, username, role: 'patient' | 'specialist' }`

### Click Tracking Pipeline

1. **Web/Mobile** calls `POST /clicks` (JWT-protected) with auth context
2. **ClicksController** extracts `userId` and `username` from JWT
3. **RegisterClickUseCase** calls `clickRepo.save(userId, username)`
4. **MongooseClickRepository** persists Click document with `createdAt`
5. **Analytics endpoints** (`GET /clicks/summary`, `GET /clicks/ranking`) aggregate by date range

### Timezone — Bucket de Clicks

El campo `date` del bucket **no es un timestamp real UTC**, es una clave nominal del día chileno. Se calcula así:

```typescript
// clicks.service.ts → registerClick()
const localStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const date = new Date(localStr + 'T00:00:00.000Z');
// 23:00 Chile (Jun 7) → "2026-06-07" → 2026-06-07T00:00:00.000Z  ✓
// sin fix: setUTCHours(0,0,0,0) → 2026-06-08T00:00:00.000Z       ✗
```

Los filtros `from`/`to` del query **deben venir como date string sin hora** (`"2026-06-07"`, no ISO con offset). `new Date("2026-06-07")` parsea como `2026-06-07T00:00:00.000Z`, que hace match exacto con la clave del bucket. DST de Chile (`America/Santiago` varía entre UTC-3 y UTC-4) se maneja automáticamente con `toLocaleDateString`.

### Frontend Offline Support

Both **drawn-web** and **drawn-app** implement a click queue system:
- When `POST /clicks` fails (no network), enqueue the click locally (IndexedDB for web, AsyncStorage for mobile)
- Display pending count to user
- Auto-retry when network returns
- Files: `drawn-web/src/services/clickQueue.ts`, `drawn-app/src/services/clickQueue.ts`

### Database Schema (MongoDB)

**Users**
```javascript
{
  _id: ObjectId,
  username: String,        // unique
  password: String,        // bcrypt hash
  role: 'patient' | 'specialist',
  createdAt: Date
}
```

**Clicks**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // ref to Users._id
  username: String,        // denormalized for ranking queries
  createdAt: Date
}
```

## Module Dependencies

```
auth.module
  → uses: UserRepositoryPort (provided by users.module)
  → exports: JwtStrategy, PassportModule
  
clicks.module
  → independent; uses: ClickRepositoryPort (self-contained)

users.module
  → independent; no dependencies
```

The `AuthModule` imports `UsersModule` to access user persistence.

## Environment Variables

**drawn-api/.env**
```
MONGODB_URI=mongodb://localhost:27017/drawn
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=3000
```

**drawn-web/.env**
```
VITE_API_URL=http://localhost:3000
```

**drawn-app/.env**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| **API** | NestJS | 11.x |
| **API ORM** | Mongoose | 9.6.3 |
| **Auth** | JWT + bcrypt | 11.0.2 / 6.0.0 |
| **Web** | React + Vite | 19.2.6 / 8.0 |
| **Web PWA** | vite-plugin-pwa | 1.3.0 |
| **Mobile** | React Native + Expo | 0.85.3 / 56.0 |
| **Testing** | Jest + ts-jest | 30.0 / 29.2.5 |
| **Linting** | ESLint + TypeScript-ESLint | 9.x / 8.x |

## Agregar un nuevo módulo

1. Crear `modules/X/X.service.ts`, `X.controller.ts`, `X.module.ts`
2. Agregar schema en `modules/X/schemas/X.schema.ts` con `@Schema()` y `SchemaFactory`
3. Agregar DTOs en `modules/X/dto/`
4. Registrar `MongooseModule.forFeature(...)` en el módulo
5. Importar el módulo en `app.module.ts`

## Important Notes

- **Yarn workspaces not used**: Each app manages its own `node_modules`. Install separately per folder.
- **Port 3000**: API runs here by default; web/app configured to hit this URL.
- **CORS enabled**: API has `app.enableCors()` in `main.ts` for cross-origin requests.
- **Validation**: Global `ValidationPipe` in API with `whitelist: true` and `transform: true`—DTO validation and type coercion automatic.
- **Mongoose timestamps**: Click and User schemas auto-track `createdAt`. Queries on date range use this field.
