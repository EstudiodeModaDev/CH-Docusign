# Tablero, filtros, detalle y edición

Rutas: `/requisicion/view` (y alias `/requisiciones/tableaRequisiciones`) · Wrapper: [`RequisicionBoardWrapper.tsx`](../../src/Routes/Wrapper/RequisicionBoardWrapper.tsx) · Tabla: [`tablaRequisiciones.tsx`](../../src/Components/Requisiciones/tablaRequisiciones/tablaRequisiciones.tsx)

## 1. Carga de filas — filtros, orden y paginación por `nextLink`

El tablero no pagina "en memoria": pagina contra Graph usando el `@odata.nextLink` que devuelve SharePoint, página por página.

- **`useRequisicionFilters.ts`**: guarda `search`, `estado`, `cargo`, `cumpleANS`, `ciudad`, `analista`, `mes`, `sorts`. `buildFilter()` arma el `$filter`/`$orderby`/`$top` de OData combinando todo con `and`. La búsqueda por texto (`search`) solo filtra si es numérica (`id eq <n>`) — es decir, el buscador libre solo sirve para buscar por ID, no por texto en otros campos. La búsqueda se debounce 250ms.
- **Filtro de seguridad**: si el usuario no tiene el permiso `requisiciones.viewAll`, se agrega automáticamente `correoSolicitante eq <mi correo> or correoProfesional eq <mi correo>` — es decir, solo ve sus propias requisiciones (como solicitante o como analista asignado). Esto ocurre a nivel de query, no de UI, así que ni siquiera se traen del servidor las filas ajenas.
- **`useRequisicionPagination.ts`**: guarda `pageIndex`, `pageSize` (10/20/50/100), y el `nextLink` de la página actual.
- **`useRequisicionList.ts`**: hace el fetch. Mantiene un array `pages` (caché de páginas ya vistas) para poder volver "Anterior" sin repetir la llamada de red; "Siguiente" sí siempre pide una página nueva con `getByNextLink`.

Cualquier cambio de filtro no dispara un refetch automático — hay que revisar el flujo: `applyRange()`/`reloadAll()` llaman `loadFirstPage()` explícitamente. En la práctica, el tablero (`FiltersRequisicionesTable`) llama a los setters de filtro; como `buildFilter` es un `useCallback` con esas dependencias, cualquier componente que dependa de él (como el `useEffect` de carga inicial) se puede volver a disparar si está en sus dependencias — revisa el componente concreto si necesitas el detalle exacto de cuándo se re-consulta.

## 2. La tabla (`RequisicionesBoard`)

Lee **todo** del contexto (`useRequisicionesContext()` directamente, no por props del wrapper): `rows`, `sorts`/`setSorts`, todos los filtros y sus setters, `pageIndex`/`pageSize`/`hasNext`/`hasPrevious`/`nextPage`/`prevPage`.

- **Stats en el header**: total, activas, en retraso, cerradas, canceladas — calculadas en el cliente sobre `rows` (o sea, sobre la página actual, no sobre el total real).
- **Orden por columna** (`handleSort`): un solo campo de orden a la vez; clic alterna asc/desc; se mapea a un campo real de Graph vía `mapSortField` (`utils/sorts.ts`).
- **Semaforización de "Seguimiento"** (`calcDayDifference`): compara `fechaLimite` contra hoy.
  - Si `Estado` contiene "cancel" → tono `cancel`. Si contiene "completa" → tono `closed`. Si contiene "activo"/"abiert" → tono `active`.
  - Si está activa y sin vencer: `> 2` días → "ok"; `0–2` días → "warn" ("Vence hoy"/"Vence en N días"); negativo → "danger" ("N días retraso").
- **Acciones por fila**, condicionadas a permisos (`usePermissions().engine.can(...)`):
  - "Ver" (siempre visible) → abre `RequisicionDetalleModal`.
  - "Editar" (requiere `requisiciones.edit`) → abre `RequisicionEditModal`.
  - "Checklist" (requiere `requisiciones.manage`) → abre `ProcesoRequisicionModal` (ver [04](./04-checklist-del-proceso.md)).

