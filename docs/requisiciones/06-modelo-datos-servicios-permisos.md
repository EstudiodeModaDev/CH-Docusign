# Modelo de datos, servicios y permisos

## 1. Servicios de Graph — dos niveles de Context

El módulo de Requisiciones **no** llama a Microsoft Graph directamente desde los hooks — pasa siempre por una capa de servicios (`*.service.ts`), inyectada a su vez por Context. Esto es un patrón distinto y anterior al `RequisicionesContext` de negocio (ver [01](./01-contexto-e-inyeccion.md)):

```
App.tsx
  └─ <GraphServicesProvider>              // graph/graphContext.tsx
       ├─ useCoreGraphServices()          // Maestro, DeptosYMunicipios, categorias, mail, salarios...
       ├─ useGestorServices()             // servicios de otros módulos (Contratos, Cesaciones, etc.)
       ├─ usePazSalvoServices()
       └─ useRequisicionesServices()      // requisiciones, pasosVacante, detalleRequisicion,
                                           // plantaIdeal, responsableZonas, responsablesNivel,
                                           // ansRequisicion, cargoCiudadAnalista, maestrosMotivos,
                                           // moverANS, zona
```

`buildGraphDomainServices(cfg, graph)` (en [`graph/graphDomains.ts`](../../src/graph/graphDomains.ts)) instancia **una sola vez** cada servicio (con `React.useMemo`), y los reparte en 4 sub-contexts según el dominio. Cada servicio de Requisiciones extiende `BaseSharePointListService<TModelo>` ([`Services/base.service.ts`](../../src/Services/base.service.ts)), que resuelve `siteId`/`listId` de SharePoint (con caché en `localStorage`) y expone `getAll`, `getByNextLink`, `get`, `create`, `update` genéricos sobre la Graph API v1.0 de listas de SharePoint. Cada subclase solo define el `listName`/hostname/site y un `toModel(item)` que mapea `item.fields` (crudo de Graph) al tipo de dominio (p. ej. `requisiciones`, `pasoRequisicion`).

## 2. Listas de SharePoint del módulo

Sitio: `estudiodemoda.sharepoint.com/sites/TransformacionDigital/IN/CH` (hardcodeado en cada servicio, salvo donde se indica).

| Lista SharePoint | Servicio | Modelo | Para qué |
|---|---|---|---|
| `Requisiciones - Requisiciones` | `RequisicionesService` | `requisiciones` | La entidad principal — una fila por vacante. |
| `Requisicion - Pasos` | `PasosVacantesService` | `pasoRequisicion` | Plantilla global del checklist del proceso. |
| `Requisicion - Detalles Requisicion` | `DetalleRequisicionService` | `detalleRequisicion` | Instancia del checklist por requisición (`IdRequisicion`). |
| `Requisiciones - Planta Ideal` | `PlantaIdealService` | `plantaIdeal` | Dotación objetivo por centro operativo y mes (campos `_x0031_`…`_x0031_2` = ene…dic). |
| `Requisiciones - Responsables Zonas` | `ResponsablesZonasService` | — | Analista responsable por zona geográfica (para Retail). |
| `Responsables - NivelCargo` | `ResponsablesNivelService` | — | Analista responsable por nivel de cargo (para Administrativa). |
| `General - Zonas` | `ZonasService` | — | Catálogo de zonas. |
| *(nombre configurable, `lists.ansRequisicion`)* | `AnsRequisicionService` | `ansRequisicion` | SLA en días hábiles por `NivelCargo` — consultada al crear la requisición. |
| *(nombre configurable, `lists.maestroMotivo`)* | `maestroMotivosService` | `MaestroMotivos` | Motivos + destinatarios de notificación (usado en la alerta de planta ideal). |
| *(nombre configurable, `lists.cargoCiudadAnalista`)* | `cargoCiudadAnalistaService` | `cargoCiudadAnalista` | — |
| *(nombre configurable, `lists.moverANS`)* | `MoverANSService` | `moverAns` | — |

Las listas marcadas "nombre configurable" toman su nombre real de `lists.*` en la configuración unificada (`graph/graphConfig.ts`), en vez de estar hardcodeadas en el servicio — permite apuntar a listas distintas por ambiente.

## 3. Fuente externa: API de contratos (no SharePoint)

