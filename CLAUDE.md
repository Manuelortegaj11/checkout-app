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
| Backend | NestJS + TypeScript, Prisma, PostgreSQL |
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
- Estado global con Redux Toolkit (arquitectura Flux). El progreso del checkout (paso actual, producto, datos de entrega, token de tarjeta, id de transacción) se persiste para sobrevivir a un refresh.
- Mobile first. Referencia mínima: iPhone SE (2020). Sin desbordamientos; flexbox/grid.
- Flujo de 5 pantallas: Producto → Tarjeta/Entrega (modal) → Resumen (backdrop) → Estado final → Producto con inventario actualizado.
- Validar tarjeta (Luhn, fecha, CVC) y detectar VISA/MasterCard.

## Backend: Arquitectura Hexagonal + ROP

- Capas en `backend/src/`:
  - `domain/`: entidades, errores y **ports** (interfaces). No importa NestJS, Prisma ni HTTP.
  - `application/`: casos de uso. Dependen solo de ports.
  - `infrastructure/`: **adapters** (controladores HTTP, repositorios Prisma, cliente de la pasarela).
- Los controladores solo validan (DTOs con class-validator), llaman al caso de uso y mapean la respuesta. Cero lógica de negocio en controladores.
- **Railway Oriented Programming**: los casos de uso devuelven `Result<T, E>` y no lanzan excepciones para errores de negocio. Los errores se traducen a códigos HTTP en la capa HTTP.
- Módulos obligatorios: inventario (productos), transacciones, clientes y entregas.
- La transacción se crea en `PENDING`, luego se llama a la pasarela y se actualiza con el resultado. El inventario solo se descuenta si el pago queda aprobado.
- La base de datos se puebla con un seed de productos ficticios; no hay endpoints para crear productos.
- Documentar la API con Swagger (`@nestjs/swagger`). Seguridad: helmet, CORS restringido, rate limiting.

## Tests

- Jest obligatorio en frontend y backend con **cobertura > 80%** en cada uno.
- Escribir el test junto con cada caso de uso o componente, no al final.
- Casos de uso: probar con mocks de los ports, sin base de datos.

## Git

- Ramas: `tipo/descripcion-corta` con tipos `feature/`, `fix/`, `chore/`, `test/`, `docs/`. Salen de `main` y vuelven por PR.
- Commits: Conventional Commits en español, en imperativo: `tipo(alcance): descripción`.
  - Tipos: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`.
  - Alcances: `frontend`, `backend`, `prisma`, `deploy`, `readme`, `claude`.
- Commits pequeños y frecuentes: el historial debe mostrar el progreso.
- PRs se fusionan con **merge commit**, no squash.
- No añadir el trailer `Co-Authored-By` en los commits.

## Comandos

Se completarán al crear cada proyecto (dev, test, coverage, migrate, seed).
