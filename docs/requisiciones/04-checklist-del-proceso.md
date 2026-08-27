# Checklist del proceso (pasos por requisición)

Modal: [`ProcesoRequisicionModal.tsx`](../../src/Components/Requisiciones/tablaRequisiciones/Proceso/ProcesoRequisicionModal.tsx) · Hooks: [`src/Funcionalidades/Requisiciones/DetallesRequisicion/`](../../src/Funcionalidades/Requisiciones/DetallesRequisicion/)

## 1. Dos capas: plantilla vs. instancia

Hay dos listas de SharePoint distintas, con dos hooks distintos:

| | Lista | Modelo | Hook | Qué es |
|---|---|---|---|---|
| **Plantilla** (global, compartida) | `Requisicion - Pasos` | `pasoRequisicion` | `useStepsCatalogRequisicion` | Los pasos configurables del proceso: `Title`, `TipoPaso` (`Aprobacion`\|`Texto`\|`Numerico`), `Descripcion`, `Obligatorio`, `Activo`, `OrdenPaso`. Se administra una sola vez y aplica a todas las requisiciones. |
| **Instancia** (por requisición) | `Requisicion - Detalles Requisicion` | `detalleRequisicion` | `useStepDetails` | Una fila por cada paso de la plantilla, ligada a una requisición concreta vía `IdRequisicion`, con su propio `Estado` (`Pendiente`\|`Completado`\|`Omitido`), `Notas`, `CompletadoPor`, `FechaCompletadoPor`. |

`Title` en `detalleRequisicion` guarda el **Id del paso de plantilla** (no un texto libre) — es la clave que conecta la instancia con su plantilla (`buildTemplateStepMap`/`buildDetailStepMap` en `DetallesRequisicion/utils.ts`).

Las instancias se crean todas de una vez cuando se crea la requisición (`createDetallesPasosRequisicion`, ver [02](./02-creacion-de-requisicion.md#24-creación-de-la-instancia-del-checklist)), todas en `Estado: "Pendiente"`.

## 2. `useRequisicionSteps(requisicionId)` — el hook compuesto del checklist

Archivo: [`useRequisicionSteps.ts`](../../src/Funcionalidades/Requisiciones/DetallesRequisicion/useRequisicionSteps.ts). Sigue el mismo patrón de composición que `useRequisicion()` (ver [01](./01-contexto-e-inyeccion.md)), pero **sin Context** — se llama directamente dentro de `ProcesoRequisicionModal`, porque solo ese modal lo necesita:

- `useStepsCatalogRequisicion` → plantilla completa (incluye inactivos, `includeInactive: true`), con `activate`/`desactivate` para administrar la plantilla.
- `useStepDetails` → instancias de **esta** requisición (`fields/IdRequisicion eq '<id>'`), y `resolveStepRows` las empareja con su plantilla en `resolvedRows`.
- `useStepDecisionState` → estado local de UI (`decisiones`, `motivos`) para lo que el usuario está tipeando/seleccionando antes de confirmar un paso.
- `useStepCompletion` → la acción de completar/omitir un paso (el corazón de la lógica).

## 3. Desbloqueo secuencial

El checklist se resuelve **en orden** (`sortChecklistSteps`, por `Id` numérico de la plantilla, con fallback alfabético). Un paso está desbloqueado (`unlocked`) si es el primero, o si el paso anterior ya está `isStepDone` (`Completado` u `Omitido`). `ProcesoRequisicionModal` solo renderiza pasos `unlocked` o ya `done` — los pasos futuros ni se muestran, no solo se deshabilitan. Esto fuerza a completar el proceso estrictamente en el orden de `OrdenPaso`.

`resolveChecklistPhase` calcula el resumen que se ve en el header del modal (`"N/M pasos"` + el nombre del paso actual pendiente, o `"Checklist completado"` si no queda ninguno).

## 4. Completar un paso — reglas según `TipoPaso`

`useStepCompletion.handleCompleteStep(detalle, estado)`:

- **`Omitido`**: no valida nada adicional; guarda `Notas: detalle.Notas || "Paso omitido"`.
- **`Completado`**, según `TipoPaso` del paso de plantilla:
  - `"Aprobacion"`: exige que el usuario haya elegido `Aprobado`/`Rechazado` en el `<select>`; si es `Rechazado`, exige además un motivo de texto. `Notas` queda como `"Aprobado"` o `"Rechazado con el motivo: <motivo>"`.
  - `"Texto"`: exige un valor de texto no vacío; se guarda tal cual en `Notas`.
  - `"Numerico"`: exige un valor no vacío (validado como string, no se castea a número); se guarda tal cual en `Notas`. **Este es el campo que alimenta el embudo de selección en Métricas** — ver más abajo.
  - En cualquier caso no válido, `notify.auto(...)` corta el flujo sin escribir en SharePoint.

Si el paso ya estaba `Completado`/`Omitido`, se rechaza con un mensaje ("Este paso ya se encuentra en estado ...") — no se puede reabrir un paso ya resuelto desde esta pantalla.

## 5. Al completar el último paso: cierre automático + encuesta

`updatePorcentajeRequisicion` recalcula `porceranje` (el % de avance, `calculatePorcentaje` = pasos completados u omitidos / pasos de plantilla activos) y lo guarda siempre en la requisición. Cuando el porcentaje llega a **100**:

1. `calcularEstadoCierre(requisicionId, requisicionesService)`: compara `fechaLimite` contra el momento actual → `cumpleANS = "Si"` si aún no se había vencido, `"No"` si ya estaba vencida.
2. `shouldNotifyAllStepsCompleted(...)`: decide si corresponde disparar la encuesta de satisfacción (evita reenvíos si ya se había notificado — revisa `utils/notificationRules.ts` para la condición exacta).
3. Si corresponde, marca `notified: true` y envía `notifyEncuestaSatisfaccion` al `correoSolicitante` original.
4. Guarda `Estado: <resultado del paso 1>`, `fechaCierre: <ahora>` junto con el `porceranje`.

Es decir: **no existe un botón explícito de "cerrar requisición"** en la UI actual — el cierre (`Estado`, `cumpleANS`, `fechaCierre`) ocurre automáticamente como efecto secundario de completar el último paso del checklist.

## 6. Relación con Métricas

El campo `Notas` de cada `detalleRequisicion` `Completado`/`Omitido` se interpreta como **cantidad numérica** en el hook de métricas (`Number(detail.Notas)`), y los pasos con `Id` de plantilla `"3"`, `"5"`, `"7"`, `"4"` alimentan el embudo (`recibidas`, `entrevistas`, `finalista`, `seleccionada` respectivamente) — ver [05-metricas-dashboard.md](./05-metricas-dashboard.md#2-embudo-de-selección). Esto implica que, en la plantilla de pasos actual, los pasos con esos IDs deben ser de `TipoPaso: "Numerico"` (candidatos recibidos, entrevistados, etc.) para que el embudo tenga sentido — si la plantilla de pasos cambia de IDs, hay que actualizar `resolveFunnelStage` en `requisicionesMetrics.ts` en paralelo.