Los modales de detalle/edición se navegan como **sub-rutas** (`.../visualizacionDetalle`, `.../editRequisicion`), no como estado local puro: `onSelect`/`onEdit` en `RequisicionBoardWrapper` hacen `setState(row)` (guarda la fila en el contexto) y `navigate(...)` pasando también `location.state.requisicion` como respaldo. Si el usuario recarga la página estando en la sub-ruta y `location.state` se perdió, `selectedRow` cae al `state` del contexto; si tampoco hay nada ahí, un `useEffect` redirige de vuelta a `..` (evita mostrar un modal vacío).

## 3. `RequisicionDetalleModal` — vista de solo lectura + 2 acciones

Archivo: [`RequisicionDetalleModal.tsx`](../../src/Components/Requisiciones/tablaRequisiciones/RequisicionDetalleModal.tsx)

- Los campos que se muestran dependen del tipo de requisición: `getDetailSections(row)` en [`src/consts/requisicionesFields.ts`](../../src/consts/requisicionesFields.ts) devuelve secciones distintas para `Retail` (con Dominical, sin CVE/modalidad) vs. `Administrativa` (con modalidad de teletrabajo y CVE, sin Dominical). Los valores se formatean según `kind` (`date` → `spDateToDDMMYYYY`, `money` → `formatPesosEsCO`).
- **"Postergar ANS"**: abre un `ConfirmModal` genérico pidiendo nueva fecha límite + motivo. Al confirmar, llama `onPostergarANSBD` (que en `RequisicionBoardWrapper` es `onPostergarANS` del contexto → `useRequisicionActions.postergarANS`). Reglas de `validatePostergarANS`: exige motivo, exige fecha, exige que la requisición tenga `Id`, y **bloquea si `Estado === "Completada"`**.
- **"Reportar problema"**: un mini-formulario (motivo predefinido + texto libre máx. 200 palabras) que dispara `notifyInconveniente` — un correo al solicitante original, no una escritura en SharePoint. Es decir, "reportar problema" no cambia ningún campo de la requisición; solo notifica.

## 4. `RequisicionEditModal` — edición de campos

Archivo: [`RequisicionEditModal.tsx`](../../src/Components/Requisiciones/tablaRequisiciones/RequisicionEditModal.tsx)

Mantiene un `draft` local (`Partial<requisiciones>`) que **no se persiste hasta presionar "Guardar cambios"**. Los campos están agrupados en 4 secciones (Resumen, Responsables y fechas, Ubicación y estructura, Condiciones de vinculación); varios son de solo lectura (`disabled: true`: Id, NivelCargo, solicitante, profesional asignado, fechas, códigos de UN/CC/CO) porque se derivan automáticamente en otro lado del flujo, no se editan a mano.

Al guardar, `RequisicionBoardWrapper.onSaveEdit`:

1. Quita `Id` del payload (`const { Id: _ignoredId, ...changes } = toEdit`).
2. Llama `requisiciones.update(id, changes)` directamente contra el servicio (no pasa por `handleEdit` de `useRequisicionActions`, que es un flujo distinto — ver abajo).
3. Actualiza `state` en el contexto con la fila devuelta.

> Nota: existe también `handleEdit` en `useRequisicionActions.ts`, pensado para el flujo de **cierre** de la requisición (cuando se define `fechaIngreso`, calcula automáticamente si `cumpleANS` fue "Si"/"No" comparando `fechaLimite` vs `fechaIngreso`, y pasa `Estado` a `"Cerrado"`). Actualmente ningún componente de UI parece invocarlo directamente desde el tablero — es la pieza de lógica que representaría "cerrar/finalizar" una requisición cuando se cubre la vacante.

## 5. Cancelar una requisición

`cancelarRequisicion(r)` (definido en `useRequisicion.ts`, orquestando `actionsController.cancelarBD` + `listController.reloadAll`) exige que `state.motivoNoCumplimiento` (el campo de motivo en el borrador del formulario, **no** en la fila `r`) esté lleno; si lo está, marca `Estado: "Cancelado"`, `cumpleANS: "No Aplica"` y copia `r.motivoNoCumplimiento` en el registro. No hay un componente de UI localizado en este repo que dispare `cancelarRequisicion` directamente sobre una fila del tablero — revisa si el flujo de cancelación vive en otra vista o si es funcionalidad pendiente de exponer en la UI.
