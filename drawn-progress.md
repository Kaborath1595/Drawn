# Drawn API — Progreso

## Qué es

Backend para la app de ansiedad de MindShift. Pacientes presionan un botón "Tengo ansiedad" y el sistema registra los clics. Especialistas pueden ver totales y ranking.

---

## Stack

- **NestJS** (Node 20, Yarn)
- **MongoDB** con Mongoose
- **JWT** para autenticación
- **Arquitectura hexagonal** (Ports & Adapters)

---

## Ruta del proyecto

```
C:\Users\vices\Desktop\Drawn\drawn-api
```

---

## Arquitectura hexagonal

Cada módulo tiene tres capas:

| Capa | Qué contiene | Depende de framework? |
|---|---|---|
| `domain/` | Entidades + interfaces (ports) | No |
| `application/` | Casos de uso | No |
| `infrastructure/` | HTTP, Mongoose, JWT (adapters) | Sí |

---

## Módulos

### Auth
- `domain/user.entity.ts` — entidad de usuario
- `domain/ports/user.repository.port.ts` — interfaz del repo
- `domain/ports/token.service.port.ts` — interfaz del servicio JWT
- `application/login.use-case.ts`
- `application/register.use-case.ts`
- `infrastructure/http/auth.controller.ts`
- `infrastructure/persistence/mongoose-user.repository.ts`
- `infrastructure/services/jwt-token.service.ts`

### Clicks
- `domain/click.entity.ts`
- `domain/ports/click.repository.port.ts`
- `application/register-click.use-case.ts`
- `application/get-summary.use-case.ts`
- `application/get-ranking.use-case.ts`
- `infrastructure/http/clicks.controller.ts`
- `infrastructure/persistence/mongoose-click.repository.ts`

---

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | No | Crear usuario |
| POST | `/auth/login` | No | Login → devuelve JWT |
| POST | `/clicks` | JWT | Registrar un clic |
| GET | `/clicks/summary?from=&to=` | JWT | Total de clics en rango |
| GET | `/clicks/ranking?from=&to=&limit=10` | JWT | Top pacientes por clics |

---

## Variables de entorno (.env)

```
MONGODB_URI=mongodb://localhost:27017/drawn
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=7d
PORT=3000
```

---

## Comandos

```bash
# Instalar dependencias
yarn

# Desarrollo con hot-reload
yarn start:dev

# Compilar
yarn build

# Tests
yarn test
```

---

## Pendiente

- [ ] Levantar MongoDB (local, Docker o Atlas)
- [ ] Frontend React Native (bare) con botón "Tengo ansiedad"
- [ ] Cola de reintentos offline en la app móvil
- [ ] Git init + subir a GitHub
