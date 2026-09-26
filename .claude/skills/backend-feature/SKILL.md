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
| 8 | Use Case | `application/use-cases/<feature>/<accion>.use-case.ts` | Pipeline `andThen` / `map`. Sin `try/catch`, sin `throw`, sin decoradores de NestJS. |
| 9 | Tests | `<accion>.use-case.spec.ts` junto al caso de uso | Mocks de los ports con `okAsync` / `errAsync`. Camino feliz + cada rama de error. |
| 10 | Prisma | `prisma/schema.prisma` + migración | Solo cuando el caso de uso ya pasa sus tests. |
| 11 | Adapter | `infrastructure/persistence/repositories/` o `infrastructure/payment-gateway/` | Envolver cada llamada con `ResultAsync.fromPromise` y mapear fila ↔ entidad. |
| 12 | HTTP | `infrastructure/http/` | Request DTO con class-validator + Swagger; el controlador solo llama a `unwrapOrThrowHttp(useCase.execute(...))`. |
| 13 | Módulo | `infrastructure/modules/<feature>.module.ts` | `{ provide: TOKEN, useClass: Adapter }` y el caso de uso con `useFactory` + `inject`. |

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

- `domain` y `application` nunca importan `@nestjs/*`, `@prisma/client`, `class-validator`, `class-transformer` ni `infrastructure/`.
- `domain` nunca importa `application/`.
- La pasarela se nombra de forma genérica (`PaymentGateway`); su nombre comercial no aparece en el código.

## Al terminar

Ejecuta desde `backend/` y corrige lo que aparezca:

```bash
grep -rnE "from '(@nestjs|@prisma/client|class-validator|class-transformer)" src/domain src/application
grep -rnE "from '.*(application|infrastructure)/" src/domain
grep -rn "throw " src/domain src/application
```

Las tres deben devolver cero resultados. Después ejecuta los tests con cobertura y confirma que sigue por encima del 80%.

Resume al usuario los archivos creados o modificados agrupados por capa (domain, application, infrastructure, tests) y los `code` de error nuevos.
