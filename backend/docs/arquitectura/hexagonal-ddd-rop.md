# Flujo de trabajo — Hexagonal + DDD + ROP

Guía de referencia del backend. Explica cómo se organiza el código, en qué orden se construye una funcionalidad y cómo viajan los errores con **Railway Oriented Programming (ROP)**.

## Resumen

- **Hexagonal (Ports & Adapters):** el negocio (`domain` + `application`) no conoce NestJS, Prisma ni HTTP. Habla con el exterior a través de **ports** (interfaces) que implementan los **adapters** de `infrastructure`.
- **DDD:** el negocio se expresa con entidades, value objects, reglas y un lenguaje ubicuo compartido.
- **ROP:** ninguna operación de negocio lanza excepciones. Cada paso devuelve un `Result<Ok, Error>`; los pasos se encadenan y, en cuanto uno falla, los siguientes se saltan y el error viaja hasta el controlador, que es el único que lo traduce a HTTP.

## Flujo de creación

```mermaid
flowchart TD
    A["1. Dominio<br/>constants · value objects · rules · entity · errors"] --> B["2. Ports<br/>repository / servicios externos"]
    B --> C["3. DTOs de aplicación<br/>input / output"]
    C --> D["4. Use Case<br/>pipeline ROP"]
    D --> E["5. Tests del Use Case<br/>mocks de los ports"]
    E --> F["6. Schema + Migración<br/>prisma"]
    F --> G["7. Adapters<br/>repository Prisma / cliente de la pasarela"]
    G --> H["8. HTTP<br/>request DTO · controller · error mapper"]
    H --> I["9. Módulo NestJS<br/>port → adapter"]
```

Los tests del caso de uso van en el paso 5, **antes** de la base de datos: como el caso de uso solo depende de ports, se prueba completo con mocks.

## Diagrama Hexagonal + DDD + ROP

```mermaid
graph TB
    subgraph "Shared Kernel"
        direction TB
        RES["Result / ResultAsync<br/>neverthrow"]
        ERR["AppError<br/>unión discriminada con código estable"]
    end

    subgraph "Domain (Núcleo)"
        direction TB
        CONST["Constants<br/>Lenguaje ubicuo<br/>TRANSACTION_STATUS, DELIVERY_STATUS"]
        VO["Value Objects<br/>Email, Quantity<br/>create() → Result"]
        RULES["Rules<br/>Políticas puras sin I/O<br/>resolve*, check*, is*, calculate*"]
        ENT["Entity<br/>create() → Result<br/>reconstitute(), toPlainObject()"]
        DERR["Domain Errors<br/>outOfStock(), productNotFound()"]
    end

    subgraph "Application"
        direction TB
        UC["Use Case<br/>Pipeline ROP"]
        PORT["Ports<br/>Interfaces que devuelven ResultAsync"]
        DTO_IN["Input DTOs"]
        DTO_OUT["Output DTOs"]
    end

    subgraph "Infrastructure — adapters de salida"
        direction TB
        REPO["Repository Impl<br/>PrismaClient + mapper"]
        PAY["Payment Gateway Client<br/>HTTP a la pasarela"]
        SCHEMA["Prisma Schema<br/>+ Migraciones"]
    end

    subgraph "Infrastructure — adapters de entrada"
        direction TB
        REQ["Request DTO<br/>class-validator + Swagger"]
        CTRL["Controller<br/>Expone HTTP"]
        MAP["Error Mapper<br/>AppError → HttpException"]
    end

    RES --> VO
    RES --> ENT
    ERR --> DERR
    CONST --> RULES
    CONST --> ENT
    VO --> ENT
    DERR --> RULES
    DERR --> ENT
    RULES --> UC
    ENT --> UC
    DTO_IN --> UC
    UC --> PORT
    UC --> DTO_OUT
    PORT --> REPO
    PORT --> PAY
    REPO --> SCHEMA
    REQ --> CTRL
    CTRL --> UC
    CTRL --> MAP
```

## Leyenda de responsabilidades

| Capa | Componente | Responsabilidad |
|------|-----------|----------------|
| **Shared** | Result | Tipos `Result` / `ResultAsync` (neverthrow) y helpers. Es el "riel" por el que viaja todo. |
| **Shared** | AppError | Forma común de todos los errores: `type` (categoría), `code` (estable, lo consume el frontend) y `message`. |
| **Domain** | Constants | Lenguaje ubicuo: catálogos cerrados del negocio como objetos `as const` y sus tipos derivados. No lee `process.env` ni importa DTOs. |
| **Domain** | Value Objects | Valores inmutables con validación (`Email`, `Quantity`). `create()` devuelve `Result`, nunca lanza. |
| **Domain** | Rules | Políticas puras: reciben datos ya cargados y deciden. Sin I/O ni repositorios. Devuelven valor, `boolean` o `Result`. |
| **Domain** | Entity | Corazón del negocio: atributos, invariantes y comportamiento. Los métodos que pueden violar una regla devuelven `Result`. |
| **Domain** | Errors | Fábricas de errores de negocio con código estable (`OUT_OF_STOCK`, `TRANSACTION_ALREADY_RESOLVED`). |
| **Application** | Ports | Interfaces de salida (repositorios, pasarela de pagos). Devuelven `ResultAsync`, nunca una `Promise` que pueda rechazarse. |
| **Application** | DTOs | Tipos planos de entrada y salida del caso de uso. Sin decoradores. |
| **Application** | Use Case | Orquesta el flujo como un pipeline ROP: encadena reglas, entidades y ports. Sin decoradores de NestJS. |
| **Infrastructure** | Repository Impl | Implementa el port con Prisma. Envuelve cada llamada en `ResultAsync.fromPromise` y mapea fila ↔ entidad. |
| **Infrastructure** | Payment Gateway Client | Implementa el port de la pasarela. Traduce sus respuestas y fallos de red a `Result`. |
| **Infrastructure** | Prisma Schema | Modelo de datos, migraciones y seed. |
| **Infrastructure** | Request DTO | Contrato HTTP: validación con class-validator y documentación con Swagger. |
| **Infrastructure** | Controller | Único punto de salida del riel: ejecuta el caso de uso y hace `match` → respuesta o `HttpException`. |
| **Infrastructure** | Error Mapper | Traduce `AppError.type` a código HTTP sin filtrar detalles internos. |
| **Application** | UseCase port | Interfaz común `UseCase<Input, Output>`: todo caso de uso expone `execute(input)` y devuelve `ResultAsync`. |
| **Infrastructure** | Providers | `*_PROVIDER`: registran un adapter bajo el token de su port, o un caso de uso con `useCaseProvider`. Viven solo en infraestructura. |
| **Infrastructure** | Modules | Por contexto: `repositories`, `adapters`, `use-cases` y el módulo del contexto con sus controladores. |

