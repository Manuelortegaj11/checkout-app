# CLAUDE.md

Guía para Claude Code en este repositorio. Es una prueba técnica FullStack: una app de checkout de un producto pagado con tarjeta de crédito a través de una pasarela de pagos externa (entorno Sandbox).

## Fuente de verdad

- Enunciado completo: `docs/Enunciado test.md` (solo existe en local; `docs/` está en `.gitignore` porque contiene credenciales).
- Si algo de este archivo contradice el enunciado, manda el enunciado.

## Reglas no negociables

- **Nunca** escribir el nombre comercial de la pasarela de pagos en código, nombres de archivos, commits, ramas, PRs ni README. Usar términos genéricos: `payment gateway`, `pasarela de pagos`, `PaymentProvider`.
- **Nunca** subir credenciales, llaves o URLs de la pasarela. Solo van en `.env` (ignorado); en el repo solo `.env.example` con valores vacíos.
- Las llaves privada, de integridad y de eventos viven **solo en el backend**. El frontend solo usa la llave pública.
- Los datos de la tarjeta (número, CVC) nunca llegan al backend ni se guardan en `localStorage`: se tokenizan en el frontend y solo se persiste el token.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js + TypeScript como **SPA** (`output: 'export'`), Redux Toolkit + redux-persist, Tailwind CSS |
| Backend | NestJS 11 + TypeScript (CommonJS), Prisma, PostgreSQL, neverthrow |
| Tests | Jest en ambos (+ React Testing Library en el frontend) |
| Deploy | VPS o EC2: Nginx (estático + proxy `/api`), PM2, HTTPS con Certbot |

## Estructura del repo

```
frontend/   Next.js SPA
backend/    NestJS API (hexagonal)
deploy/     nginx.conf, ecosystem.config.js, deploy.sh
README.md   Único README de la entrega
```

## Frontend

- Next.js se usa **solo como SPA de React**: componentes cliente, `output: 'export'`. Prohibido usar API routes, Server Actions o SSR para lógica de negocio; toda la API vive en `backend/`.
- Estructura en `frontend/src/`: `app/` (solo rutas y composición) → `features/` (`products`, `checkout`, `transaction`) → `shared/` (`ui`, `lib`, `api`), más `store/`. `shared/` no importa nada de `features/`, `store/` ni `app/`.
- Estado global con Redux Toolkit siguiendo Flux: vista → `dispatch` → thunk → servicio (`shared/api`) → reducer → selector → vista. Los componentes nunca llaman a `fetch`.
- El checkout es una máquina de pasos en el store (`PRODUCT` → `PAYMENT_FORM` → `SUMMARY` → `PROCESSING` → `RESULT` → `PRODUCT`). `redux-persist` solo sobre `checkout`, para sobrevivir a un refresh; nunca se persisten el número de tarjeta ni el CVC.
- Mobile first. Referencia mínima: iPhone SE (2020), 375 px de ancho. Sin desbordamientos; flexbox/grid. Imágenes en WebP/SVG con dimensiones reservadas.
- Validar tarjeta (Luhn, fecha, CVC) y detectar VISA/MasterCard con funciones puras en `shared/lib/card/`.
- Referencia completa: `frontend/docs/arquitectura/spa-redux-flux.md`. Para crear o modificar código en `frontend/src`, usa la skill `/frontend-feature`.

## Backend: Arquitectura Hexagonal + ROP

- Capas en `backend/src/`:
  - `shared/`: `Result` (neverthrow) y `AppError`. No importa ninguna capa.
  - `domain/`: constants, value objects, rules, entities y errores. Solo importa `shared`.
  - `application/`: **ports** (interfaces), DTOs y casos de uso. Sin decoradores de NestJS.
  - `infrastructure/`: **adapters** (controladores HTTP, repositorios Prisma, cliente de la pasarela) y módulos NestJS.
- Regla de dependencias: `infrastructure → application → domain → shared`. `domain` y `application` nunca importan `@nestjs/*`, `@prisma/client` ni `class-validator`.
- Los controladores solo validan (DTOs con class-validator), llaman al caso de uso y salen del riel. Cero lógica de negocio en controladores.
- **Railway Oriented Programming** con `neverthrow`: ports y casos de uso devuelven `ResultAsync<T, AppError>` y no lanzan excepciones por errores de negocio. Solo los adapters convierten excepciones en `err`, y solo la capa HTTP convierte `err` en código HTTP.
- Referencia completa: `backend/docs/arquitectura/hexagonal-ddd-rop.md`. Para crear o modificar código en `backend/src`, usa la skill `/backend-feature`.
- Módulos obligatorios: inventario (productos), transacciones, clientes y entregas.
- La transacción se crea en `PENDING`, luego se llama a la pasarela y se actualiza con el resultado. El inventario solo se descuenta si el pago queda aprobado.
- La base de datos se puebla con un seed de productos ficticios; no hay endpoints para crear productos.
- Documentar la API con Swagger (`@nestjs/swagger`). Seguridad: helmet, CORS restringido, rate limiting.
- **NestJS 11, no 12:** NestJS 12 solo se distribuye como ESM y usa Vitest; el enunciado exige Jest, que con ESM sigue siendo experimental. No actualizar a 12.
- ESLint hace cumplir la arquitectura: falla si `shared`, `domain` o `application` importan frameworks o capas exteriores, o si usan `throw`. No desactivar esas reglas; corregir el código.
- Contrato de la API y modelo de datos: `backend/docs/api/contrato-api.md`.

## Tests

- Jest obligatorio en frontend y backend con **cobertura > 80%** en cada uno.
- Escribir el test junto con cada caso de uso o componente, no al final.
- Casos de uso: probar con mocks de los ports, sin base de datos.

## Git

- Ramas base:
  - `staging`: rama de integración. Todas las ramas de trabajo salen de `staging` y vuelven a `staging` por PR.
  - `main`: entrega final. Solo recibe un PR `staging` → `main` al terminar la prueba. Nunca abrir PRs de ramas de trabajo hacia `main`.
- Ramas de trabajo: `tipo/descripcion-corta` con tipos `feature/`, `fix/`, `chore/`, `test/`, `docs/`.
- Commits: Conventional Commits en español, en imperativo: `tipo(alcance): descripción`.
  - Tipos: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`.
  - Alcances: `frontend`, `backend`, `prisma`, `deploy`, `readme`, `claude`.
- Commits pequeños y frecuentes: el historial debe mostrar el progreso.
- PRs se fusionan con **merge commit**, no squash.
- No añadir el trailer `Co-Authored-By` en los commits.

## Comandos

Gestor de paquetes: **pnpm**. Node 22 o superior.

### Backend (desde `backend/`)

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala dependencias |
| `pnpm start:dev` | API en modo desarrollo con recarga (`http://localhost:3001/api`) |
| `pnpm build` / `pnpm start:prod` | Compila a `dist/` y arranca la versión compilada |
| `pnpm test` | Tests unitarios |
| `pnpm test:cov` | Tests con cobertura; falla si baja del 80% |
| `pnpm test:e2e` | Tests end-to-end de la API |
| `pnpm lint` / `pnpm lint:fix` | ESLint (incluye las reglas de arquitectura) |
| `pnpm typecheck` | Comprobación de tipos |
| `pnpm format` | Prettier |

Swagger: `http://localhost:3001/api/docs`. Configuración: copiar `.env.example` a `.env`.

Antes de dar una tarea del backend por terminada: `pnpm typecheck && pnpm lint && pnpm test:cov`.

### Frontend

Se completarán al crear el proyecto.
