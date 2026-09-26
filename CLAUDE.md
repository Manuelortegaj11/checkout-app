# CLAUDE.md

Guía para Claude Code en este repositorio. Es una prueba técnica FullStack: una app de checkout de un producto pagado con tarjeta de crédito a través de una pasarela de pagos externa (entorno Sandbox).

## Fuente de verdad

- Enunciado completo: `docs/Enunciado test.md` (solo existe en local; `docs/` está en `.gitignore` porque contiene credenciales).
- Si algo de este archivo contradice el enunciado, manda el enunciado.

## Reglas no negociables

- **Nunca** escribir el nombre comercial de la pasarela de pagos en código, nombres de archivos, commits, ramas, PRs ni README. Usar términos genéricos: `payment gateway`, `pasarela de pagos`, `PaymentProvider`.
- **Nunca** subir credenciales, llaves o URLs de la pasarela. Solo van en `.env` (ignorado); en el repo solo `.env.example` con valores vacíos.
- Las llaves privada, de integridad y de eventos viven **solo en el backend**. El frontend solo usa la llave pública.
- Usar la URL de **Sandbox** del enunciado. Ojo: en las llaves del PDF la `l` minúscula parece una `I` mayúscula; la llave pública correcta lleva `l` (`…TS2lUV8…`). Si la pasarela responde 404/401 con una llave, probar esa variante.
- Los datos de la tarjeta (número, CVC) nunca llegan al backend ni se guardan en `localStorage`: se tokenizan en el frontend y solo se persiste el token.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | **ReactJS** + TypeScript como **SPA** empaquetada con **Vite**, Redux Toolkit + redux-persist, Tailwind CSS |
| Backend | NestJS 11 + TypeScript (CommonJS), Prisma 7, PostgreSQL 17 (Docker), neverthrow |
| Tests | Jest en ambos (+ React Testing Library en el frontend) |
| Deploy | VPS o EC2: Nginx (estático + proxy `/api`), PM2, HTTPS con Certbot |

## Estructura del repo

```
frontend/   SPA con ReactJS + Vite
backend/    NestJS API (hexagonal)
deploy/     nginx.conf, ecosystem.config.js, deploy.sh
README.md   Único README de la entrega
```

## Frontend

- **Solo ReactJS.** El enunciado solo permite React o Vue y prohíbe expresamente Next.js y cualquier otro framework (Remix, Gatsby, React Router en modo framework…). Vite es solo la herramienta de build. Toda la API vive en `backend/`.
- Estructura en `frontend/src/`: `main.tsx` → `app/` (solo composición) → `features/` (`products`, `checkout`, `transaction`) → `shared/` (`ui`, `lib`, `api`, `config`), más `store/`. `shared/` no importa nada de `features/`, `store/` ni `app/`.
- **Sin router:** la pantalla visible se deriva solo de `checkout.step`, así una URL nunca contradice el estado persistido.
- Variables de entorno `VITE_*` (son públicas: van dentro del bundle). Solo se leen en `shared/config/env.ts`.
- Tests con **Jest** (`ts-jest` + `jsdom`), no con Vitest: el enunciado exige Jest.
- Estado global con Redux Toolkit siguiendo Flux: vista → `dispatch` → thunk → servicio (`shared/api`) → reducer → selector → vista. Los componentes nunca llaman a `fetch`.
- El checkout es una máquina de pasos en el store (`PRODUCT` → `PAYMENT_FORM` → `SUMMARY` → `PROCESSING` → `RESULT` → `PRODUCT`). `redux-persist` solo sobre `checkout`, para sobrevivir a un refresh; nunca se persisten el número de tarjeta ni el CVC.
- Mobile first. Referencia mínima: iPhone SE (2020), 375 px de ancho. Sin desbordamientos; flexbox/grid. Imágenes en WebP/SVG con dimensiones reservadas.
- Validar tarjeta (Luhn, fecha, CVC) y detectar VISA/MasterCard con funciones puras en `shared/lib/card/`.
- Referencia completa: `frontend/docs/arquitectura/spa-redux-flux.md`. Para crear o modificar código en `frontend/src`, usa la skill `/frontend-feature`.