## Árbol del patrón arquitectónico

```text
backend/
├── prisma.config.ts                    # CLI de Prisma: esquema, migraciones, seed y DATABASE_URL
├── jest.config.ts                      # Un proyecto de Jest por nivel de prueba: unit, integration, e2e
├── prisma/
│   ├── schema.prisma                   # Modelo de datos (nombres en inglés, tablas snake_case)
│   ├── migrations/                     # Generadas SOLO con `pnpm db:migrate --name <cambio>`
│   └── seed.ts                         # Productos ficticios (idempotente)
├── src/
│   ├── main.ts                         # Bootstrap HTTP: helmet, CORS, ValidationPipe, Swagger
│   ├── config/                         # Lectura y validación de process.env
│   │
│   ├── shared/                         # KERNEL: no importa ninguna capa
│   │   ├── result/                     # Re-export de neverthrow + helpers ROP
│   │   └── errors/                     # app-error.ts: tipos y fábricas base
│   │
│   ├── domain/                         # NÚCLEO: solo importa shared
│   │   ├── constants/                  # CURRENCY, TRANSACTION_STATUS, DELIVERY_STATUS, MAX_QUANTITY_PER_PURCHASE
│   │   ├── value-objects/              # email.vo.ts (identidad del cliente), quantity.vo.ts (1..10)
│   │   ├── rules/                      # pricing.rules.ts (montos), stock.rules.ts, contact.rules.ts
│   │   ├── entities/                   # product, customer, transaction (agregados) · delivery (dentro de transaction)
│   │   └── errors/                     # product.errors.ts, customer.errors.ts, transaction.errors.ts
│   │
│   ├── application/                    # ORQUESTACIÓN: importa domain y shared
│   │   ├── ports/                      # use-case, <feature>.repository, payment-gateway, checkout-settings, id-generator, clock
│   │   ├── dtos/<feature>/             # <accion>.input.ts · <feature>.output.ts
│   │   └── use-cases/<feature>/        # <accion>.use-case.ts · <feature>.mapper.ts
│   │
│   └── infrastructure/                 # ADAPTERS: implementan los ports
│       ├── persistence/
│       │   ├── generated/prisma/       # Cliente generado por Prisma (ignorado por Git)
│       │   ├── prisma.service.ts       # Único punto de acceso a Prisma
│       │   ├── database.errors.ts      # databaseError(): fallo de BD → DB_QUERY_FAILED
│       │   ├── repositories/           # <feature>.prisma.repository.ts
│       │   └── mappers/                # <feature>.prisma.mapper.ts: fila ↔ entidad
│       ├── payment-gateway/            # Adapter HTTP de la pasarela
│       │   ├── payment-gateway.client.ts   # Implementa PaymentGatewayPort (+ PAYMENT_GATEWAY_PROVIDER)
│       │   ├── payment-gateway.http.ts     # fetch con timeout; todo fallo → PAYMENT_GATEWAY_UNAVAILABLE
│       │   ├── merchant.response.ts        # Valida la respuesta externa y la traduce al port
│       │   └── payment-gateway.errors.ts
│       ├── settings/                   # Adapters de configuración (checkout-settings.adapter.ts)
│       ├── system/                     # uuid-v7.generator.ts (IdGeneratorPort), system-clock.ts (ClockPort)
│       ├── http/
│       │   ├── controllers/            # <feature>.controller.ts
│       │   ├── dtos/                   # <accion>.request.ts · <feature>.response.ts · error.response.ts (Swagger)
│       │   ├── pipes/                  # parse-uuid.pipe.ts: :id inválido → 400 INVALID_REQUEST
│       │   ├── errors/                 # app-error.http-mapper.ts, validation-exception.factory.ts
│       │   ├── filters/                # all-exceptions.filter.ts: formato único { code, message }
│       │   └── configure-app.ts        # Prefijo, helmet, CORS, validación, Swagger
│       └── modules/                    # CABLEADO de NestJS, un directorio por contexto
│           ├── app.module.ts           # Módulo raíz: módulos globales + <feature>.module.ts
│           ├── use-case.provider.ts    # useCaseProvider(): registra casos de uso sin decoradores
│           ├── persistence/            # persistence.module.ts: PrismaService (global)
│           ├── health/                 # health.module.ts
│           ├── payment-gateway/        # payment-gateway.adapters.module.ts: compartido por checkout y transacciones
│           ├── system/                 # system.adapters.module.ts: ids y reloj
│           ├── customer/               # customer.repositories.module.ts (sin endpoints propios)
│           └── <feature>/
│               ├── <feature>.repositories.module.ts   # Adapters de persistencia (exporta sus providers)
│               ├── <feature>.adapters.module.ts       # Otros adapters de salida (p. ej. pasarela)
│               ├── <feature>.use-cases.module.ts      # *_USE_CASE_PROVIDER con useCaseProvider
│               └── <feature>.module.ts                # Controladores; importa el de use-cases
│
└── tests/                              # TODAS las pruebas, fuera de src/ (no entran al build)
    ├── unit/                           # *.spec.ts: espejo de src/, una pieza aislada con dobles
    ├── integration/                    # *.int-spec.ts: NestJS o varias piezas reales, sin servicios externos
    │   ├── http/                       # configureApp y controladores con supertest
    │   └── modules/                    # Cableado de cada contexto y useCaseProvider
    ├── e2e/                            # *.e2e-spec.ts: la API contra PostgreSQL y el Sandbox reales
    └── support/                        # @testing/*: solo lo importan las pruebas
        ├── fixtures/                   # aProduct(), aProductRow(), aTransactionOutput()…: datos válidos con overrides
        ├── mocks/                      # mockProductRepository(), mockUseCase()…: dobles de ports y casos de uso
        └── helpers/                    # validateRequest(): transforma y valida un request DTO como el ValidationPipe
```

