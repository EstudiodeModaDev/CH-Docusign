# Dashboard de métricas

Ruta: `/requisiciones/metricas` (con redirect desde `/requisicion/metricas`) · Wrapper: [`RequisicionesMetricasWrapper.tsx`](../../src/Routes/Wrapper/RequisicionesMetricasWrapper.tsx) · Layout: [`RequisicionesMetricasLayout.tsx`](../../src/Components/Requisiciones/Metricas/RequisicionesMetricasLayout.tsx) · Cálculo: [`requisicionesMetrics.ts`](../../src/Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics.ts)

Requiere el permiso `requisiciones.viewAll` para aparecer en el sidebar (ver [06](./06-modelo-datos-servicios-permisos.md)).

## 1. De dónde salen los datos (todo se trae en el cliente)

A diferencia del tablero (que pagina server-side), el wrapper de métricas **trae todas las filas** que apliquen al filtro de seguridad, recorriendo `nextLink` en un `while` hasta agotarlo (`top: 500` por página), más **todos** los `detalleRequisicion` (`top: 5000`) y **todas** las plantillas de pasos activas. Con eso arma tres colecciones en memoria (`metricsRows`, `detailsRows`/`detailsByRequisicion`, `templateRows`/`templatesById`) y se las pasa a `useRequisicionesMetrics(...)`, que es un `useMemo` puro — no vuelve a pegarle a la red al cambiar de pestaña o de agrupación.

`requisicionesController.buildFilter()` (del `RequisicionesContext`, reutilizado aquí) define el filtro base — es el mismo filtro de seguridad por permisos del tablero (usuario ve solo lo suyo salvo que tenga `viewAll`), más lo que el usuario configure en `cargo`/`ciudad`/`analista` desde los filtros del dashboard. **`direccion` es un filtro que vive aparte**, como `useState` local en `RequisicionesMetricasWrapper` (no en el contexto), y se aplica después, en el cliente, sobre `metricsRows` ya cargadas (`dashboardRows`).

## 2. Cómo se calculan las métricas (`requisicionesMetrics.ts`)

Todo el archivo es funciones puras sobre arrays — no hay llamadas a red aquí. Definiciones clave:

- **`isOpenRequisition`**: `Estado` distinto de `cerrado`/`cancelado`.
- **`isCumpleAns`**: `cumpleANS` en {`si`, `sí`, `cumple`, `ok`, `true`, `1`} (normalizado, minúsculas).
- **`isExpiredAns` / `isRiskAns`**: solo aplican a requisiciones abiertas. Vencida = `fechaLimite` ya pasó. En riesgo = `fechaLimite` está a **3 días o menos** (y no vencida).
- **`getClosingDays`**: `fechaIngreso - fechaInicioProceso` en días (null si falta alguna fecha o si el resultado es negativo).

### Resumen (KPIs superiores)

`vacantesAbiertas`, `diasPromedioCierre` (promedio de `getClosingDays` sobre las que sí cerraron), `enRiesgoAns`, `vencidasAns`, `cumplimientoAnsPct` (% de filas con `isCumpleAns`, sobre el total filtrado — **no** solo sobre las cerradas).

### Embudo de selección

Suma `Number(detalle.Notas)` de los pasos `Completado`/`Omitido` cuyo `Id` de plantilla es `"3"` (recibidas), `"5"` (entrevistas), `"7"` (finalistas), `"4"` (seleccionadas) — ver [04-checklist-del-proceso.md#6-relación-con-métricas](./04-checklist-del-proceso.md#6-relación-con-métricas) para el porqué de estos IDs "mágicos" y su fragilidad si cambia la plantilla.

### Tendencia mensual

Agrupa por mes calendario de `fechaInicioProceso` (índice 0-11, sin distinguir año — si hay datos de varios años se mezclan en el mismo bucket de mes).

### Agrupaciones (por dirección / ciudad / analista)

`buildGroupedMetrics` agrupa por el campo crudo (sin normalizar mayúsculas/tildes: valores distintos en texto = grupos distintos), calcula `cumplimientoPct`, `vacantesAbiertas`, `tiempoPromedioCierre` por grupo, y asigna un semáforo (`getTone`):

- **`risk`**: alguna fila del grupo está vencida, o `cumplimientoPct <= 59`.
- **`warn`**: alguna fila está en riesgo, o `cumplimientoPct <= 79`.
- **`good`**: el resto.

### Watchlist

Todas las requisiciones **abiertas** con tono `risk` o `warn` (vencidas o a ≤3 días), ordenadas por `diasRestantes` ascendente (las más urgentes primero).

## 3. Layout y navegación (3 pestañas)

`RequisicionesMetricasLayout` arma un `RequisicionesMetricasDataContext` local — **otro Context**, más chico, que solo transporta `{ loading, error, rowsCount, metrics }` (ver tabla comparativa en [01](./01-contexto-e-inyeccion.md#7-el-mismo-patrón-se-repite-en-otras-partes-de-la-app)) — para que las 3 pestañas (rutas hijas via `<Outlet/>`) no dependan de recibir props manualmente:

| Pestaña | Ruta | Componente | Contenido |
|---|---|---|---|
| Resumen | `/requisiciones/metricas/resumen` | `MetricasResumenPage` | Medidor de cumplimiento ANS (`AnsMeterChart`), embudo (`EmbudoChart`), distribución por estado (`DistribucionEstadoChart`), requisiciones por analista (`RequisicionesPorAnalistaChart`, top 6: cantidad como texto + barra de % cumplimiento coloreada por semáforo, ambos siempre visibles sin depender de hover; "+N adicionales"), y `WatchlistCard` (hasta 8 vacantes urgentes, con contador de "+N adicionales"). |
| Tendencias | `/requisiciones/metricas/tendencias` | `MetricasTendenciasPage` | Barras de requisiciones iniciadas por mes (`TendenciaBarChart`) y línea de % cumplimiento ANS por mes contra una meta del 80% (`TendenciaLineChart`). |
| Detalle por grupo | `/requisiciones/metricas/detalle` | `MetricasDetallePorGrupoPage` → `RequisicionesTableroFooter` | Tabla con tabs internos (Dirección/Ciudad/Analista) mostrando % cumplimiento (barra de progreso con color de semáforo), vacantes abiertas, tiempo promedio de cierre. |

Encima de las 3 pestañas siempre se muestran los 4 mini-KPIs (`RequisicionTableroKPIGenerico`): vacantes abiertas, días promedio de cierre, en riesgo, vencidas.

## 4. Filtros del dashboard

`MetricasFilters` (`RequisicionesTableroFilters.tsx`) expone: cargo, ciudad, analista, dirección, y año (`yearOptions`, calculado sobre las filas ya cargadas). Cargo/ciudad/analista viven en el `RequisicionesContext` (comparten estado con `buildFilter`, aunque **no** con el tablero — recordar que `/requisiciones/*` monta su propia instancia del Provider, ver [gotcha en 01](./01-contexto-e-inyeccion.md#gotcha-dos-instancias-del-provider)); dirección y año son estado local del wrapper, aplicados sobre los datos ya traídos.

## 5. Estilo y gráficos

`chartSetup.ts` registra los componentes de Chart.js una sola vez (se importa por su efecto secundario al inicio de `RequisicionesMetricasLayout.tsx`). `rqmChartTheme.ts` centraliza colores/tipografía para que todos los charts del módulo luzcan consistentes. Los charts individuales están en `Components/Requisiciones/Metricas/Charts/*`.