## Backend: Arquitectura Hexagonal + ROP

- Capas en `backend/src/`:
  - `shared/`: `Result` (neverthrow) y `AppError`. No importa ninguna capa.
  - `domain/`: constants, value objects, rules, entities y errores. Solo importa `shared`.
  - `application/`: **ports** (interfaces + token `Symbol`), DTOs y casos de uso (`implements UseCase<Input, Output>`). Sin decoradores de NestJS.
  - `infrastructure/`: **adapters** (controladores HTTP, repositorios Prisma, cliente de la pasarela) y el cableado de NestJS.
  - `config/`: validación de `process.env`. Solo la lee `infrastructure`.
- Regla de dependencias: `infrastructure → application → domain → shared`. `domain` y `application` nunca importan frameworks (`@nestjs/*`, `@prisma/*`, `class-validator`, `class-transformer`, `express`), `@config` ni `@infrastructure`.
- Imports entre carpetas con alias: `@shared/*`, `@domain/*`, `@application/*`, `@infrastructure/*`, `@config/*`, `@testing/*`. Nunca `../../`.
- Inyección de dependencias solo en infraestructura: los adapters exportan `*_PROVIDER` bajo el token de su port; los casos de uso se registran con `useCaseProvider()`. Módulos por contexto en `infrastructure/modules/<feature>/`: `repositories`, `adapters`, `use-cases` y el módulo con los controladores. Un provider nunca se registra dos veces: se importa el `repositories.module` del otro contexto.
- Los controladores solo validan (DTOs con class-validator), llaman al caso de uso y salen del riel. Cero lógica de negocio en controladores.
- **Railway Oriented Programming** con `neverthrow`: ports y casos de uso devuelven `ResultAsync<T, AppError>` y no lanzan excepciones por errores de negocio. Solo los adapters convierten excepciones en `err`, y solo la capa HTTP convierte `err` en código HTTP.
- Referencia completa: `backend/docs/arquitectura/hexagonal-ddd-rop.md`. Para crear o modificar código en `backend/src`, usa la skill `/backend-feature`.
- Módulos obligatorios: inventario (productos), transacciones, clientes y entregas.
- **Agregados:** `Product`, `Customer` y `Transaction`. `Delivery` vive dentro de `Transaction` (se crean juntas y la entrega solo cambia al liquidar). Entre agregados se referencia por id.
- **Ids y hora por ports:** los ids (UUID v7) salen de `IdGeneratorPort` y la hora de `ClockPort`. El lint prohíbe `new Date()`, `Date.now()`, `Math.random()` y `randomUUID()` en `shared`, `domain` y `application`.
- **Parse, don't validate:** los value objects (`Quantity`, `Email`) validan al crearse; un método que recibe un value object no vuelve a validar ni devuelve `Result` si no puede fallar.
- La transacción se crea en `PENDING`, luego se llama a la pasarela y se actualiza con el resultado. El inventario solo se descuenta si el pago queda aprobado.
- La base de datos se puebla con un seed de productos ficticios; no hay endpoints para crear productos.
- Documentar la API con Swagger (`@nestjs/swagger`). Seguridad: helmet, CORS restringido, rate limiting.
- **NestJS 11, no 12:** NestJS 12 solo se distribuye como ESM y usa Vitest; el enunciado exige Jest, que con ESM sigue siendo experimental. No actualizar a 12.
- ESLint hace cumplir la arquitectura: falla si `shared`, `domain` o `application` importan frameworks, `config` o capas exteriores (por alias o por ruta relativa), si usan `throw` o la hora/azar implícitos, o si un import sube más de un nivel. No desactivar esas reglas; corregir el código.
- Contrato de la API y modelo de datos: `backend/docs/api/contrato-api.md`.

## Base de datos (Prisma 7 + PostgreSQL 17)

