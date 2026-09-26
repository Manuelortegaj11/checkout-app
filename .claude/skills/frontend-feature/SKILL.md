---
name: frontend-feature
description: Guía paso a paso para crear o modificar una funcionalidad del frontend (pantalla, componente, formulario, slice, thunk, selector, servicio de API, validación o estilos) siguiendo SPA con Next.js + Redux Toolkit (Flux), la máquina de pasos del checkout y las reglas de UI mobile first, imágenes, seguridad y tests. Úsala siempre que vayas a escribir o cambiar código en frontend/src.
---

# Funcionalidad de frontend: SPA + Redux (Flux)

Funcionalidad pedida: $ARGUMENTS

La referencia completa está en `frontend/docs/arquitectura/spa-redux-flux.md`. Léela si todavía no la has leído en esta sesión. Esta skill es el procedimiento; el documento es la teoría.

## Antes de escribir código

1. Identifica la feature: `products`, `checkout` o `transaction`. Si es lógica pura reutilizable, va en `shared/lib`.
2. Si toca el checkout, ubica el paso de la máquina afectado (`PRODUCT`, `PAYMENT_FORM`, `SUMMARY`, `PROCESSING`, `RESULT`) y qué debe pasar al refrescar en ese paso.
3. Revisa qué existe ya en `features/`, `shared/` y `store/`. Extiende en vez de duplicar.

## Orden de construcción

| Paso | Qué | Dónde | Regla clave |
|------|-----|-------|-------------|
| 1 | Lógica pura | `shared/lib/<tema>/` | Funciones sin React ni Redux. Test con `it.each`, cobertura 100%. |
| 2 | Servicio de API | `shared/api/<recurso>.api.ts` | Único lugar con `fetch` (vía `http-client`). Tipa request y response. |
| 3 | Slice | `features/<feature>/<feature>.slice.ts` | Estado inicial explícito; transiciones del checkout solo con acciones. |
| 4 | Thunks | `features/<feature>/<feature>.thunks.ts` | `createAsyncThunk` que llama al servicio; errores normalizados con `rejectWithValue`. |
| 5 | Selectores | `features/<feature>/<feature>.selectors.ts` | La vista nunca lee `state.x.y` directamente. |
| 6 | Tests de estado | `*.test.ts` junto a cada archivo | Reducer, cada `pending`/`fulfilled`/`rejected` y selectores. Servicios con `jest.mock`. |
| 7 | Componentes presentacionales | `features/<feature>/components/` | Solo props y callbacks. Sin Redux, sin API. |
| 8 | Componente contenedor | `features/<feature>/components/` | Lee con `useAppSelector`, despacha con `useAppDispatch`. |
| 9 | Tests de componentes | `*.test.tsx` | React Testing Library con `renderWithStore`; consultar por rol y label. |
| 10 | Composición | `app/` | Solo elige qué mostrar según el paso. Sin lógica. |
| 11 | Exportar | `features/<feature>/index.ts` | Otras features importan solo desde aquí. |

Si la funcionalidad solo toca algunas capas, haz solo esos pasos, pero siempre con su test.

## Reglas de estado y persistencia

- Flujo unidireccional: vista → `dispatch` → thunk → servicio → reducer → selector → vista.
- `redux-persist` solo sobre `checkout`. Los productos se vuelven a pedir siempre.
- **Nunca** guardar en el store ni en `localStorage` el número de tarjeta ni el CVC. Viven en el estado local del formulario y, al tokenizar, al store llegan solo `token`, `brand` y `last4`.
- Al rehidratar en `PROCESSING` con `transactionId`, reanudar la consulta de estado; nunca volver a cobrar.

## Reglas de UI

- Mobile first desde 375 px de ancho (iPhone SE 2020); ampliar con `sm:`, `md:`, `lg:`. Flexbox o grid; sin anchos fijos en contenedores.
- Nada se desborda: `min-w-0`, `max-w-full`, `break-words` donde haya texto largo.
- Imágenes: WebP o SVG, `width`/`height` o `aspect-ratio`, `object-fit`, `loading="lazy"` fuera de la primera pantalla.
- Modal y backdrop: `role="dialog"`, `aria-modal`, foco atrapado, cierre con `Escape`.
- Inputs de tarjeta: `inputMode="numeric"`, `autoComplete` (`cc-number`, `cc-exp`, `cc-csc`), errores con `aria-describedby`.
- `'use client'` en todo componente con estado, hooks o Redux. Nada de API routes, Server Actions ni SSR con lógica.
- La pasarela se nombra de forma genérica (`paymentGateway`); su nombre comercial no aparece en el código.

## Al terminar

Ejecuta desde `frontend/` y corrige lo que aparezca:

```bash
grep -rnE "fetch\(|shared/api" src/features/*/components src/app
grep -rnE "from '.*(features|store|app)/" src/shared
grep -rnE "cardNumber|cvc" src/store src/features/*/*.slice.ts
```

Las tres deben devolver cero resultados. Después ejecuta los tests con cobertura y confirma que sigue por encima del 80%.

Resume al usuario los archivos creados o modificados agrupados por capa (shared, store, features, app, tests) y cómo se comporta la funcionalidad al refrescar la página.