[`Services/Requisiciones/VistaContratos.Service.ts`](../../src/Services/Requisiciones/VistaContratos.Service.ts) — `getContractsByCO(co)` NO usa Graph; llama directamente a una Azure Function propia (`api-ch-...azurewebsites.net/api/contracts/co/{co}?status=Activo`) autenticada con un token distinto (`getApiAccessToken` de `auth/msal.ts`). Se usa solo para la validación de "planta ideal" al crear una requisición Retail (ver [02](./02-creacion-de-requisicion.md#3-notificaciones-al-crear)): compara la dotación objetivo (SharePoint) contra los contratos activos reales (API externa) para decidir si alertar.

## 4. Modelo `requisiciones` (resumen de campos)

Archivo: [`models/Requisiciones/requisiciones.ts`](../../src/models/Requisiciones/requisiciones.ts)

- **Identidad / clasificación**: `Title` (cargo), `tipoRequisicion` (`"Administrativa"` \| `"Retail"`), `NivelCargo`, `motivo`, `nuevoPromocion`, `tipoConvocatoria`.
- **Estado del ciclo de vida**: `Estado` (`"Activo"` → `"Cerrado"`/`"Cancelado"`/lo que devuelva `calcularEstadoCierre`), `cumpleANS` (`"Pendiente"` → `"Si"`/`"No"`/`"No Aplica"`), `porceranje` (0-100, % de avance del checklist — nombre con typo mantenido tal cual está en SharePoint/el código), `notified` (evita reenviar la encuesta de satisfacción), `fechaCierre`.
- **Fechas**: `fechaInicioProceso`, `fechaLimite` (el ANS calculado), `fechaIngreso` (cuándo se cubrió realmente), `fechaTerna`.
- **Responsables**: `solicitante`/`correoSolicitante` (quien la pidió), `nombreProfesional`/`correoProfesional` (analista de RRHH asignado, ver [02](./02-creacion-de-requisicion.md#22-asignación-de-responsable-requisicionresponsibletses)).
- **Ubicación/estructura**: `Ciudad`, `direccion`, `codigoUnidadNegocio`/`descripcionUnidadNegocio`, `codigoCentroCosto`/`descripcionCentroCosto`.
- **Específicos de Retail**: `tienda`, `codigoCentroOperativo`, `Dominical`.
- **Específicos de Administrativa**: `modalidadTeletrabajo`, `perteneceCVE`/`grupoCVE`.
- **Condiciones**: `salarioBasico`, `comisiones`, `auxilioRodamiento`, `empresaContratista`, `genero`.
- **Motivo de excepción**: `motivoNoCumplimiento` (se usa tanto al cancelar como al postergar el ANS).

`RequisicionesErrors = Partial<Record<keyof requisiciones, string>>` — el tipo de errores de validación es literalmente "cualquier campo del modelo puede tener un mensaje de error", usado por `validate()` (ver [02](./02-creacion-de-requisicion.md#21-validación-requisicionvalidationts)).

## 5. Permisos (`requisiciones.*`)

El motor de permisos ([`Funcionalidades/Permisos.tsx`](../../src/Funcionalidades/Permisos.tsx)) carga, al iniciar sesión: (a) los grupos de Azure AD a los que pertenece el usuario (`getMyGroupIds`, vía Graph `/me/transitiveMemberOf`), y (b) una matriz de permisos en SharePoint (`GroupId` → `FeatureKey` → `Enabled`). Cruza ambas para armar un `Set<FeatureKey>`, expuesto como `engine.can(key)` / `engine.canAny(...keys)`.

Feature keys usadas en este módulo:

| Feature key | Efecto |
|---|---|
| `requisiciones.view` | Visibilidad del ítem "Ver requisiciones" en el sidebar (junto con `viewAll`, ver `anyOf` en `consts/sidebar.tsx`). |
| `requisiciones.viewAll` | Ver **todas** las requisiciones, no solo las propias (afecta el `$filter` real enviado a Graph, no solo la UI — ver [03](./03-listado-tablero-y-detalle.md#1-carga-de-filas--filtros-orden-y-paginación-por-nextlink)). También gatea la visibilidad del ítem "Métricas requisiciones". |
| `requisiciones.add` | Visibilidad de "Nueva requisición" en el sidebar. |
| `requisiciones.edit` | Habilita el botón "Editar" por fila en el tablero (abre `RequisicionEditModal`). |
| `requisiciones.manage` | Habilita el botón "Checklist" por fila en el tablero (abre `ProcesoRequisicionModal`). |

Sin el permiso adecuado, la sección del sidebar directamente no aparece (`SECTIONS.filter(...)` en `App.tsx`) — no es solo un botón deshabilitado.

## 6. Notificaciones por correo (resumen)

Todas van por Microsoft Graph (`mail.sendEmail`, servicio `MailService` en `useCoreGraphServices`), con `saveToSentItems: true`. Definidas en [`useRequisicionNotifications.ts`](../../src/Funcionalidades/Requisiciones/Requisicion/Hooks/useRequisicionNotifications.ts):

| Notificación | Disparador | Destinatario |
|---|---|---|
| `notifyAsignacion` | Al crear la requisición | Analista responsable (`correoProfesional`) |
| `notifcacionPlantaIdeal` | Al crear una requisición Retail, si la planta ideal ya está cubierta | Destinatarios configurados en `Requisiciones - Motivos` para ese `motivo` |
| `notifyInconveniente` | Botón "Reportar problema" en el detalle | Solicitante original (`correoSolicitante`) |
| `notifyEncuestaSatisfaccion` | Automático, al completarse el 100% del checklist (una sola vez, controlado por `notified`) | Solicitante original (`correoSolicitante`) |
