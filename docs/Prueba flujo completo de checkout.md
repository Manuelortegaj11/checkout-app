# Prueba del flujo completo de checkout

**Fecha:** 27/09/2026

**Entorno:** local (`http://localhost:3000`)

**Backend:** `http://localhost:3001/api`

**Base de datos:** PostgreSQL 17 en Docker

**Pasarela:** Sandbox

## Estado

- [x] Validación integrada del frontend.
- [x] Validación end-to-end del backend, PostgreSQL y Sandbox.
- [x] Healthcheck y cabeceras HTTP de seguridad.
- [x] Evidencia visual de procesamiento, aprobación y rechazo en escritorio.
- [x] Recorrido visual completo del formulario, refresh y responsive.

**Resultado funcional automatizado:** APROBADO.

**Cierre visual:** APROBADO. El recorrido completo fue validado manualmente, incluidos formulario, resumen, refresh, responsive y compatibilidad entre navegadores.

## Resultados ejecutados

| Nivel | Comando | Resultado |
|---|---|---|
| Frontend integrado | `cd frontend && pnpm test:integration` | 2 suites, 6/6 pruebas aprobadas |
| Backend end-to-end | `cd backend && pnpm test:e2e` | 5 suites, 20/20 pruebas aprobadas |
| Salud de la API | `GET /api/health` | HTTP 200, `{"status":"ok"}` |
| Base de datos | `pnpm db:deploy` y `pnpm db:seed` | Sin migraciones pendientes; 6 productos disponibles |

## Cobertura del recorrido

| Paso | Evidencia automatizada | Estado |
|---|---|---|
| 1. Producto | Lista el catálogo y el detalle desde el seed, incluidos productos agotados | Aprobado |
| 2. Pago y entrega | Abre el formulario, tokeniza la tarjeta y guarda únicamente el token; un refresh conserva contacto y paso, pero no la tarjeta | Aprobado |
| 3. Resumen | Presenta el checkout preparado y crea la compra con montos calculados en el backend | Aprobado |
| 4. Procesamiento | Procesa pagos aprobados y rechazados en Sandbox, impide cobros duplicados y conserva la consistencia del inventario | Aprobado |
| 5. Resultado | Muestra aprobación o rechazo, recupera el resultado tras un refresh y vuelve al catálogo actualizado | Aprobado |

## Casos críticos comprobados

- [x] La transacción se crea inicialmente en `PENDING`.
- [x] El backend calcula los montos; no confía en valores enviados por el navegador.
- [x] Una tarjeta aprobada termina en `APPROVED`, asigna la entrega y descuenta el stock.
- [x] Una tarjeta rechazada termina en `DECLINED`, muestra el motivo y devuelve la reserva.
- [x] La misma transacción no se puede cobrar dos veces.
- [x] Dos compras concurrentes no pueden reservar la misma última unidad.
- [x] Un producto agotado responde `OUT_OF_STOCK`.
- [x] Los datos inválidos no crean registros.
- [x] El refresh durante el procesamiento retoma las consultas sin volver a cobrar.
- [x] El refresh del resultado vuelve a sincronizar la transacción.
- [x] Swagger responde en `/api/docs`.

## Evidencia visual aportada

Las capturas del 27/09/2026 permiten confirmar:

- [x] El catálogo se mantiene visible detrás del backdrop sin desbordamiento horizontal en escritorio.
- [x] El estado de procesamiento muestra pedido registrado, cobro enviado y resultado pendiente.
- [x] Una compra con tarjeta terminada en `4242` muestra **¡Pago aprobado!**, entrega asignada y total pagado de `$ 270.400`.
- [x] El stock del teclado pasa de 3 a 2 después de la compra aprobada.
- [x] Una compra posterior con tarjeta terminada en `1111` muestra **Pago rechazado** y el motivo del Sandbox.
- [x] El rechazo muestra la entrega cancelada, conserva el stock en 2 y ofrece **Intentar de nuevo**.
- [x] Los importes son consistentes: producto `$ 259.900` + tarifa base `$ 2.500` + envío `$ 8.000` = total `$ 270.400`.

## Recorrido visual manual

### Preparación

```bash
docker compose up -d

cd backend
pnpm start:dev

cd frontend
pnpm dev
```

Abrir `http://localhost:3000` y usar datos personales y de entrega ficticios.

### Compra aprobada

- [x] El catálogo muestra precio, descripción, imagen y stock sin desbordamientos en escritorio.
- [x] El botón de compra abre el formulario de tarjeta y entrega.
- [x] La marca de la tarjeta se detecta mientras se escribe.
- [x] Las validaciones impiden continuar con datos incompletos o inválidos.
- [x] El resumen muestra producto, tarifa base, envío y total.
- [x] Los contratos de aceptación se pueden abrir y aceptar.
- [x] Pagar con la tarjeta Sandbox aprobada `4242 4242 4242 4242`, fecha futura y CVC de tres dígitos.
- [x] La pantalla de procesamiento aparece mientras el pago está `PENDING`.
- [x] El resultado final muestra `APPROVED`.
- [x] Al cerrar el resultado se vuelve al catálogo con una unidad menos.

### Compra rechazada

- [x] Repetir el flujo con `4111 1111 1111 1111`, fecha futura y CVC de tres dígitos.
- [x] El resultado final muestra `DECLINED` y su motivo.
- [x] El inventario conserva la unidad.
- [x] La interfaz permite iniciar otro intento.

### Persistencia y responsive

- [x] Refrescar en el formulario: conserva paso y contacto, pero obliga a escribir nuevamente la tarjeta.
- [x] Refrescar durante el procesamiento: continúa consultando y no crea otro cobro.
- [x] Refrescar en el resultado: recupera la transacción desde el backend.
- [x] Repetir el recorrido a 375 × 667 px, referencia del iPhone SE indicada en la prueba.
- [x] Confirmar que no existe scroll horizontal, texto cortado ni botones fuera de pantalla.
- [x] Revisar al menos Chrome y Firefox o Edge.

## Criterio de cierre

La tarea **“Probar flujo completo de checkout”** queda terminada. Se validaron el recorrido visual manual, la lógica integrada, la persistencia, los pagos Sandbox, la concurrencia, el responsive, la compatibilidad entre navegadores y la recuperación tras refresh.
