---
name: backend-feature
description: Guía paso a paso para crear o modificar una funcionalidad del backend (entidad, value object, regla, error, port, caso de uso, repositorio, adapter de la pasarela, endpoint o módulo NestJS) siguiendo Arquitectura Hexagonal + DDD + Railway Oriented Programming. Úsala siempre que vayas a escribir o cambiar código en backend/src.
---

# Funcionalidad de backend: Hexagonal + DDD + ROP

Funcionalidad pedida: $ARGUMENTS

La referencia completa, con ejemplos de código de cada capa, está en `backend/docs/arquitectura/hexagonal-ddd-rop.md`. Léela si todavía no la has leído en esta sesión. Esta skill es el procedimiento; el documento es la teoría.

## Antes de escribir código

1. Identifica el módulo del negocio: `product` (inventario), `customer`, `transaction` o `delivery`.
2. Revisa qué existe ya en `src/domain`, `src/application` y `src/infrastructure` para ese módulo. Extiende lo que hay en vez de duplicarlo.
3. Enumera las formas de fallar del caso de uso. Cada una será un `code` estable (`OUT_OF_STOCK`) y una rama de test.

## Orden de construcción

Sigue este orden. No saltes al controlador ni a Prisma antes de tener el caso de uso probado.

| Paso | Qué | Dónde | Regla clave |
|------|-----|-------|-------------|
| 1 | Constants | `domain/constants/` | Objetos `as const` + tipo derivado. Sin `process.env`. |
| 2 | Errors | `domain/errors/<feature>.errors.ts` | Fábricas con `appError(type, CODE, message)`. Son valores, no excepciones. |
| 3 | Value Objects | `domain/value-objects/<nombre>.vo.ts` | Inmutables; `create()` devuelve `Result`. |
| 4 | Rules | `domain/rules/<tema>.rules.ts` | Funciones puras con interfaz mínima de entrada. `check*` devuelve `Result<void, AppError>`. |
| 5 | Entity | `domain/entities/<feature>.entity.ts` | Constructor privado, `create()` → `Result`, `reconstitute()`, `toPlainObject()`. |
| 6 | Port | `application/ports/<feature>.repository.port.ts` | Interfaz + token `Symbol`. Métodos devuelven `ResultAsync<T, AppError>`. |
| 7 | DTOs | `application/dtos/<feature>/` | Tipos planos, sin decoradores. |
| 8 | Use Case | `application/use-cases/<feature>/<accion>.use-case.ts` | `implements UseCase<Input, Output>`. Pipeline `andThen` / `map`; primero las validaciones sin I/O (`Result.combine` de value objects), luego las consultas. Sin `try/catch`, sin `throw`, sin `@Injectable()` ni `@Inject()`. Ids con `IdGeneratorPort` y hora con `ClockPort`, nunca `new Date()` ni `randomUUID()`. |
| 9 | Tests | `<accion>.use-case.spec.ts` junto al caso de uso | Datos con `@testing/fixtures` (`aProduct({ stock: 0 })`) y ports con `@testing/mocks` + `okAsync` / `errAsync`. Camino feliz + cada rama de error. Si falta el fixture o el mock, créalo en `src/testing/`. |
| 10 | Prisma | `prisma/schema.prisma` | Solo cuando el caso de uso ya pasa sus tests. Nombres en inglés: modelo `PascalCase` singular + `@@map("snake_case_plural")`, campos `camelCase` + `@map("snake_case")`. Migración **solo** con `pnpm db:migrate --name <cambio>`; nunca SQL a mano. Datos iniciales en `prisma/seed.ts`, no en migraciones. |
| 11 | Adapter | `infrastructure/persistence/repositories/` o `infrastructure/payment-gateway/` | Envolver cada llamada con `ResultAsync.fromPromise` y mapear fila ↔ entidad. Las respuestas de sistemas externos llegan como `unknown` y se validan antes de usarlas (ver `merchant.response.ts`); una forma inesperada es un error, nunca datos a medias. Timeout en toda llamada HTTP. Exportar `<NOMBRE>_PROVIDER = { provide: TOKEN, useClass: Adapter }` en el mismo archivo. |
| 12 | HTTP | `infrastructure/http/` | Request DTO con class-validator + Swagger; el controlador inyecta el caso de uso por su clase y solo llama a `unwrapOrThrowHttp(useCase.execute(...))`. |
| 13 | Módulos | `infrastructure/modules/<feature>/` | `<feature>.repositories.module.ts` y `<feature>.adapters.module.ts` exportan sus providers; `<feature>.use-cases.module.ts` declara `*_USE_CASE_PROVIDER = useCaseProvider(UseCase, [TOKENS…])` e importa los módulos de repositorios/adapters que necesite (también de otros contextos); `<feature>.module.ts` tiene los controladores. Registra el `<feature>.module.ts` en `app.module.ts`. Añade `<feature>.module.spec.ts` con Prisma simulado (`overrideProvider(PrismaService)`) para verificar el cableado. |
| 14 | E2E | `test/<feature>.e2e-spec.ts` | Contra PostgreSQL real con los datos del seed. Solo afirmar datos estables (nunca el stock de un producto vendible). |

Si la funcionalidad solo toca algunas capas (por ejemplo, una regla nueva), haz solo esos pasos, pero siempre con su test.

## Reglas de ROP

- `map` para pasos que no pueden fallar; `andThen` para pasos que devuelven `Result` / `ResultAsync`.
- `mapErr` para enriquecer errores; `orElse` para compensaciones (por ejemplo, marcar la transacción como `ERROR` si la pasarela falla).
- `match` solo en la capa HTTP, a través de `unwrapOrThrowHttp`.
- Un pago rechazado (`DECLINED`) es un resultado válido y viaja por el riel de éxito, no por el de error.
- `throw` solo para bugs de programación, nunca para reglas de negocio.

## Reglas de dependencias

```text
infrastructure ──► application ──► domain ──► shared
```

| Capa | Puede importar |
|------|----------------|
| `shared` | Solo `neverthrow` |
| `domain` | `@shared` |
| `application` | `@domain`, `@shared` |
| `infrastructure` | Todo, incluido `@config` |

- `domain` y `application` nunca importan frameworks (`@nestjs/*`, `@prisma/*`, `class-validator`, `class-transformer`, `express`), `@config` ni `@infrastructure`. Si un caso de uso necesita configuración, la pide a un port.
- Entre carpetas, imports **con alias** (`@shared/…`, `@domain/…`, `@application/…`, `@infrastructure/…`, `@config/…`). Nunca `../../`.
- Ningún provider se registra dos veces: para usar un repositorio de otro contexto, importa su `repositories.module`.
- La pasarela se nombra de forma genérica (`PaymentGateway`); su nombre comercial no aparece en el código.

## Al terminar

Ejecuta desde `backend/` y corrige lo que aparezca:

```bash
pnpm typecheck && pnpm lint && pnpm test:cov
```

`pnpm lint` ya comprueba la regla de dependencias y la prohibición de `throw` en `shared`, `domain` y `application`: si falla, corrige el código, no desactives la regla. `pnpm test:cov` falla si la cobertura baja del 80%.

Si tocaste un endpoint, actualiza también `backend/docs/api/contrato-api.md` (request, response y códigos de error).

Resume al usuario los archivos creados o modificados agrupados por capa (domain, application, infrastructure, tests) y los `code` de error nuevos.
