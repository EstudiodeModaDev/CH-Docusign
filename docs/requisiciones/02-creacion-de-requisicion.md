# Creación de una requisición (wizard)

Ruta: `/requisicion/new` · Wrapper: [`src/Routes/Wrapper/newRequisicion.tsx`](../../src/Routes/Wrapper/newRequisicion.tsx) · UI: [`src/Components/Requisiciones/NuevaRequisicion/NuevaRequisicion.tsx`](../../src/Components/Requisiciones/NuevaRequisicion/NuevaRequisicion.tsx)

## 1. El wizard de 2 pasos

`WizardRequisicion3Pasos` (el nombre quedó de una versión anterior de 3 pasos; hoy son 2) recibe del contexto (vía `NewRequisicionWrapper`): `state`, `setField`, `handleSubmit`, `notifyAsignacion`, `sendNotificationPlantaIdeal`, `cleanState`, `reloadAll`.

- **Paso 1 — `FirstStepForm`**: cargo (`Title`) y ciudad (`Ciudad`). Al elegir el cargo (`handleCargoChange`):
  - Busca la categoría del cargo en `categorias` (lista `CategoriaCargos`) y la guarda en `NivelCargo` — este campo determina el ANS y el responsable asignado más adelante.
  - Si el cargo está en una lista fija de cargos de tienda (`cargosRetail`: administrador de almacenes, administrador de sales smart, asesor comercial, auxiliar de centro de distribución, coadministrador), marca `tipoRequisicion = "Retail"` y autocompleta `salarioBasico` desde el servicio de salarios (`useSalarios`). En cualquier otro caso, `tipoRequisicion = "Administrativa"`.
- **Paso 2 — `Step2Form`**: el resto de campos operativos, distintos según `tipoRequisicion` (Retail: centro operativo/tienda, dominical; Administrativa: dirección, modalidad de teletrabajo, CVE).

Al presionar "Crear requisición" (`handleSubmitRequest`):

1. Valida que el cargo tenga `NivelCargo` configurado (si no, corta con un `notify`).
2. Busca en la lista `Requisiciones - ANS` (servicio `ansRequisicion`) la fila cuyo `NivelCargo` coincide, y toma `diasHabiles0` — ese es el SLA en días hábiles para ese nivel de cargo.
3. Llama `handleSubmit(ans)` (viene del contexto → `useRequisicionesActions`).
4. Si se creó con éxito, envía el correo de asignación (`notifyAsignacion`) y, si es `Retail`, además dispara la alerta de planta ideal (`sendNotificationPlantaIdeal`).
5. Cierra el wizard (`onClose`), que en `NewRequisicionWrapper` hace `reloadAll(); cleanState(); navigate("/requisicion/view")`.

## 2. Qué hace `handleSubmit` (validación → responsable → payload → creación)

Archivo: [`useRequisicionActions.ts`](../../src/Funcionalidades/Requisiciones/Requisicion/Hooks/useRequisicionActions.ts)

```
validateResult()               // valida el borrador completo (ver requisicionValidation.ts)
  → categorias.getAll(...)     // trae la categoría del cargo otra vez (para el payload final)
  → chooseFinalResponsible(...)// decide quién queda como analista/profesional responsable
  → createRequisicionPayload() // arma el objeto final: calcula fechaInicio/fechaLimite (ANS) y responsable
  → requisiciones.create(payload)
  → createDetallesPasosRequisicion(id)  // instancia el checklist (ver 04-checklist-del-proceso.md)
```

### 2.1 Validación (`requisicionValidation.ts`)

`validate(state)` es un conjunto de reglas obligatorias comunes (tipo, cargo, ciudad, convocatoria, centro de costo, unidad de negocio, género, motivo, salario) más reglas condicionales:

- Si `tipoRequisicion === "Retail"`: exige `descripcionCentroCosto` (marca) y `tienda`.
- Si `tipoRequisicion === "Administrativa"`: exige `direccion`, `modalidadTeletrabajo`, `descripcionCentroCosto` (área), y si `perteneceCVE === "Si"` también exige `grupoCVE`.

### 2.2 Asignación de responsable (`requisicionResponsible.ts`)

`chooseFinalResponsible(...)` decide el analista de RRHH que queda como dueño de la requisición, con reglas distintas por tipo:

- **Retail** → `chooseByZona`: busca la ciudad en `DeptosYMunicipios` para obtener su `Zona`, y busca en `Requisiciones - Responsables Zonas` quién es responsable de esa zona.
- **Administrativa** → `chooseByNivelCargo` + balanceo de carga:
  1. Busca en `Responsables - NivelCargo` el responsable "preferido" para ese `NivelCargo`.
  2. `chooseLeastLoadedResponsible`: cuenta cuántas requisiciones **Activas** tiene asignadas ese responsable preferido (`correoProfesional` + `Estado eq 'Activo'`). Si tiene **menos de 10**, se queda con él.
  3. Si tiene 10 o más, calcula la carga de **todos** los responsables con al menos una requisición activa y reasigna al que tenga menos carga (desempate alfabético). Esto es un balanceo de carga simple, sin persistencia de "a quién le tocaba" — se recalcula cada vez.

### 2.3 Cálculo del ANS (SLA) — `RequisicionPayload.ts` + `utils/ansRequisicion.ts`

El ANS no es una fecha fija; se calcula en días **hábiles** de Colombia (festivos vía `festivos-colombianos`, zona horaria `America/Bogota`, jornada 7am–5pm):

1. `fetchHolidays()` trae los festivos del año.
2. `startDateByCutoff(now, holidays, cutHour=12)`: si la requisición se crea antes de las 12pm de un día hábil, la fecha de inicio del proceso es **hoy**; si se crea después de las 12pm, o es fin de semana/festivo, la fecha de inicio salta al **siguiente día hábil** a las 7am.
3. `calcularFechaSolucionRequisicion(fechaInicio, ans, holidays)`: suma `ans` días hábiles (en minutos de jornada laboral, saltando fines de semana y festivos) para obtener `fechaLimite`.

Ambas fechas (`fechaInicioProceso`, `fechaLimite`) quedan en el payload final que se guarda en SharePoint.

### 2.4 Creación de la instancia del checklist

Justo después de crear la requisición, `createDetallesPasosRequisicion(requisicionId)` trae **todos los pasos activos** de la plantilla (`Requisicion - Pasos`, `fields/Activo eq 1`, ordenados por `OrdenPaso`) y crea, por cada uno, una fila en `Requisicion - Detalles Requisicion` con `Estado: "Pendiente"` — esa es la instancia concreta del checklist para esta requisición específica (ver [04-checklist-del-proceso.md](./04-checklist-del-proceso.md)).

## 3. Notificaciones al crear

Archivo: [`useRequisicionNotifications.ts`](../../src/Funcionalidades/Requisiciones/Requisicion/Hooks/useRequisicionNotifications.ts) — todas envían HTML por Microsoft Graph (`mail.sendEmail`).

- `notifyAsignacion(created)`: al analista responsable (`correoProfesional`). Si `motivo === "Apertura de tienda"` usa una plantilla de texto simple orientada a apertura de tienda; en cualquier otro caso, una tarjeta HTML con cargo, ciudad, fechas, área/marca y jefatura.
- `sendNotificationPlantaIdeal(co, motivo)` (solo Retail, en `useRequisicionActions.ts`): compara la **planta ideal** configurada para ese centro operativo/mes (`lookPlantaIdeal`, lista `Requisiciones - Planta Ideal`) contra los contratos activos actuales en ese CO (`getContractsByCO`). Si la planta ideal ya está cubierta o superada, dispara `notifcacionPlantaIdeal` — una alerta a los destinatarios configurados para ese motivo en `Requisiciones - Motivos`.
- `notifyEncuestaSatisfaccion` / `notifyInconveniente`: se usan más adelante en el ciclo de vida (ver [03](./03-listado-tablero-y-detalle.md)), no en la creación.

## 4. Estado inicial del formulario

`cleanStateRequisicion(account)` (en `utils/requisicionState.ts`) define el borrador vacío con el que arranca el wizard: precompleta `correoSolicitante`/`solicitante` con la sesión actual (MSAL), `fechaInicioProceso` con hoy, `cumpleANS: "Pendiente"` y `Estado: "Activo"`. Se vuelve a llamar (`cleanState()`) después de crear con éxito, para dejar el formulario listo para la siguiente requisición.
