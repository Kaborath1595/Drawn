# Drawn — MindShift

Sistema de registro de ansiedad para la plataforma MindShift. Pacientes presionan un botón para registrar episodios de ansiedad. Especialistas acceden a totales y rankings por rango de fechas.

---

## Stack

| Capa | Tecnología |
|---|---|
| **API** | NestJS 11 + MongoDB (Mongoose) |
| **Auth** | JWT + bcrypt |
| **Web** | React + Vite (PWA) |
| **Mobile** | React Native + Expo |
| **Offline Web** | Service Worker + Background Sync + IndexedDB |
| **Offline Mobile** | NetInfo + AsyncStorage |
| **Seguridad Mobile** | expo-secure-store |

---

## Estructura del monorepo

```
Drawn/
├── drawn-api/     # NestJS backend
├── drawn-web/     # React PWA
└── drawn-app/     # React Native (Expo)
```

---

## Arquitectura

```
[drawn-web PWA]  ──┐
                   ├──► drawn-api (NestJS) ──► MongoDB
[drawn-app RN]  ───┘
```

**drawn-api** usa arquitectura MVC modular plana:

```
src/modules/
├── auth/      # login, register, JWT, bcrypt
├── users/     # schema + service
└── clicks/    # registro, summary, ranking
```

---

## Endpoints

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| POST | `/auth/register` | No | — | Crea usuario paciente |
| POST | `/auth/login` | No | — | Login → JWT |
| POST | `/clicks` | JWT | patient | Registra un click |
| GET | `/clicks/summary?from=&to=` | JWT | specialist | Total de clicks en rango |
| GET | `/clicks/ranking?from=&to=&limit=` | JWT | specialist | Top pacientes por clicks |

---

## Seguridad implementada

- JWT con expiración y validación estricta
- bcrypt con 10 rounds
- Registro siempre crea rol `patient` — especialistas se asignan manualmente
- `summary` y `ranking` protegidos por rol `specialist`
- Rate limiting: 10 req/min en endpoints de auth (brute force)
- CORS restringido por variable de entorno `ALLOWED_ORIGINS`
- Interceptor 401 en web y mobile — redirige al login automáticamente
- JWT almacenado en `expo-secure-store` (encriptado) en mobile
- Validación de inputs con `class-validator` + `ValidationPipe`
- Password mínimo 8 caracteres + confirmación en registro

---

## Offline

### Web (PWA)
Service Worker custom con **Background Sync API**:
- Intercepta `POST /clicks` fallidos
- Guarda en **IndexedDB**
- El browser despierta el SW automáticamente cuando vuelve la red, aunque la pestaña esté cerrada

### Mobile (React Native)
Cola con **NetInfo + AsyncStorage**:
- Click fallido → guardado en AsyncStorage
- NetInfo detecta reconexión → reenvía toda la cola
- Funciona mientras la app está abierta o en primer plano

---

## Escala

Stress test local con 100 conexiones concurrentes durante 30 segundos:

| Métrica | Resultado |
|---|---|
| Requests totales | 28.000 en 30s |
| Throughput | ~934 req/s |
| Latencia p50 | 101ms |
| Latencia p99 | 159ms |
| Errores | 0 |

El requerimiento es 10.000 req/s. El cuello de botella es MongoDB (1 write por click). La solución es infraestructura, no código: replica set + sharding, o un buffer Redis/Kafka delante de Mongo. El código del API no cambia.

---

## Variables de entorno

**drawn-api/.env**
```
MONGODB_URI=mongodb://localhost:27017/drawn
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
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

## Cómo correr el proyecto

```bash
# API
cd drawn-api && yarn && yarn start:dev

# Web
cd drawn-web && yarn && yarn dev

# Mobile (web)
cd drawn-app && yarn && yarn web

# Mobile (dispositivo) — requiere cuenta expo.dev
eas build -p android --profile preview
```

---

## Screenshots

> _Login web_
<!-- screenshot aquí -->

> _Pantalla principal web_
<!-- screenshot aquí -->

> _App mobile en dispositivo_
<!-- screenshot aquí -->

> _Contador offline_
<!-- screenshot aquí -->

---

## Pendiente / Futuro

- Dashboard de especialistas (web) — pendiente de confirmación con cliente
- Background Fetch en mobile para envío con app cerrada
- httpOnly cookies en web (tradeoff actual: necesario para el Service Worker)
- Tests unitarios en drawn-web (Vitest)
- Deploy en producción (Railway/Render + MongoDB Atlas)