- **Migraciones solo con los comandos de Prisma:** editar `backend/prisma/schema.prisma` y ejecutar `pnpm db:migrate --name <cambio_en_snake_case>`. **Prohibido** escribir o editar archivos de migración SQL a mano. En producción: `pnpm db:deploy`.
- **Datos iniciales solo en el seed** (`backend/prisma/seed.ts`, `pnpm db:seed`), nunca en una migración. El seed es idempotente: crea lo que falta y no modifica lo existente.
- **Nombres en inglés.** Prisma: modelos en `PascalCase` singular y campos en `camelCase`. PostgreSQL: tablas en `snake_case` plural (`@@map("products")`) y columnas en `snake_case` (`@map("price_in_cents")`). Enums en `PascalCase` con valores `UPPER_SNAKE_CASE`. Dinero siempre en centavos y enteros (`*InCents`).
- El cliente se genera en `backend/src/infrastructure/persistence/generated/` (ignorado por Git; se regenera con `pnpm install`). Solo lo importa la infraestructura, a través de `PrismaService`.
- Prisma 7 bloquea las operaciones destructivas (`migrate reset`) si las ejecuta un agente de IA: pedir confirmación explícita al usuario y no intentar saltarse el bloqueo.

## Tests

- Jest obligatorio en frontend y backend con **cobertura > 80%** en cada uno.
- Escribir el test junto con cada caso de uso o componente, no al final.
- Casos de uso: probar con mocks de los ports, sin base de datos.
- Datos de prueba en `src/testing/fixtures` (`aProduct()`, `aProductRow()`…) y dobles de los ports en `src/testing/mocks`. Se importan con `@testing/*` **solo desde tests**: el lint lo impide en código de producción. Esa carpeta no entra al build ni a la cobertura.
- Cada contexto tiene una prueba de su módulo NestJS con Prisma, `ConfigService` (`mockConfigService`) y `fetch` simulados (verifica el cableado de tokens) y pruebas e2e en `test/` contra PostgreSQL y el Sandbox reales.

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

Gestor de paquetes: **pnpm**. Node 22 o superior. Docker para PostgreSQL.

### Base de datos (desde la raíz)

| Comando | Qué hace |
|---|---|
| `docker compose up -d` | Levanta PostgreSQL 17 en `localhost:5433` |
| `docker compose down` | Lo detiene (los datos se conservan) |
| `docker compose down -v` | Lo detiene y borra los datos |

### Backend (desde `backend/`)

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala dependencias y genera el cliente de Prisma |
| `pnpm db:migrate --name <cambio>` | Crea y aplica una migración a partir de `schema.prisma` (desarrollo) |
| `pnpm db:deploy` | Aplica las migraciones pendientes (producción) |
| `pnpm db:seed` | Carga los productos iniciales |
| `pnpm db:reset` | Borra la base de desarrollo, reaplica las migraciones y el seed (pide confirmación) |
| `pnpm db:status` | Estado de las migraciones |
| `pnpm db:studio` | Explorador visual de la base de datos |
| `pnpm start:dev` | API en modo desarrollo con recarga (`http://localhost:3001/api`) |
| `pnpm build` / `pnpm start:prod` | Compila a `dist/` y arranca la versión compilada |
| `pnpm test` | Tests unitarios |
| `pnpm test:cov` | Tests con cobertura; falla si baja del 80% |
| `pnpm test:e2e` | Tests end-to-end contra PostgreSQL y el Sandbox de la pasarela (requiere `docker compose up -d`, `pnpm db:deploy`, `pnpm db:seed`, las variables de la pasarela en `.env` e internet) |
| `pnpm lint` / `pnpm lint:fix` | ESLint (incluye las reglas de arquitectura) |
| `pnpm typecheck` | Comprobación de tipos |
| `pnpm format` | Prettier |

Swagger: `http://localhost:3001/api/docs`. Configuración: copiar `.env.example` a `.env`.

Primera vez: `docker compose up -d` (raíz) → `pnpm install` → `pnpm db:deploy` → `pnpm db:seed` → `pnpm start:dev` (en `backend/`).

Antes de dar una tarea del backend por terminada: `pnpm typecheck && pnpm lint && pnpm test:cov`.

### Frontend

Se completarán al crear el proyecto.