Módulos del negocio (`<feature>`): `product` (inventario), `customer`, `transaction` y `delivery`.

### Convenciones de nombres

- Archivos en `kebab-case` con sufijo de rol: `.entity.ts`, `.vo.ts`, `.rules.ts`, `.errors.ts`, `.port.ts`, `.use-case.ts`, `.prisma.repository.ts`, `.controller.ts`, `.request.ts`, `.response.ts`, `.repositories.module.ts`, `.adapters.module.ts`, `.use-cases.module.ts`, `.module.ts`.
- Pruebas en `tests/`, una carpeta por nivel: `*.spec.ts` en `tests/unit/` con la misma ruta que el archivo en `src/`, `*.int-spec.ts` en `tests/integration/` y `*.e2e-spec.ts` en `tests/e2e/` (ver [Pruebas por nivel](#pruebas-por-nivel)).
- Clases en `PascalCase`, funciones y variables en `camelCase`, constantes del dominio en `UPPER_SNAKE_CASE`.
- Tokens de inyección de los ports: `export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY')`, junto a la interfaz.
- Providers: `<NOMBRE>_PROVIDER` (`PRODUCT_REPOSITORY_PROVIDER`, `CREATE_TRANSACTION_USE_CASE_PROVIDER`).
- Nombres genéricos para la pasarela: `PaymentGateway`, nunca el nombre comercial del proveedor.

### Regla de dependencias

```text
infrastructure ──► application ──► domain ──► shared
```

Las flechas indican quién puede importar a quién. Ninguna capa importa a una capa a su izquierda. `shared` solo depende de `neverthrow`. Dentro del dominio el orden es:

```text
constants, errors  ──►  value-objects  ──►  rules, entities
```

| Capa | Puede importar | Nunca importa |
|------|----------------|---------------|
| `shared` | `neverthrow` | Ninguna capa, `config`, frameworks |
| `domain` | `shared` | `application`, `infrastructure`, `config`, frameworks |
| `application` | `domain`, `shared` | `infrastructure`, `config`, frameworks |
| `infrastructure` | Todo | — |
| `config` | `class-validator`, `class-transformer` | Solo lo leen `infrastructure` (incluido el módulo raíz) y `main.ts` |

"Frameworks" son `@nestjs/*`, `@prisma/*`, `class-validator`, `class-transformer` y `express`. Si un caso de uso necesita un valor de configuración (por ejemplo, las tarifas), lo pide a un **port** (`CheckoutSettings`) que implementa la infraestructura leyendo `config`.

### Alias de imports

| Alias | Carpeta |
|-------|---------|
| `@shared/*` | `src/shared/*` |
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@config/*` | `src/config/*` |
| `@testing/*` | `tests/support/*` (solo desde pruebas) |

- Entre carpetas distintas se importa **siempre con alias**: `import { appError } from '@shared/errors/app-error'`.
- Las rutas relativas solo se usan entre vecinos cercanos (`./x`, `../x`). Subir dos niveles (`../../`) es error de lint.
- Los alias están definidos en `tsconfig.json` (`paths`) y en `moduleNameMapper` de Jest; `nest build` los reescribe al compilar.
- `@testing` solo se importa desde `tests/`: el lint falla si el código de producción lo usa, por alias o por ruta relativa.

### Cómo se hace cumplir

`eslint.config.mjs` convierte esta tabla en errores de lint. Detecta los imports prohibidos **tanto por alias como por ruta relativa** (`@infrastructure/...` y `../infrastructure/...`), los frameworks en el núcleo y cualquier `throw` en `shared`, `domain` y `application`. Las pruebas unitarias de esas capas (`tests/unit/<capa>`) cumplen la misma tabla: una prueba del dominio tampoco importa NestJS. Un import que viole la regla de dependencias no puede llegar a `staging`.

## Inyección de dependencias y módulos

El núcleo no conoce NestJS, así que la inyección se resuelve **solo en infraestructura** con tres piezas: tokens, providers y módulos por contexto.

### 1. Tokens: junto al port

Cada port exporta su interfaz y un `Symbol` como token. El `Symbol` es único: dos tokens nunca pueden chocar por tener el mismo texto.

```ts
// application/ports/product.repository.port.ts
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findById(id: string): ResultAsync<Product | null, AppError>;
}
```

Los casos de uso implementan el port genérico `UseCase<Input, Output>` y usan **su propia clase como token**.

### 2. Providers: solo en infraestructura

- **Adapters:** el archivo del adapter exporta su provider, que lo registra bajo el token del port.

  ```ts
  // infrastructure/persistence/repositories/product.prisma.repository.ts
  export const PRODUCT_REPOSITORY_PROVIDER: Provider = {
    provide: PRODUCT_REPOSITORY,
    useClass: ProductPrismaRepository,
  };
  ```

- **Casos de uso:** `useCaseProvider` construye la clase inyectando sus ports **en el orden del constructor**. TypeScript exige un token por cada parámetro. Estos providers **nunca** se declaran en `application`: el caso de uso no lleva `@Injectable()` ni `@Inject()`.

  ```ts
  // infrastructure/modules/transaction/transaction.use-cases.module.ts
  export const CREATE_TRANSACTION_USE_CASE_PROVIDER = useCaseProvider(
    CreateTransactionUseCase,
    [PRODUCT_REPOSITORY, CUSTOMER_REPOSITORY, TRANSACTION_REPOSITORY, CHECKOUT_SETTINGS],
  );
  ```

### 3. Módulos por contexto

Cada contexto (`product`, `customer`, `transaction`, `delivery`) tiene su carpeta en `infrastructure/modules/<feature>/` con hasta cuatro módulos. Cada uno solo **exporta** lo que otros necesitan.

```mermaid
flowchart LR
    subgraph product
        PR["ProductRepositoriesModule<br/>exporta PRODUCT_REPOSITORY"]
    end
    subgraph transaction
        TR["TransactionRepositoriesModule<br/>exporta TRANSACTION_REPOSITORY"]
        TA["TransactionAdaptersModule<br/>exporta PAYMENT_GATEWAY"]
        TU["TransactionUseCasesModule<br/>exporta los casos de uso"]
        TM["TransactionModule<br/>controladores"]
    end
    PR --> TU
    TR --> TU
    TA --> TU
    TU --> TM
```

| Módulo | Contiene | Exporta |
|--------|----------|---------|
| `<feature>.repositories.module.ts` | `*_REPOSITORY_PROVIDER` del contexto | Los tokens de sus repositorios |
| `<feature>.adapters.module.ts` | Otros adapters de salida (pasarela, configuración) | Los tokens de esos ports |
| `<feature>.use-cases.module.ts` | `*_USE_CASE_PROVIDER`; importa los módulos de repositorios y adapters que necesita, **aunque sean de otro contexto** | Los casos de uso |
| `<feature>.module.ts` | Los controladores; importa su módulo de use-cases | Nada |

- Un contexto usa repositorios de otro importando su `repositories.module`, **nunca** registrando el mismo provider dos veces. Ejemplo: los casos de uso de transacciones importan `ProductRepositoriesModule`.
- `infrastructure/modules/app.module.ts` solo importa los `<feature>.module.ts` y los módulos globales (`ConfigModule`, `ThrottlerModule`, `PersistenceModule`).
- Un contexto crea solo los módulos que necesita: `health` solo tiene `health.module.ts`.

### Qué va en `domain/constants`

| Sí | No |
|----|----|
| Catálogos cerrados del negocio: `TRANSACTION_STATUS` (`PENDING`, `APPROVED`, `DECLINED`, `VOIDED`, `ERROR`), `DELIVERY_STATUS`, `CARD_BRAND` | Funciones que leen `process.env`: van en `config/` |
| Tipos derivados: `type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS]` | Parámetros de paginación: son de `application` |
| Parámetros fijos del negocio: moneda, longitud de referencia | Códigos HTTP, nombres de tablas, URLs de la pasarela |

Los DTOs, adapters y mappers importan estas constantes desde `domain/constants`, nunca al revés.

### Qué va en `domain/rules`

Una regla va en el dominio cuando decide algo del negocio a partir de datos ya cargados, sin consultar a nadie. Hay cuatro formas:

- **Resolver:** `resolveTransactionStatus(gatewayStatus)` devuelve el estado interno, o `null` si no existe la correspondencia.
- **Comprobar (ROP):** `checkStockAvailable(product, quantity)` devuelve `Result<void, AppError>`: `ok` si se cumple, `err(outOfStock())` si no. Sustituye al clásico `assert` que lanza excepción.
- **Consultar:** `isStockAvailable(product, quantity)` devuelve `boolean` sobre la misma regla, útil en listados.
- **Calcular:** `calculateTransactionAmounts({ unitPriceInCents, quantity, fees })` devuelve el desglose del cobro, sin efectos secundarios.

La regla declara su **propia interfaz mínima de entrada** (`interface StockContext { id: string; stock: number }`) en lugar de importar un DTO o la entidad completa; entidades y DTOs la satisfacen por tipado estructural. Al no tener I/O, se prueban sin mocks.

Se queda en `application` lo que depende del caso de uso y no del negocio: armado de respuestas (`*.mapper.ts`), paginación y normalización de entrada.

## Railway Oriented Programming

### La idea

Cada operación tiene dos rieles: el de **éxito** y el de **error**. Mientras todo va bien, el valor avanza por el riel de éxito. En cuanto un paso falla, el flujo cambia al riel de error y los pasos siguientes **no se ejecutan**; el error llega intacto al final.

```mermaid
flowchart LR
    IN([input]) --> P1[buscar producto] --> P2[verificar stock] --> P3[crear transacción] --> P4[guardar] --> OK([ok: output])
    P1 -. "err: PRODUCT_NOT_FOUND" .-> KO([err: AppError])
    P2 -. "err: OUT_OF_STOCK" .-> KO
    P3 -. "err: INVALID_AMOUNT" .-> KO
    P4 -. "err: DB_QUERY_FAILED" .-> KO
```

Así se elimina el `try/catch` disperso: el camino feliz se lee de arriba abajo y cada error queda **tipado** en la firma de la función.

### Herramientas (neverthrow)

| Operación | Uso |
|-----------|-----|
| `ok(value)` / `err(error)` | Crear un `Result` síncrono. |
| `okAsync` / `errAsync` / `ResultAsync` | Versión asíncrona; es lo que devuelven los ports y los casos de uso. |
| `.map(fn)` | Transformar el valor con una función que **no puede fallar**. |
| `.andThen(fn)` | Encadenar un paso que **puede fallar** (devuelve `Result` o `ResultAsync`). |
| `.mapErr(fn)` | Transformar o enriquecer el error. |
| `.orElse(fn)` | Recuperarse de un error o ejecutar una compensación. |
| `.match(onOk, onErr)` | Salir del riel. Solo se usa en el controlador. |
| `Result.combine([...])` | Validar varias cosas y obtener todos los valores o el primer error. |
| `ResultAsync.fromPromise` / `Result.fromThrowable` | Envolver código que lanza (Prisma, fetch). Solo en adapters. |

### Reglas

1. `domain` y `application` **no lanzan** excepciones por errores de negocio: devuelven `err(...)`. Tampoco leen la hora ni generan ids por su cuenta: los piden a `ClockPort` e `IdGeneratorPort`, así los tests son deterministas (el lint lo exige).
2. `throw` se reserva para bugs de programación (estados imposibles). Los captura el filtro global de NestJS y responden 500.
3. Los **adapters son la frontera**: toda llamada que puede lanzar (Prisma, HTTP a la pasarela) se envuelve con `fromPromise` y su fallo se traduce a `AppError`.
4. Los **ports devuelven `ResultAsync<T, AppError>`**, nunca una `Promise` que pueda rechazarse.
5. Solo la capa HTTP sale del riel: `match` → respuesta, o `HttpException` mediante el error mapper.
6. Los errores tienen un `code` **estable** (`OUT_OF_STOCK`); el frontend reacciona al código, no al mensaje.
7. Cada caso de uso se prueba en el camino feliz **y en cada rama de error**, verificando que los pasos posteriores no se ejecutaron.

### Modelo de errores

```ts
// shared/errors/app-error.ts
export type AppErrorType =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EXTERNAL_SERVICE'
  | 'INFRASTRUCTURE';

export interface AppError {
  readonly type: AppErrorType;
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}

export const appError = (
  type: AppErrorType,
  code: string,
  message: string,
  cause?: unknown,
): AppError => ({ type, code, message, cause });
```

```ts
// domain/errors/product.errors.ts
export const productNotFound = (id: string) =>
  appError('NOT_FOUND', 'PRODUCT_NOT_FOUND', `Product ${id} not found`);

export const outOfStock = () =>
  appError('CONFLICT', 'OUT_OF_STOCK', 'Not enough units available');
```

| `AppError.type` | HTTP | Ejemplos de `code` |
|-----------------|------|--------------------|
| `VALIDATION` | 422 | `INVALID_AMOUNT`, `INVALID_EMAIL` |
| `NOT_FOUND` | 404 | `PRODUCT_NOT_FOUND`, `TRANSACTION_NOT_FOUND` |
| `CONFLICT` | 409 | `OUT_OF_STOCK`, `TRANSACTION_ALREADY_RESOLVED` |
| `EXTERNAL_SERVICE` | 502 | `PAYMENT_GATEWAY_UNAVAILABLE`, `PAYMENT_GATEWAY_REJECTED` |
| `INFRASTRUCTURE` | 500 | `DB_QUERY_FAILED` |

La validación de **formato** de la petición (campos obligatorios, tipos) la hace el `ValidationPipe` con class-validator y responde 400 antes de llegar al caso de uso. La validación de **negocio** vive en el dominio y viaja por el riel.

## Ejemplo real: crear una transacción

Fragmentos abreviados del código de `POST /api/transactions`; la versión completa está en `src/`.

### 1. Dominio: value object, regla y agregado

```ts
// domain/value-objects/quantity.vo.ts — si existe una instancia, la cantidad es válida
export class Quantity {
  private constructor(readonly value: number) {}

  static create(value: number): Result<Quantity, AppError> {
    return Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY_PER_PURCHASE
      ? ok(new Quantity(value))
      : err(invalidQuantity(value));
  }
}
```

```ts
// domain/rules/stock.rules.ts — regla pura con su interfaz mínima de entrada
export const checkStockAvailable = (
  product: StockContext,
  quantity: number,
): Result<void, AppError> =>
  product.stock >= quantity
    ? ok(undefined)
    : err(outOfStock(product.id, quantity, product.stock));
```

```ts
// domain/entities/transaction.entity.ts — aggregate root que contiene su entrega
static create(input: NewTransaction): Transaction {
  return new Transaction({
    id: input.id,
    reference: referenceFor(input.id),
    status: TRANSACTION_STATUS.PENDING,
    quantity: input.quantity.value,
    amounts: calculateTransactionAmounts({
      unitPriceInCents: input.unitPriceInCents,
      quantity: input.quantity.value,
      fees: input.fees,
    }),
    delivery: Delivery.create(input.deliveryAddress),
    // …
  });
}
```

`Transaction.create` no devuelve `Result` porque no puede fallar: recibe un `Quantity` ya validado. El tipo hace imposible el estado inválido (*parse, don't validate*).

### 2. Ports

```ts
export interface CustomerRepositoryPort {
  /** Upsert por email: si ya existe, actualiza su contacto y devuelve el existente. */
  saveByEmail(customer: Customer): ResultAsync<Customer, AppError>;
}

export interface TransactionRepositoryPort {
  /** Guarda la transacción y su entrega de forma atómica. */
  create(transaction: Transaction): ResultAsync<void, AppError>;
}

export interface IdGeneratorPort { generate(): string } // UUID v7
export interface ClockPort { now(): Date } // fecha fija en los tests
```

### 3. Use Case: el pipeline de ROP

```ts
execute(input: CreateTransactionInput): ResultAsync<TransactionOutput, AppError> {
  return Result.combine([
    Quantity.create(input.quantity), // INVALID_QUANTITY
    Customer.create({ id: this.ids.generate(), ...input.customer }), // INVALID_EMAIL
  ])
    .asyncAndThen(([quantity, customer]) =>
      this.findSellableProduct(input.productId, quantity) // PRODUCT_NOT_FOUND, OUT_OF_STOCK
        .map((product) => ({ quantity, customer, product })),
    )
    .andThen(({ customer, ...purchase }) =>
      this.customers
        .saveByEmail(customer) // DB_QUERY_FAILED
        .map((savedCustomer) => ({ ...purchase, customer: savedCustomer })),
    )
    .andThen(({ quantity, product, customer }) => {
      const transaction = this.openTransaction(input, quantity, product, customer);

      return this.transactions
        .create(transaction) // DB_QUERY_FAILED
        .map(() => ({ transaction, product, customer }));
    })
    .map(toTransactionOutput);
}
```

Se lee de arriba abajo y cada paso declara cómo puede fallar. Las validaciones sin I/O van primero: una petición inválida nunca toca la base de datos, y si el producto no existe o está agotado, el cliente no se registra.

El caso de uso **no tiene decoradores de NestJS**: implementa `UseCase`, recibe los ports por constructor y la infraestructura lo registra con `useCaseProvider`.

### 4. Test del Use Case

```ts
// tests/unit/application/use-cases/transaction/create-transaction.use-case.spec.ts
it('falla con OUT_OF_STOCK sin registrar al cliente', async () => {
  products.findById.mockReturnValue(okAsync(aProduct({ stock: 1 })));

  const result = await useCase.execute(aCreateTransactionInput({ quantity: 2 }));

  expect(result._unsafeUnwrapErr().code).toBe('OUT_OF_STOCK');
  expect(customers.saveByEmail).not.toHaveBeenCalled();
  expect(transactions.create).not.toHaveBeenCalled();
});
```

Cada rama de error comprueba también que los pasos siguientes **no** se ejecutaron: esa es la garantía del riel.

### 5. Adapters de persistencia

```ts
// customer.prisma.repository.ts — upsert atómico por email
saveByEmail(customer: Customer): ResultAsync<Customer, AppError> {
  const { id, fullName, email, phone } = customer.toPlainObject();

  return ResultAsync.fromPromise(
    this.prisma.customer.upsert({
      where: { email },
      create: { id, fullName, email, phone },
      update: { fullName, phone },
    }),
    databaseError,
  ).map(toCustomerEntity);
}
```

```ts
// transaction.prisma.repository.ts — transacción + entrega en una escritura anidada (atómica)
create(transaction: Transaction): ResultAsync<void, AppError> {
  return ResultAsync.fromPromise(
    this.prisma.transaction.create({
      data: toTransactionCreateData(transaction),
      select: { id: true },
    }),
    databaseError,
  ).map(() => undefined);
}
```

### 6. Controller y error mapper

```ts
// infrastructure/http/errors/app-error.http-mapper.ts
const STATUS_BY_TYPE: Record<AppErrorType, HttpStatus> = {
  VALIDATION: HttpStatus.UNPROCESSABLE_ENTITY,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  EXTERNAL_SERVICE: HttpStatus.BAD_GATEWAY,
  INFRASTRUCTURE: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** Salida del riel en los controladores. */
export const unwrapOrThrowHttp = async <T>(
  result: Result<T, AppError> | PromiseLike<Result<T, AppError>>,
): Promise<T> => {
  const settled = await result;

  if (settled.isErr()) {
    throw toHttpException(settled.error);
  }

  return settled.value;
};
```

```ts
// infrastructure/http/controllers/transaction.controller.ts
@Post()
create(@Body() request: CreateTransactionRequest): Promise<TransactionResponse> {
  return unwrapOrThrowHttp(this.createTransaction.execute(request));
}
```

El request DTO valida el formato (con los textos ya recortados por `@Trim()`) y rechaza los campos que no existen: si el cliente envía `totalInCents`, responde 400, porque los montos los calcula el backend.

La respuesta de error nunca incluye `cause`: los detalles internos se registran en el log, no se envían al cliente.

### 7. Módulo

```ts
// infrastructure/modules/product/product.repositories.module.ts
const providers = [PRODUCT_REPOSITORY_PROVIDER];

@Module({ providers, exports: providers })
export class ProductRepositoriesModule {}
```

```ts
// infrastructure/modules/transaction/transaction.use-cases.module.ts
export const CREATE_TRANSACTION_USE_CASE_PROVIDER = useCaseProvider(
  CreateTransactionUseCase,
  [
    PRODUCT_REPOSITORY,
    CUSTOMER_REPOSITORY,
    TRANSACTION_REPOSITORY,
    CHECKOUT_SETTINGS,
    ID_GENERATOR,
    CLOCK,
  ],
);

const providers = [CREATE_TRANSACTION_USE_CASE_PROVIDER];

@Module({
  imports: [
    ProductRepositoriesModule, // de otro contexto: se importa, no se re-registra
    CustomerRepositoriesModule,
    TransactionRepositoriesModule,
    CheckoutAdaptersModule,
    SystemAdaptersModule,
  ],
  providers,
  exports: providers,
})
export class TransactionUseCasesModule {}
```

```ts
// infrastructure/modules/transaction/transaction.module.ts
@Module({
  imports: [TransactionUseCasesModule],
  controllers: [TransactionController],
})
export class TransactionModule {}
```

El controlador inyecta el caso de uso por su clase (`constructor(private readonly createTransaction: CreateTransactionUseCase)`), que es su token.

## El riel del pago

El caso de uso más delicado es el que cobra (`SubmitPaymentUseCase`). Tiene que garantizar tres cosas: **nunca cobrar dos veces**, **nunca dejar una compra colgada** si la pasarela falla y **descontar el stock una sola vez** aunque varias peticiones liquiden a la vez.

```mermaid
flowchart TD
    A["buscar transacción + producto + cliente"] --> B["dominio: startPayment<br/>(PENDING y sin envío previo)"]
    B --> C["regla: checkStockAvailable"]
    C --> D["repositorio: claimPaymentSubmission<br/>UPDATE … WHERE payment_submitted_at IS NULL"]
    D --> E["pasarela: charge<br/>(firma + espera ~10 s el estado final)"]
    E --> F["recordPaymentResult:<br/>applyPaymentResult + savePaymentResult"]
    F --> OK([ok: APPROVED / DECLINED / PENDING])
    A -. "TRANSACTION_NOT_FOUND" .-> KO([err])
    B -. "TRANSACTION_ALREADY_RESOLVED<br/>PAYMENT_ALREADY_SUBMITTED" .-> KO
    C -. "OUT_OF_STOCK" .-> KO
    D -. "PAYMENT_ALREADY_SUBMITTED<br/>(otra petición se adelantó)" .-> KO
    E -. "PAYMENT_GATEWAY_REJECTED / UNAVAILABLE" .-> COMP["orElse: failPayment → ERROR<br/>(compensación)"] -.-> KO
```

- **Un pago rechazado no es un error del riel.** `DECLINED` es un resultado de negocio válido y viaja por el riel de éxito (HTTP 200, con el motivo en `statusMessage`).
- **Doble envío imposible.** Primero lo comprueba el dominio (`startPayment`). Después, un `UPDATE` condicional en PostgreSQL (`claimPaymentSubmission`) resuelve la carrera entre dos peticiones simultáneas: solo una encuentra `payment_submitted_at` vacío.
- **Compensación.** Si la pasarela rechaza o no recibe el cobro, `orElse` deja la compra en `ERROR` (con la entrega cancelada) y devuelve el error original. Si ni siquiera eso se puede guardar, prevalece el error de la pasarela.
- **Espera acotada.** El adapter consulta el estado hasta `PAYMENT_GATEWAY_POLL_TIMEOUT_MS`. Si no llega a un estado final, se responde `PENDING` y la consulta sigue en `GET /api/transactions/:id`.

### Liquidación compartida

`recordPaymentResult` es la regla que comparten el pago y la consulta (`GetTransactionUseCase`). Aplica la respuesta de la pasarela en el dominio (`applyPaymentResult`) y la persiste (`savePaymentResult`). Si el estado es final, eso liquida la compra **en una sola transacción de base de datos**:

| Resultado | Transacción | Entrega | Stock |
|-----------|-------------|---------|-------|
| `APPROVED` | `APPROVED` + `finalizedAt` | `ASSIGNED` | `stock - quantity` (solo si `stock >= quantity`) |
| `DECLINED` / `VOIDED` / `ERROR` | ese estado + motivo | `CANCELLED` | sin cambios |
| `PENDING` | registra el id del cobro | sin cambios | sin cambios |

La liquidación es **idempotente**: el `UPDATE` está condicionado a `status = 'PENDING'`. Si la SPA consulta dos veces a la vez y ambas encuentran el cobro aprobado, PostgreSQL bloquea la fila, la segunda no encuentra nada que actualizar y el stock se descuenta una sola vez.

### Consulta y sincronización

`GetTransactionUseCase` pregunta a la pasarela solo si hay un cobro pendiente (`pendingPaymentId()`). Si la pasarela no responde, **no es un error**: devuelve la transacción tal como está y la SPA vuelve a consultar.

## Pruebas por nivel

Todas las pruebas viven en `tests/`, fuera de `src/`: el código de producción no se mezcla con sus pruebas y el build no las ve. Una sola `jest.config.ts` define un proyecto de Jest por nivel, y cada script elige el suyo con `--selectProjects`.

| Nivel | Carpeta y sufijo | Qué prueba | Qué se simula | Comando |
|-------|------------------|------------|---------------|---------|
| Unitario | `tests/unit/**/*.spec.ts` | Una pieza aislada: value object, regla, entidad, caso de uso, mapper, repositorio, cliente de la pasarela, controlador o DTO | Sus dependencias directas: ports, Prisma, `fetch` o casos de uso | `pnpm test` · `pnpm test:cov` |
| Integración | `tests/integration/**/*.int-spec.ts` | Varias piezas reales juntas: NestJS resuelve los tokens de cada módulo, y `configureApp` y los controladores responden por HTTP (supertest) | Solo lo externo: Prisma, `ConfigService` y `fetch` | `pnpm test:integration` |
| E2E | `tests/e2e/**/*.e2e-spec.ts` | La API completa, de la petición HTTP a PostgreSQL y el Sandbox de la pasarela | Nada: requiere migraciones, seed, variables de la pasarela e internet | `pnpm test:e2e` |

- **Unitarias como espejo de `src/`:** `src/domain/rules/stock.rules.ts` se prueba en `tests/unit/domain/rules/stock.rules.spec.ts`, así la prueba de cada archivo se encuentra sin buscarla.
- **La regla de dependencias también rige en las pruebas:** una prueba de `tests/unit/domain` no puede importar NestJS ni `@infrastructure`, igual que el código que prueba. El lint lo comprueba.
- **La cobertura se mide solo con las unitarias** (`pnpm test:cov`, umbral del 80 %). Lo que no alcanzan, el arranque de NestJS (`configureApp`, Swagger), sigue contando en el total y lo verifican las de integración.
- **`tests/support/` (alias `@testing/*`):** `fixtures/` con datos válidos y overrides (`aProduct({ stock: 0 })`, `aTransactionOutput()`), `mocks/` con dobles de ports y casos de uso (`mockProductRepository()`, `mockUseCase()`) y `helpers/` (`validateRequest()`). El código de producción no puede importarlo, ni por alias ni por ruta relativa.

El adaptador HTTP se prueba en dos niveles, cada uno con su responsabilidad:

| Pieza | Unitaria | Integración |
|-------|----------|-------------|
| Controlador | Con `mockUseCase`: la entrada que recibe el caso de uso, el resultado tal cual y cada `err` convertido en su `HttpException` | Con supertest: rutas, códigos HTTP y formato del error |
| Request DTO | Con `validateRequest`, que transforma y valida como el `ValidationPipe`: reglas de cada campo, rutas anidadas y normalización de textos | Con el `ValidationPipe` real: 400 `INVALID_REQUEST` y campos desconocidos rechazados |
| Módulo | — | NestJS construye los controladores con sus casos de uso y adapters reales |

```ts
// tests/unit/infrastructure/http/controllers/product.controller.spec.ts
const listProducts = mockUseCase<ListProductsUseCase>();
const getProduct = mockUseCase<GetProductUseCase>();
const controller = new ProductController(listProducts, getProduct);

it('sale del riel con 404 PRODUCT_NOT_FOUND si no existe', async () => {
  getProduct.execute.mockReturnValue(errAsync(productNotFound(MISSING_PRODUCT_ID)));

  await expect(controller.get(MISSING_PRODUCT_ID)).rejects.toMatchObject({
    status: HttpStatus.NOT_FOUND,
    response: { code: 'PRODUCT_NOT_FOUND' },
  });
});
```

## Teoría

Cuando se trabaja desde cero una funcionalidad, el flujo arranca así:

**Entidad de dominio.** Defines la entidad con sus atributos, invariantes y métodos (`create()`, `reconstitute()`, `toPlainObject()`), sin que conozca nada del mundo exterior. `create()` valida y devuelve un `Result`; `reconstitute()` reconstruye desde la base de datos sin volver a validar, porque esos datos ya fueron válidos al guardarse.

**Constants, Value Objects y Rules.** Las constantes fijan el lenguaje ubicuo (`PENDING`, `APPROVED`, `DELIVERED`) que comparten todas las capas. Los value objects encapsulan valores con reglas propias, como un monto que no puede ser negativo. Las reglas son funciones puras que toman decisiones que no pertenecen a una sola entidad, por ejemplo si hay stock suficiente. Al no tener I/O se prueban sin mocks.

**Errores de dominio.** Cada forma de fallar del negocio tiene una fábrica con código estable. Son valores, no excepciones: forman parte de la firma de las funciones.

**El Port** es una promesa: una interfaz que dice "alguien me va a proporcionar esta funcionalidad, pero no sé quién". Como devuelve `ResultAsync`, el caso de uso sabe que la operación puede fallar y cómo, sin conocer Prisma ni HTTP.

**Los DTOs de aplicación** son tipos planos que describen qué entra y qué sale del caso de uso, independientes del contrato HTTP.

**El Use Case** orquesta el flujo como un pipeline: cada paso es un `andThen` o un `map`. No hay `try/catch` ni `if (error) return`; el riel se encarga de cortar el flujo en el primer fallo. Aquí se escriben los tests, con mocks de los ports, cubriendo el camino feliz y cada rama de error.

Con el caso de uso validado, llega el momento de la persistencia: se crea o actualiza el modelo en `schema.prisma`, se genera la migración y Prisma crea las tablas.

**El Repository** es quien se ensucia las manos: implementa el port con PrismaClient, envuelve cada consulta con `ResultAsync.fromPromise` para que nada lance, y mapea fila ↔ entidad. El **cliente de la pasarela** hace lo mismo con las llamadas HTTP externas.

**El Controller** recibe la petición ya validada por el request DTO, ejecuta el caso de uso y sale del riel: si es `ok` devuelve la respuesta; si es `err`, el error mapper lo convierte en el código HTTP correspondiente.

**El Módulo** conecta todo: asocia cada token de port con su adapter y construye los casos de uso inyectándoles los ports.

Cada capa tiene una única responsabilidad, y cada error tiene un tipo y un código: cuando algo falla, sabes exactamente dónde buscar.

## Por qué cumple Hexagonal + DDD + ROP

### Hexagonal (Ports & Adapters)

| Principio | Cómo se cumple |
|-----------|----------------|
| **Núcleo aislado** | `domain` y `application` no importan NestJS, Prisma ni class-validator. Los casos de uso no tienen decoradores. |
| **Ports** | Las interfaces de `application/ports` son propiedad del núcleo, no del adapter. |
| **Adapters** | Repositorios Prisma, cliente de la pasarela (salida) y controladores HTTP (entrada) se pueden cambiar sin tocar el negocio. |
| **Inversión de dependencias** | La aplicación define el contrato y la infraestructura lo implementa; el módulo los conecta con tokens de inyección. |

### Domain-Driven Design

| Principio | Cómo se cumple |
|-----------|----------------|
| **Aggregate Root** | `Product`, `Customer` y `Transaction`: constructor privado, `create()` y `reconstitute()` garantizan que no existan instancias inválidas. |
| **Agregados y sus límites** | `Transaction` contiene su `Delivery` (se crean juntas y la entrega solo cambia al liquidar la transacción). Entre agregados se referencia por id: la transacción guarda `productId` y `customerId`, no los objetos. |
| **Value Objects** | `Email` (normalizado: es la identidad del cliente) y `Quantity` (1..10): inmutables y validados al crearse. |
| **Lógica en el dominio** | `calculateTransactionAmounts()`, `checkStockAvailable()`: el total y la disponibilidad los decide el dominio, nunca el cliente ni el controlador. |
| **Lenguaje ubicuo** | `domain/constants` define una sola vez los términos del negocio. |
| **Repository Pattern** | Los ports de repositorio abstraen el almacenamiento y devuelven entidades completas. |

### Railway Oriented Programming

| Principio | Cómo se cumple |
|-----------|----------------|
| **Errores como valores** | Toda operación de negocio devuelve `Result` / `ResultAsync`; el tipo de error forma parte de la firma. |
| **Composición** | Los casos de uso son cadenas de `andThen` / `map`: el camino feliz se lee de arriba abajo. |
| **Cortocircuito** | En el primer `err` los pasos siguientes no se ejecutan; los tests lo verifican. |
| **Fronteras explícitas** | Solo los adapters convierten excepciones en `err`, y solo el controlador convierte `err` en HTTP. |
| **Compensación** | `orElse` deja consistente el estado cuando un servicio externo falla a mitad del flujo. |

## Checklist de revisión

- [ ] Cada archivo de `src/` con lógica tiene su prueba unitaria en `tests/unit/`, en la misma ruta.
- [ ] Los datos de prueba salen de `@testing/fixtures` y los dobles de ports y casos de uso de `@testing/mocks`; ningún archivo de producción importa `@testing`.
- [ ] Cada contexto tiene la prueba de integración de su módulo y, si expone endpoints, la de sus controladores con supertest.
- [ ] `domain/` y `application/` no importan `@nestjs/*`, `@prisma/client`, `class-validator`, `config` ni `infrastructure/`.
- [ ] `domain/` no importa `application/`.
- [ ] Los imports entre carpetas usan alias (`@shared`, `@domain`, `@application`, `@infrastructure`, `@config`).
- [ ] Los casos de uso implementan `UseCase<Input, Output>` y no tienen decoradores; se registran con `useCaseProvider` en su `<feature>.use-cases.module.ts`.
- [ ] Ningún provider se registra dos veces: los repositorios de otro contexto se obtienen importando su `repositories.module`.
- [ ] No hay `throw` de negocio en `domain/` ni `application/`.
- [ ] Los ports devuelven `ResultAsync<T, AppError>`.
- [ ] Toda llamada a Prisma o a la pasarela está envuelta con `fromPromise` / `fromThrowable`.
- [ ] Los controladores no tienen lógica: validan, ejecutan el caso de uso y salen del riel con `unwrapOrThrowHttp`.
- [ ] Cada caso de uso tiene test del camino feliz y de cada rama de error.
- [ ] El nombre comercial de la pasarela no aparece en el código.

Comprobación automática desde `backend/`:

```bash
pnpm typecheck && pnpm lint && pnpm test:cov && pnpm test:integration
```

`eslint.config.mjs` convierte las reglas de este checklist en errores de lint: `shared`, `domain` y `application` no pueden importar frameworks (`@nestjs/*`, `@prisma/*`, `class-validator`, `class-transformer`, `express`) ni capas exteriores, y no pueden usar `throw`; sus pruebas unitarias cumplen la misma regla de dependencias. `test:cov` mide la cobertura con las pruebas unitarias y falla si baja del 80%.
