# Drawn — Progreso del proyecto

## Qué es

Backend + frontend para la app de ansiedad de MindShift. Pacientes presionan un botón "Tengo ansiedad" y el sistema registra los clics. Especialistas pueden ver totales y ranking por rango de fechas.

---

## Stack

| Capa | Tecnología |
|---|---|
| **API** | NestJS 11, Node 20, Yarn |
| **Base de datos** | MongoDB con Mongoose |
| **Auth** | JWT + bcrypt |
| **Web** | React + Vite (PWA) |
| **Mobile** | React Native + Expo SDK 56 |
| **Offline Web** | Service Worker + Background Sync + IndexedDB |
| **Offline Mobile** | NetInfo + AsyncStorage |
| **Seguridad Mobile** | expo-secure-store |

---

## Rutas del proyecto

```
C:\Users\vices\Desktop\Drawn\
├── drawn-api/
├── drawn-web/
└── drawn-app/
```

---

## Arquitectura — drawn-api

MVC modular plana (migrado desde hexagonal):

```
src/modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts          # login, register (bcrypt + JWT)
│   ├── auth.module.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts       # protege por rol (specialist)
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts      # sin campo role — siempre crea patient
├── users/
│   ├── users.service.ts
│   ├── users.module.ts
│   └── schemas/user.schema.ts
└── clicks/
    ├── clicks.controller.ts     # SkipThrottle — rate limit no aplica acá
    ├── clicks.service.ts        # bucket por día con timezone Chile
    ├── clicks.module.ts
    ├── schemas/click.schema.ts  # índice compuesto {userId, date} unique
    └── dto/clicks-filter.dto.ts
```

---

## Endpoints

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| POST | `/auth/register` | No | — | Crea usuario (siempre patient) |
| POST | `/auth/login` | No | — | Login → JWT |
| POST | `/clicks` | JWT | patient | Registra un click |
| GET | `/clicks/summary?from=&to=` | JWT | specialist | Total de clicks en rango |
| GET | `/clicks/ranking?from=&to=&limit=` | JWT | specialist | Top pacientes |

---

## Seguridad implementada

- bcrypt 10 rounds
- JWT con `ignoreExpiration: false`
- Registro no acepta campo `role` — especialistas se crean manualmente en DB
- `summary` y `ranking` protegidos con `JwtAuthGuard` + `RolesGuard`
- Rate limiting global: 10 req/min (throttler) — clicks excluidos con `@SkipThrottle()`
- CORS configurado por variable de entorno `ALLOWED_ORIGINS`
- Interceptor 401 en web y mobile — limpia token y redirige al login
- JWT en mobile guardado en `expo-secure-store` (encriptado en Android/iOS)
- En web: localStorage (tradeoff conocido vs httpOnly cookies — necesario para el SW)
- `ValidationPipe` con `whitelist: true` + `transform: true`
- Password mínimo 8 caracteres, `@IsNotEmpty()` en username

---

## Timezone — Bucket de Clicks

El campo `date` es clave nominal del día chileno:

```typescript
const localStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const date = new Date(localStr + 'T00:00:00.000Z');
```

DST de Chile (`America/Santiago`) se maneja automáticamente.

---

## Offline — Web (PWA)

Service Worker custom (`src/sw.ts`) con Background Sync API:

1. Intercepta `POST /clicks`
2. Si falla → guarda `{ authHeader, timestamp }` en IndexedDB
3. Registra sync tag `sync-clicks`
4. Browser despierta el SW cuando vuelve la red (aunque pestaña esté cerrada)
5. SW lee IndexedDB → reenvía → borra exitosos → broadcast count a la app

El mensaje al usuario es **"Se enviará cuando haya señal"** (sin mencionar "pendientes").

VitePWA usa estrategia `injectManifest` para incluir el SW custom.
El SW real solo funciona en `yarn build + yarn preview` (no en `yarn dev`).

---

## Offline — Mobile (React Native)

Cola con NetInfo + AsyncStorage:

1. Click fallido → `enqueueClick()` → AsyncStorage
2. `NetInfo.addEventListener` detecta reconexión → `flushQueue()`
3. Funciona mientras la app está abierta

Limitación: si la app está cerrada, los clicks quedan en AsyncStorage y se envían cuando el usuario vuelve a abrir la app. Para background real se necesitaría `expo-background-fetch` (mejora futura).

---

## Storage en Mobile

`src/services/storage.ts` abstrae el storage según plataforma:
- **Web** (`yarn web`): `localStorage`
- **Nativo** (Android/iOS): `expo-secure-store`

---

## Escala

Stress test: 100 conexiones concurrentes, 30 segundos:

| Métrica | Resultado |
|---|---|
| Total requests | 28.000 |
| Throughput | ~934 req/s |
| Latencia p50 | 101ms |
| Latencia p99 | 159ms |
| Errores | 0 |

Requerimiento: 10.000 req/s. Brecha resuelta en infraestructura (acordado con cliente):
- MongoDB replica set + sharding
- Buffer Redis/Kafka antes de MongoDB
- Múltiples instancias NestJS detrás de load balancer

---

## Variables de entorno

**drawn-api/.env**
```
MONGODB_URI=mongodb://localhost:27017/drawn
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:8081
```

**drawn-web/.env**
```
VITE_API_URL=http://localhost:3000
```

**drawn-app/.env**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Comandos

```bash
# API
cd drawn-api && yarn && yarn start:dev

# Web (dev — SW virtual, sin offline real)
cd drawn-web && yarn && yarn dev

# Web (prod — SW real, offline funciona)
cd drawn-web && yarn build && yarn preview

# Mobile web
cd drawn-app && yarn && yarn web

# Mobile dispositivo (requiere cuenta expo.dev)
eas build -p android --profile preview

# Tests API
cd drawn-api && yarn test
```

---

## Deploy para cliente

1. Levantar MongoDB Atlas (o cluster propio)
2. Desplegar drawn-api en Railway/Render/AWS con las env vars de producción
3. Cambiar `EXPO_PUBLIC_API_URL` en drawn-app/.env y hacer nuevo build EAS
4. Cambiar `VITE_API_URL` en drawn-web/.env y hacer build + deploy

---

## Repositorio

```
https://github.com/Kaborath1595/Drawn
```

---

## Pendiente / Futuro

- [ ] Dashboard de especialistas (web) — pendiente de confirmación con cliente
- [ ] Background Fetch en mobile para envío con app cerrada
- [ ] httpOnly cookies en web (requiere rediseñar auth flow con SW)
- [ ] Tests unitarios en drawn-web (Vitest)
- [ ] Tests e2e en drawn-api
- [ ] Deploy en producción
- [ ] Crear especialistas via endpoint admin protegido
