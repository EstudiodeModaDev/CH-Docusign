# Gestor Digital Capital Humano — Documento de diseño para el refactor

> Este documento describe **qué hace** la aplicación, módulo por módulo, y **cómo debe quedar** después del refactor.
> No describe la apariencia actual: la identidad visual se define aparte, con un sistema de diseño nuevo.

---

## 1. Propósito y alcance

El **Gestor Digital Capital Humano** es una SPA interna de Capital Humano. Con ella el equipo:

- registra y da seguimiento a las novedades de personal: contrataciones, cesaciones, promociones, retail y habeas data;
- envía documentos a firma por DocuSign, uno a uno o de forma masiva;
- consulta y administra los expedientes digitales de los colaboradores;
- gestiona paz y salvos de empleados retirados;
- gestiona requisiciones (vacantes) con ANS y métricas;
- administra parámetros, catálogos y permisos.

**Stack actual (se mantiene):** React 19 + TypeScript + Vite y React Router 7. La autenticación es con MSAL (Azure AD). Los datos viven en listas y bibliotecas de SharePoint, a las que se accede por Microsoft Graph. La firma electrónica usa la API REST de DocuSign. Algunos flujos usan Power Automate. Se usan Chart.js para gráficas, SheetJS/ExcelJS para Excel y Sonner para notificaciones.

**Alcance del refactor:**
1. Rediseñar la interfaz completa con un sistema de diseño propio.
2. Unificar patrones: tablas, formularios, modales, estados de carga y error.
3. Consolidar la capa de datos y de permisos.
4. Corregir los defectos funcionales conocidos (sección 8).

---

## 2. Principios de diseño de la nueva interfaz

### 2.1 Modo claro y oscuro (obligatorio)
- La aplicación debe tener **modo claro y modo oscuro** completos. Ninguna pantalla, modal, gráfica, tabla ni componente de terceros (selects, editores de texto enriquecido, toasts) puede quedar sin soportar alguno de los dos.
- **Modo inicial:** el que indique la preferencia del sistema operativo (`prefers-color-scheme`).
- **Selector:** el usuario puede elegir **Claro / Oscuro / Sistema** desde el encabezado.
- **Persistencia:** la elección se guarda en el navegador y se aplica **antes del primer render**, para que no haya parpadeo. Hoy el tema no se relee al recargar; hay que corregirlo.
- **Tokens semánticos:** todo valor visual se define como token (superficie, texto, borde, estado de éxito, advertencia, error, información, foco…). Ningún componente usa valores fijos.
- **Gráficas:** el tema de Chart.js se deriva de los mismos tokens y se actualiza al cambiar de modo, sin recargar la página.
- **Contenido HTML embebido** (respuestas de paz y salvo, plantillas de correo): debe verse legible en ambos modos.

### 2.2 Responsive (obligatorio)
- **Mobile-first** con tres rangos de referencia:
  - móvil: < 640 px
  - tablet: 640–1024 px
  - escritorio: > 1024 px
- **Navegación lateral:**
  - escritorio: fija y colapsable;
  - tablet: colapsada por defecto;
  - móvil: drawer que se abre desde el encabezado.
- **Tablas:**
  - en escritorio: columnas fijas, ordenamiento y paginación;
  - en móvil: cada fila pasa a ser una **tarjeta** con los campos clave y las acciones en un menú contextual;
  - nunca debe haber scroll horizontal de página. Solo se permite scroll horizontal controlado dentro del contenedor de la tabla, si hace falta.
- **Formularios:**
  - en escritorio: rejilla de 2 a 3 columnas;
  - en móvil: una sola columna;
  - las secciones largas se agrupan en pasos o acordeones.
- **Modales:** en móvil se muestran a pantalla completa (sheet), con acciones fijas abajo.
- **Accesibilidad táctil:** áreas táctiles de al menos 44 px.

### 2.3 Moderno y consistente
- **Sistema de componentes único:** botones, inputs, selects con búsqueda, date pickers, chips, badges de estado, tablas, tarjetas KPI, tabs, stepper, modales, drawers, toasts, skeletons y estados vacíos.
- **Retroalimentación inmediata:** skeletons durante la carga y estados vacíos con una acción sugerida. Los botones muestran carga en acciones asíncronas y se deshabilitan para evitar doble envío.
- **Confirmaciones y errores:**
  - se usa un modal propio; nunca `window.confirm` ni `alert`;
  - los errores se muestran en lenguaje claro, no como texto crudo de Graph.
- **Accesibilidad (WCAG 2.1 AA):**
  - foco visible;
  - navegación completa por teclado;
  - `aria-*` en componentes interactivos;
  - contraste validado en ambos modos;
  - etiquetas en todos los campos.
- **Microinteracciones:** sutiles; se respeta `prefers-reduced-motion`.
- **Iconografía:** una sola librería de iconos (no SVG en línea repetido por pantalla).
- **Idioma y formatos:** textos en español; fechas `es-CO`, zona `America/Bogota`; moneda COP.

---

## 3. Arquitectura

### 3.1 Árbol de providers (objetivo)
```
BrowserRouter
└── ThemeProvider              (claro/oscuro/sistema)
    └── AuthProvider           (MSAL — una sola instancia; hoy está duplicado)
        └── GraphServicesProvider  (solo con sesión)
            └── PermissionsProvider (matriz de permisos)
                └── AppShell (Sidebar + Header + <Outlet/>)
                    └── Rutas por módulo (lazy-loaded)
        └── Toaster
```

### 3.2 Capa de datos
- **Servicio base:** todos los servicios de listas SharePoint deben extender `BaseSharePointListService`.
  - El servicio base resuelve `siteId` y `listId` y los guarda en caché.
  - Ofrece `create`, `update`, `delete`, `get`, `getAll` paginado por `@odata.nextLink`, y `toModel`.
  - Hoy más de 30 servicios duplican este código y devuelven formatos distintos: arrays planos o `{items, nextLink}`.
- **`graphConfig.ts`:** mapea sitios y nombres de listas. Se mantiene como única fuente de esa configuración.
- **`GraphRest`:** cliente genérico. Los helpers de correo, grupos, usuarios, archivos y Excel se separan por dominio.
- **Configuración por entorno (`.env`):** clientId de MSAL, URIs de redirección, GUIDs de grupos, URLs de Power Automate, enlaces de Excel de encuestas, cuenta de DocuSign y buzones de notificación. Nada de esto debe quedar escrito en el código.
- **Caché y sincronización:** se recomienda una capa de caché de consultas (por ejemplo TanStack Query). Así se evita re-pedir datos, se invalida tras cada mutación y se eliminan las peticiones N+1: hoy se hace una petición por fila para el porcentaje de avance y otra por cada solicitud para la cédula.

### 3.3 Permisos
- **Origen:**
  - grupos de Entra ID del usuario: `transitiveMemberOf` + `checkMemberGroups`;
  - lista **"Permisos - Matriz Funcionamiento"** (filas `GroupId × FeatureKey × Enabled`).
- **Motor:** expone `can`, `canAny`, `canAll` y `canModule`.
- **Rutas protegidas:** cada ruta debe declarar su permiso y validarlo. Hoy solo se filtra el menú y se redirige a la primera ruta permitida; las pantallas no vuelven a validar.
- **Un solo mecanismo:** hay que unificar las autorizaciones paralelas en la matriz de permisos. Hoy existen:
  - la lista "Permisos PazSalvos" (paz y salvo);
  - el grupo "Gerencia" (aprobar ediciones);
  - el `roles.ts` heredado, sin uso.
- **Errata `acess.view`:** hay que corregirla a `access.view`, con migración de datos. Hoy esa misma clave controla también "Aprobar Ediciones", que debería tener su propia clave.

**Catálogo de `FeatureKey`:**

| Módulo | Claves |
|---|---|
| Contrataciones | `contrataciones.view/add/edit/inactivate/delete` |
| Cesaciones | `cesaciones.view/add/edit/inactivate/delete` |
| Promociones | `promociones.view/add/edit/inactivate/delete` |
| Retail | `retail.view/add/edit/inactivate/delete` |
| Habeas Data | `habeas.view/add/edit/delete` |
| Documentos | `documents.send/view/explore/retirement/check/approve/delete/add/edit` |
| Parámetros | `parametros.edit` |
| Paz y salvos | `paz.send/view/viewAll` |
| Reportes | `reports.view` |
| Requisiciones | `requisiciones.view/viewAll/add/edit/manage` |
| Accesos | `acess.view` |

---

## 4. Shell de la aplicación

### 4.1 Pantalla de bienvenida / login
- Se muestra cuando no hay sesión, con el nombre del producto y un botón **"Iniciar sesión"**.
- El inicio de sesión abre el popup de MSAL; si el popup falla, se usa redirect.
- Mientras se autentica, el botón muestra estado de carga.

### 4.2 Layout autenticado
- **Sidebar:**
  - muestra solo las secciones que el usuario puede ver según sus permisos;
  - resalta la sección activa;
  - se puede colapsar;
  - en móvil se muestra como drawer (ver 2.2).
- **Header:**
  - título del producto;
  - foto y nombre del usuario (foto de Graph `/me/photo`, con iniciales si no hay foto);
  - selector de tema;
  - botón **Conectar / Desconectar DocuSign**, con indicador de estado: conectado, expirado o desconectado;
  - **Salir**: cierra la sesión con MSAL a través del `AuthProvider`.
- **Estados globales:**
  - "Cargando permisos…": se muestra como skeleton del layout;
  - "No tienes permisos para ver módulos": estado vacío con contacto de soporte.

### 4.3 Secciones del menú

| Sección | Ruta | Permiso |
|---|---|---|
| Registrar Nuevo Ingreso | `/gd/register` | cualquiera de `*.view` de los 5 procesos |
| Aprobar Ediciones | `/gd/request` | `acess.view` |
| Enviar Documento | `/gd/send/one` | `documents.send` |
| Enviar Documentos Masivos | `/gd/send/masive` | `documents.send` |
| Consultar Documentos | `/gd/send/look` | `documents.view` |
| Generar Reportes | `/gd/reports` | `reports.view` |
| Parámetros | `/settings/*` | `parametros.edit` |
| Accesos | `/access` | `acess.view` |
| Explorador de documentos | `/gd/documents/view` | `documents.explore` |
| Paz y salvos | `/paz` | `paz.send` / `paz.view` / `paz.viewAll` |
| Ver requisiciones | `/requisicion/view` | `requisiciones.view` / `viewAll` |
| Nueva requisición | `/requisicion/new` | `requisiciones.add` |
| Métricas requisiciones | `/requisiciones/metricas/*` | `requisiciones.viewAll` |

**Propuesta:** agrupar el menú por dominio:
- **Novedades de personal:** Registrar, Aprobar.
- **Firma electrónica:** Enviar, Masivo, Consultar.
- **Expedientes:** Explorador, Paz y salvos.
- **Requisiciones:** Ver, Nueva, Métricas.
- **Analítica:** Reportes.
- **Administración:** Parámetros, Accesos.

Los grupos se muestran como encabezados colapsables.

---

## 5. Módulos

### 5.1 Registrar Nuevo Ingreso (`/gd/register`)

**Propósito:** registrar y dar seguimiento a cinco tipos de proceso de personal. Cada uno tiene su lista de SharePoint y, salvo Habeas, un checklist de pasos.

| Subproceso | Lista SharePoint | Checklist | Estado final |
|---|---|---|---|
| Contrataciones | Novedades - Novedades Administrativas | Novedades - Pasos / Detalles Pasos | `Finalizado` |
| Cesaciones | Cesasion - Cesaciones | Cesacion - Pasos / Detalles Pasos | `Completado` |
| Promociones | Promocion - Promociones | Promocion - Pasos / Detalles Pasos | `Completado` |
| Retail | Retail - Novedades Retail | Retail - Pasos / DetallesPasos | `Completado` |
| Habeas Data | Habeas Data | — | — |

> **Refactor:** unificar el estado final en un solo valor (`Finalizado`) y los filtros que dependen de él.

#### Pantalla principal
- **Selector de subproceso:** se propone tabs o segmented control en lugar del `<select>` actual. Solo muestra los subprocesos con permiso `*.view`.
- **Botón "Nuevo registro":** visible con `*.add`.
- **Filtros:**
  - búsqueda (nombre, cédula, cargo), con debounce;
  - estado: En proceso / Finalizados / Cancelados / Todos;
  - rango de fechas desde/hasta;
  - Habeas solo tiene búsqueda y fechas.
- **Tabla:**
  - columnas: datos del colaborador, cargo, empresa, fecha, **% de avance del checklist** y acciones;
  - ordenamiento multi-columna;
  - paginación de 10 a 100 registros;
  - con el filtro "Cancelados" aparecen las columnas *Razón de cancelación* y *Cancelado por*.
- **Acciones por fila:**
  - registrar la **fecha de exámenes médicos** (modal con fecha obligatoria; no aplica a Habeas);
  - **eliminar** (con `*.delete` y confirmación).
- **Clic en una fila:** abre el formulario en modo edición o en modo solicitud (ver "Modo edición vs. modo solicitud").

> **Refactor:** paginación y búsqueda en servidor (hoy se traen hasta 2000 registros y se filtra en cliente). El % de avance se calcula en una sola consulta agregada.

#### Flujo de creación
1. **Cédula:** el usuario la escribe. Al salir del campo se busca el registro más reciente de esa cédula en los cinco procesos y se autocompletan nombre, tipo de documento, empresa, correo, departamento, ciudad, celular, dirección y barrio. Hoy se descarta el resultado de Retail; hay que corregirlo.
2. **Cargo:** al elegirlo se propone el **nivel de cargo** (lista *Cargos - CategoriaCargos*) y el **salario recomendado** (*Cargos - Salarios Recomendados*). El salario se convierte a **letras**.
3. **Auxilio:** si el salario es ≤ 2 SMMLV, se aplica auxilio de transporte; si no, auxilio de conectividad. Los valores salen de la lista *Configuraciones* (SMMLV, auxilio de transporte). El auxilio de conectividad también debe ser configurable.
4. **Grupo CVE** (si pertenece al modelo):
   - promedio ponderado = Autonomía 20 % + Impacto 20 % + Contribución 30 % + Presupuesto 30 %;
   - grupo según el promedio: 1 Constructores, 2 Desarrolladores, 3 Imaginarios, 4 Soñadores.
5. **Garantizado:** el porcentaje se convierte a valor y a texto en letras.
6. **Guardar:**
   1. se valida el formulario;
   2. se crea el registro con `Estado = "En proceso"`;
   3. se instancian los pasos activos del checklist, filtrados por reglas de cargo (ver "Motor de checklist");
   4. se envía un correo de aviso al equipo de CH, a buzones configurables.

**Campos por subproceso:**
- **Contrataciones** (el más extenso; conviene presentarlo como un **stepper por secciones**):
  - **Identificación:** tipo de documento, número, nombre, correo, empresa, fecha de ingreso.
  - **Cargo y compensación:** cargo, nivel, salario y salario en letras, ajuste salarial, garantizado, auxilios, auxilio de rodamiento.
  - **Aprendiz / practicante:** universidad, NIT, coordinador, programa, etapa, fecha de nacimiento, fechas lectiva y productiva, ciudad de expedición.
  - **Ubicación:** departamento, ciudad, modalidad de teletrabajo.
  - **Estructura:** dependencia, centro de costos, centro operativo y unidad de negocio (cada uno con código y descripción), especificidad, cargo crítico.
  - **Información adicional:** celular, dirección, barrio, personas a cargo, origen de selección, tipo de contrato, día dominical, tipo de vacante, herramientas, fechas de ajuste académico y valoración de potencial, modelo CVE, nuevo equipo, fecha de reporte, "Información enviada por".
- **Cesaciones:** identificación, empresa, contacto, fechas de ingreso, salida y límite de documentos, cargo, nivel, salario, dependencia, ubicación, temporal, CC, CO, UN, día dominical, reportado por.
- **Promociones:** similar a Contrataciones, más *nuevo cargo*, *nuevo salario*, tipo de nómina y fecha requerida.
- **Retail:** similar a Cesaciones, más origen de selección.
- **Habeas Data:** empresa, nombre, tipo y número de documento, correo, ubicación, fecha de reporte, enviado por. Sin checklist ni estados.

#### Pie del formulario (común)
- **Guardar** o **Enviar solicitud de edición**, según el modo. Se deshabilita si el proceso está cancelado o si falta el permiso `*.edit`.
- **Ver detalles / checklist** (solo en modo edición).
- **Cancelar proceso** (con `*.inactivate` y razón obligatoria) o **Reactivar proceso** (vuelve a `En proceso`).

#### Modo edición vs. modo solicitud
- Al abrir un registro existente se consulta la lista **Envios** para saber si ya se envió un documento a firma (`ID_Novedad` + `Fuente`):
  - **sin envío:** edición directa (PATCH al registro);
  - **con envío:** los cambios generan una **solicitud de edición** que pasa por aprobación (5.2).
- En la UI hay que indicarlo con claridad, por ejemplo con un banner: *"Este registro ya tiene documentos enviados a firma. Tus cambios se enviarán a aprobación."*

#### Motor de checklist (compartido por Contrataciones, Cesaciones, Promociones y Retail)
- **Plantilla** (`* - Pasos`):
  - campos: nombre, orden, tipo (`Aprobacion`, `Notificacion` o `SubidaDocumento`), si es obligatorio, si está activado;
  - según el tipo: nombre de la evidencia y tipos de archivo aceptados (subida), o plantilla de asunto y de correo (notificación).
- **Instancia por registro** (`* - Detalles Pasos`):
  - un detalle por paso aplicable, con estado `Pendiente`, `Completado` u `Omitido`;
  - registra quién lo completó, cuándo, y una nota.
- **Reglas de activación por cargo** (lista *PasoRestriccionProceso*):
  - sin reglas, el paso aplica;
  - con reglas `INCLUIR`, aplica solo a los cargos listados;
  - con reglas `EXCLUIR`, aplica a todos menos los listados;
  - no se permite mezclar ambos tipos en un mismo paso.
- **Ejecución:**
  - los pasos se muestran **en secuencia**: el siguiente se desbloquea al completar u omitir el anterior;
  - "Omitir" solo aparece en pasos no obligatorios;
  - un paso resuelto no se reabre.
- **Comportamiento por tipo:**
  - **Aprobación:** Aceptado o Rechazado; el motivo es obligatorio al rechazar. Hoy un rechazo no detiene el proceso; hay que **decidir con negocio** si debe detenerlo.
  - **Notificación:**
    - destinatario (por defecto, el colaborador), asunto y cuerpo prellenados desde la plantilla, con variables `{nombre}`, `{numeroDoc}`, `{empresa}`, `{cargo}`, `{fecha_ingreso}` y `{tipo_trabajo}`;
    - permite adjuntos;
    - se envía con Graph.
  - **Subida de documento:**
    - se sube el archivo al expediente del colaborador, en la biblioteca de la empresa (`Colaboradores Activos/{doc} - {nombre}`), con el nombre `{doc} - {evidencia}`;
    - si el nombre ya existe, se agrega un sufijo incremental.
- **Cierre:** al llegar al 100 % el registro pasa a su estado final.

**Diseño sugerido:** un drawer lateral (o una página de detalle) con un *stepper* vertical. Muestra el paso actual expandido, los pasos completados colapsados con su autor y fecha, y una barra de progreso.

---

### 5.2 Aprobar Ediciones (`/gd/request`)

**Propósito:** revisar y aprobar o rechazar los cambios solicitados sobre registros que ya tienen documentos enviados a firma.

**Datos:**
- **Actualizacion - Solicitud Cambio:** módulo, IdRegistro, estado (`Pendiente → Aprobada | Rechazada`), solicitante, fecha, razón, aprobador, fecha de aprobación, comentario.
- **Actualizacion - DetalleSolicitud:** un registro por campo cambiado: nombre interno, etiqueta, valor anterior, valor nuevo, tipo de dato.

**Flujo de creación** (desde el formulario en modo solicitud):
1. Se calcula la diferencia campo a campo entre el formulario y el registro actual.
2. Se crea la solicitud en estado `Pendiente`, con su **razón**. Hoy la UI no tiene campo de razón y la validación nunca se cumple; hay que agregarla.
3. Se crea un detalle por cada campo modificado.
4. Se notifica por correo a los aprobadores.

**Pantalla:**
- **Filtros:** búsqueda (módulo, registro, solicitante) y estado (Pendiente por defecto, Aprobada, Rechazada, Todos).
- **Tabla:** estado, proceso, registro (cédula), solicitante, fecha, aprobador, "Ver detalle". Hay que agregar paginación.
- **Detalle:**
  - datos de la solicitud y tabla **Campo / Valor actual / Valor nuevo**, que se recomienda mostrar como *diff* visual;
  - campo de comentario;
  - botones **Aprobar** (comentario obligatorio) y **Rechazar**, visibles solo si la solicitud está pendiente.

**Aprobar:**
1. Se verifica que la solicitud siga pendiente.
2. Se verifica que el usuario sea aprobador. Hoy la llamada no tiene `await`, así que no valida nada.
3. Se aplica el payload `{campo: valorNuevo}` al registro del módulo correspondiente, **respetando el tipo de dato** (hoy todo se escribe como texto).
4. Se marca la solicitud como `Aprobada` y se notifica al solicitante con el nombre correcto del módulo.

**Rechazar:** se marca como `Rechazada` y **se notifica al solicitante**. Hoy no se envía ningún aviso.

---

### 5.3 Enviar Documento (`/gd/send/one`)

**Propósito:** enviar una plantilla de DocuSign a un colaborador registrado en un proceso, con los campos del documento rellenados automáticamente.

**Requisito previo:** DocuSign conectado.
- La conexión usa OAuth 2.0 Authorization Code + PKCE desde el navegador. El token dura poco y no tiene refresh token.
- Si no hay conexión o el token venció, la pantalla debe mostrar un estado bloqueante con el botón **Conectar DocuSign**, en lugar de fallar al enviar.

**Flujo (wizard de 2 pasos):**
1. **Datos del envío:**
   1. Tipo de proceso: Contratación, Promoción, Habeas Data, Cesación o Retail. Es obligatorio y habilita el resto de campos.
   2. **Cédula del receptor:** busca en el proceso elegido. Si hay varias coincidencias, se abre un selector de colaborador; si no hay ninguna, se avisa.
   3. Nombre y correo del receptor: se autocompletan y se pueden editar.
   4. **Plantilla** de DocuSign: select con búsqueda.
   5. Asunto del correo.
   6. **Siguiente:**
      1. se valida el formulario (hoy no se detiene si falla);
      2. se crea un **sobre en borrador** desde la plantilla;
      3. se leen los destinatarios, los *prefill tabs* y los campos DocGen;
      4. se rellenan con los datos del registro, mediante un diccionario de alias por etiqueta (nombre, documento, fecha de ingreso, salario y salario en letras, cargo, ciudad, auxilios, universidad, etapa…), con fechas en español y moneda COP.
2. **Firmantes:**
   1. una tarjeta por cada rol de la plantilla, con nombre y correo editables;
   2. la opción **"Usar datos del colaborador"** rellena esos campos;
   3. al pulsar **Enviar**, se actualizan los destinatarios, se envía el sobre y se registra el envío en la lista **Envios**: documento, cédula, receptor, correo, fecha, enviado por, `IdSobre`, `ID_Novedad`, compañía, fuente, destinatarios y `Estado = "Enviado"`.

**Mejoras:**
- **Previsualización:** mostrar los campos prellenados antes de enviar.
- **Borradores:** eliminar o anular el borrador si el usuario cancela; hoy quedan huérfanos.
- **Destinatarios:** corregir el guardado de `Recipients`, que hoy se toma de un estado desactualizado.

---

### 5.4 Enviar Documentos Masivos (`/gd/send/masive`)

**Propósito:** enviar la misma plantilla a muchos colaboradores. Se crea un sobre individual por fila, con concurrencia controlada.

**Flujo:**
1. **Elegir plantilla.**
2. **Generar tabla:** la plantilla define las columnas:
   - `ReferenceId`;
   - `{ROL}_Name` y `{ROL}_Email` por cada rol;
   - una columna por cada etiqueta de prefill o DocGen;
   - `empresa`.

   Hoy esto crea un borrador de prueba que queda huérfano. Hay que leer la estructura de la plantilla sin crear sobres, o eliminar el borrador.
3. **Llenar los datos**, de cualquiera de estas formas:
   - en el **grid editable**: agregar o quitar filas; la compañía se elige en un select;
   - **descargando el Excel** de la plantilla, llenándolo y **cargándolo**.
4. **Cargar Excel** (.xlsx/.xls, máximo recomendado 200 filas):
   - se muestra una vista previa con el resumen (filas, columnas, avisos) y las primeras 10 filas;
   - se normalizan los encabezados (`compañía` → `empresa`);
   - se avisa si faltan columnas obligatorias.
5. **Enviar masivo:**
   1. se valida compañía, nombre y correo del colaborador en cada fila;
   2. se envía cada fila con concurrencia de 2;
   3. una **tabla de resultados en vivo** muestra ReferenceId, EnvelopeId y estado (Enviado o Fallido) con el error;
   4. cada envío exitoso se registra en **Envios** con `Fuente = "Masiva"`.

**Mejoras:**
- **Validación previa:** validar todas las filas antes de enviar (correo válido, ReferenceId único, columnas requeridas). Hoy, si falta una columna, se aborta el lote completo aunque ya se hayan enviado sobres.
- **Progreso y reintento:** barra de progreso, opción de reintentar solo las fallidas y exportar los resultados.
- **Roles:** soportar todos los roles de la plantilla; hoy solo se usa `COLABORADOR`.
- **Código:** eliminar las utilidades duplicadas y sin uso. Evaluar la API Bulk Send de DocuSign.

---

### 5.5 Consultar Documentos (`/gd/send/look`)

**Propósito:** consultar el historial de envíos a firma y el estado real de cada sobre.

**Pantalla:**
- **Filtros:** búsqueda (cédula, receptor, correo, enviado por, documento) y rango de fechas.
- **Tabla:**
  - columnas: cédula, destinatario, correo, enviado por, documento, fecha, estado (Enviado / Completado / Rechazado);
  - ordenamiento multi-columna;
  - paginación en servidor de 10 a 100 registros. "Anterior" debe volver realmente a la página anterior; hoy reinicia a la primera.
- **Detalle del envío** (clic en una fila): se consulta DocuSign en vivo y se muestra:
  - **campos actuales** del documento (etiqueta y valor);
  - **destinatarios:** rol, nombre, correo, orden de firma y estado (En espera / Enviado / Firmado / Completado / Rechazado);
  - **Reenviar** el sobre.

**Mejora:** sincronizar el estado del sobre con la lista Envios (al abrir el detalle o con un proceso programado). Hoy ningún flujo de la app actualiza ese estado.

---

### 5.6 Generar Reportes (`/gd/reports`)

**Propósito:** exportar a Excel la información de los módulos.

**Flujo:**
1. **Tipo de reporte:** Envíos, Contrataciones, Promociones, Habeas Data, Cesaciones, Retail o **Consolidado**.
2. **Filtros:**
   - comunes: rango de fechas (obligatorio) y enviado o reportado por;
   - según el tipo: destinatario, plantilla, ciudad, cargo, empresa.
3. **Generar** produce el `.xlsx`:
   - **Envíos:** documento, destinatario, correo, cédula, enviado por, fecha, fuente, compañía, estado.
   - **Procesos:** sus datos más **% de completación** del checklist.
   - **Consolidado:** cédula, nombre, cargo, salario, fecha de ingreso, exámenes médicos, empresa, módulo, %. Hoy no incluye Habeas.

**Mejoras:**
- Mostrar una **vista previa** (conteo y primeras filas) antes de exportar.
- Corregir "Limpiar", que hoy no reinicia todos los filtros.
- Las opciones de los filtros deben salir de los catálogos, no de las filas ya cargadas.

---

### 5.7 Explorador de documentos (`/gd/documents/view`)

**Propósito:** navegar y administrar los expedientes digitales de los colaboradores y controlar su revisión documental.

**Datos:**
- **Bibliotecas por empresa:** una biblioteca SharePoint por empresa (Estudio de Moda, DH Retail, Denim Head, Visual, Metagraphics, Broken), con la estructura `Colaboradores Activos | Colaboradores Retirados | Procesos Cancelados / {cédula} - {nombre} / archivos`.
- **Carpetas - ControlRevisionCarpetas:** el estado de revisión de cada carpeta.
- **Carpetas - HistorialRevisionCarpetas:** una fila por acción sobre la carpeta.

**Pantalla:**
- **Selector de empresa:** cada empresa conserva su propia ruta de navegación.
- **Navegación:**
  - **breadcrumb navegable**: hoy es solo informativo y debe permitir clic;
  - botón Volver.
- **Indicadores:** estado de revisión de la carpeta, número de archivos y de carpetas.
- **Búsqueda y orden:** búsqueda por nombre; orden por fecha. Las carpetas siempre van primero.
- **Listado:** consecutivo, nombre, fecha de modificación y acciones.
  - Clic en una carpeta: entra en ella.
  - Clic en un archivo: lo abre. Se recomienda **vista previa en la app** (panel o modal) además de abrirlo en una pestaña nueva.
- **Acciones dentro de la carpeta de un colaborador:**
  - **Agregar archivo:** modal con nombre opcional y archivo; conserva la extensión correctamente.
  - **Renombrar:** conserva la extensión.
  - **Eliminar:** requiere `documents.delete` y confirmación.
  - **Marcar como retirado / Reintegrar:** requiere `documents.retirement`. Mueve la carpeta entre Activos y Retirados.
  - **Enviar a revisión:** requiere `documents.check`.
  - **Aprobar** o **Devolver** (con motivo): requiere `documents.approve`.
  - **Ver historial:** línea de tiempo con acción, estado anterior, estado resultante, comentario, autor y fecha.

**Flujo de revisión documental:**
```
(primer acceso a la carpeta) → En construcción
En construcción → [Enviar a revisión] → En revisión   (correo a Gestión Documental)
En revisión     → [Aprobar]           → Aprobado      (correo al grupo Compensación)
En revisión     → [Devolver + motivo] → En construcción, contador de devoluciones +1 (correo a Compensación)
```

**Correcciones para el refactor:**
- **Nombres de estado:** unificar (hoy se guarda "Aprobado" pero la UI compara con "aprobada").
- **Campos invertidos:** corregir los campos nombre y correo del aprobador y de quien devuelve.
- **Motivo de devolución:** guardar `MotivoUltimaDevolucion`.
- **Historial:** registrar el estado anterior real.
- **Búsqueda del control:** buscar por **cédula + empresa**.
- **Cancelar proceso:** exponer o eliminar la acción "Cancelar proceso", que hoy es código muerto.

---

### 5.8 Paz y salvos (`/paz`)

**Propósito:** gestionar la solicitud de paz y salvo de un empleado retirado. Varias áreas (aprobadores) deben responder; cuando todas responden se envía un consolidado y la solicitud se cierra.

**Datos:**
- **Paz y salvos:** consecutivo, datos del empleado, solicitante, aprobadores (`Solicitados`) y estado `Pendiente`/`Finalizado`.
- **Respuestas:** una por aprobador: área, estado, respuesta en HTML.
- **Firmas:** imagen de la firma de cada usuario en la biblioteca de documentos.
- **Renovar:** control de renovación de firma.
- **Flujos de Power Automate:** adjuntos y cierre final.

**Flujo de entrada (verificación de firma):**
- Si el usuario no tiene firma, su firma tiene más de 95 días o está marcada para renovar, se muestra **"Debe actualizar su firma"** con un selector de imagen y vista previa.
- Al guardar la firma, se debe **continuar sin recargar la página**; hoy es necesario recargar.

**Vistas:**
1. **Listado:**
   - **Filtros:** rango de fechas (hoy roto: usa el año en lugar de las fechas), año, búsqueda (cédula, nombre, cargo) y estado.
   - **Tabla:** nombre, cédula, fecha de ingreso, fecha de retiro, cargo, empresa, jefe directo, CO, estado.
   - **Visibilidad:** el administrador ve todo; los demás usuarios solo ven lo que solicitaron o lo que deben responder.
   - **Clic en una fila:** si el usuario es aprobador y aún no ha respondido, abre **Responder**; si no, abre **Ver respuestas**.
2. **Solicitar:**
   - **Datos del correo:** aprobadores (selector de usuarios del directorio, más "otros aprobadores" de cuentas genéricas) y observadores en copia. Se muestran como chips eliminables. Hoy vienen 10 aprobadores fijos precargados; deberían ser configurables.
   - **Datos del empleado retirado:** cédula, nombre, correo, fecha de ingreso, fecha de retiro, jefe directo, CO, empresa, cargo.
   - **Enviar:**
     1. se genera el consecutivo (debe ser seguro ante concurrencia);
     2. se crea el registro en estado `Pendiente`;
     3. se envía el correo a los aprobadores con los datos, un plazo de 5 días hábiles y la firma del solicitante.
3. **Responder:**
   - **Área** (centro de costos).
   - **Estado:** Aprobado / Novedad / Rechazado. Cada opción precarga una plantilla en el motivo.
   - **Motivo:** editor de texto enriquecido (negrita, cursiva, subrayado, listas, enlaces, imágenes).
   - **Adjuntos múltiples.**
   - **Al guardar:**
     - se registra la respuesta y se suben los adjuntos;
     - si la respuesta es Rechazado o Novedad, se envía un correo inmediato al jefe y al solicitante;
     - cuando todos los aprobadores han respondido sin rechazo, se envía el **correo consolidado**, se ejecuta el flujo de cierre y la solicitud pasa a `Finalizado`.
4. **Ver respuestas:**
   - una fila por aprobador: área, nombre, correo y estado derivado (Aprobado / Rechazado / Novedad / En espera);
   - el detalle muestra todas sus respuestas, con el motivo y los adjuntos.

**Correcciones para el refactor:**
- **Permisos:** usar las claves `paz.*` para autorizar dentro del módulo.
- **"Otros aprobadores":** elegir uno no debe sobrescribir el nombre del empleado.
- **HTML:** sanitizar el HTML de las respuestas antes de renderizarlo.
- **Configuración:** mover las URLs de los flujos a configuración.

---

### 5.9 Requisiciones (`/requisicion/*`, `/requisiciones/*`)

**Propósito:** gestionar el ciclo de vida de una vacante: creación con ANS y analista asignado automáticamente, seguimiento, checklist del proceso de selección, cierre y métricas. Hay documentación técnica detallada en [docs/requisiciones/](docs/requisiciones/README.md).

> **Refactor:** unificar `/requisicion` y `/requisiciones` en un solo árbol de rutas con **una sola instancia** de `RequisicionesProvider`. Hoy hay dos instancias y no comparten estado.

#### Nueva requisición (wizard de 2 pasos)
1. **Base de la vacante:**
   - Cargo y Ciudad.
   - Tipo y Nivel de cargo, que se calculan solos:
     - si el cargo pertenece a la lista de cargos Retail, el tipo es **Retail** y el salario se autocompleta;
     - si no, el tipo es **Administrativa**.
2. **Configuración:**
   - Salario, tipo de convocatoria, género, motivo, gerencia. Dominical solo en Retail.
   - Ubicación y estructura:
     - Retail: tienda (llena el centro operativo) y marca (llena el centro de costos);
     - Administrativa: área (llena el centro de costos);
     - ambos: unidad de negocio.
   - Solo Administrativa: pertenece al CVE (y grupo CVE), auxilio de rodamiento, tipo de teletrabajo.
3. **Crear:**
   1. **ANS:** días hábiles según el nivel de cargo (lista ANS).
   2. **Fecha de inicio:** si se crea hasta las 12:00 de un día hábil, el proceso inicia hoy; si no, el siguiente día hábil. Se usan los festivos de Colombia.
   3. **Fecha límite:** inicio + N días hábiles. El cálculo de festivos debe soportar el cambio de año; hoy solo carga el año en curso.
   4. **Responsable:**
      - Retail o nivel administrador: el responsable de la zona de la ciudad;
      - Administrativa: el responsable del nivel de cargo, si tiene menos de 10 requisiciones activas; si no, el analista con menos carga.
   5. Se crea la requisición con `Estado = "Activo"` y `cumpleANS = "Pendiente"`, junto con las instancias del checklist.
   6. Se notifica la asignación al analista.
   7. Si es Retail, se revisa la planta ideal frente a los contratos activos y, si hay sobreplanta, se notifica.

#### Tablero
- **KPIs:** Total, Activas, En retraso, Cerradas, Canceladas. Deben calcularse sobre **el total filtrado**, no solo sobre la página visible.
- **Filtros (en servidor):** ID, solicitante, profesional, estado (incluir **Finalizada**, que hoy falta), cargo, ciudad y mes de inicio. Los filtros activos se muestran como chips eliminables.
- **Visibilidad:** sin `requisiciones.viewAll`, el usuario solo ve lo que solicitó o lo que tiene asignado.
- **Columnas:** ID, cargo y ciudad, profesional, solicitante, fecha límite, **seguimiento**, fecha de cierre, % de avance y acciones (Ver / Editar / Checklist).
  - Seguimiento: "N días restantes", "Vence en N", "Vence hoy", "N días de retraso", "Cancelada" o "Completada".
- **Paginación:** de 10 a 100 registros por página, con caché de las páginas ya visitadas.

#### Detalle
- **Contenido:** secciones de solo lectura según el tipo, con encabezado `#Id · tipo · ciudad` y el estado.
- **Ver historial:** línea de tiempo de acciones (postergaciones, cancelación), con la fecha límite anterior y la nueva.
- **Postergar ANS:**
  - pide nueva fecha (no puede ser anterior a hoy ni a la fecha límite actual) y motivo;
  - actualiza la fecha límite, registra el cambio en el histórico y notifica al solicitante;
  - debe bloquearse para requisiciones finalizadas, canceladas o cerradas.
- **Reportar problema:**
  - motivo (Información incompleta / Inconsistencia / Planta no disponible / Otros) y detalle de hasta 200 palabras;
  - envía un correo al solicitante;
  - se sugiere también dejar registro en el histórico.
- **Cancelar requisición:**
  - requiere `requisiciones.edit` y motivo;
  - deja `Estado = "Cancelado"` y `cumpleANS = "No Aplica"`;
  - debe registrarse como "Cancelación" en el histórico, no como postergación.

#### Editar
- Borrador local que se guarda con "Guardar cambios".
- Secciones: resumen, responsables y fechas (solo lectura), ubicación y estructura, condiciones de vinculación.

#### Checklist del proceso
- **Plantilla y orden:** sale de la plantilla *Requisicion - Pasos*. Los pasos se desbloquean en orden.
- **Tipos de paso:** aprobación (con motivo si se rechaza), texto o numérico.
- **Omitir:** solo en pasos no obligatorios.
- **Cierre:**
  1. al completar el paso que lleva el avance al 100 %, se pide la **fecha de ingreso** del candidato (por defecto hoy);
  2. con esa fecha se calcula `cumpleANS` (Sí/No) frente a la fecha límite;
  3. se guarda `Estado = "Finalizada"` con la fecha de cierre y la de ingreso.
- **Encuesta de satisfacción:** se envía al solicitante al cerrar. En Retail, como máximo una vez al mes por solicitante.

#### Métricas (`/requisiciones/metricas/*`)
- **Resumen:**
  - filtros: dirección, ciudad, cargo, analista;
  - KPIs: vacantes abiertas, días promedio de cierre, vacantes en riesgo (≤ 3 días), vacantes vencidas;
  - medidor de cumplimiento del ANS;
  - embudo de selección: recibidas → entrevistas → finalistas → seleccionadas. Hoy depende de Ids de paso fijos en el código; deben ser configurables;
  - requisiciones por analista;
  - tendencia mensual del % de cumplimiento frente a la meta;
  - lista de vacantes urgentes.
- **Encuesta de satisfacción:**
  - datos de un Excel de Microsoft Forms;
  - una encuesta se aprueba si al menos el 80 % de sus respuestas son positivas;
  - medidor y barras por mes, con filtro de año.
- **Encuesta de periodo de prueba:** misma estructura; la aprobación depende de la respuesta de continuidad.
- **Consolidado:**
  - indicador ponderado: Requisiciones (cumple ANS) 70 %, Periodo de prueba 20 %, Satisfacción 10 %;
  - filtros de año y mes, medidor contra la meta del 90 % y tabla por componente.

#### Notificaciones

| Notificación | Momento | Destinatario |
|---|---|---|
| Asignación | Al crear la requisición | Analista |
| Planta ideal | Al crear una requisición Retail con sobreplanta | Responsables configurados |
| Problema reportado | Al usar "Reportar problema" | Solicitante |
| ANS postergado | Al postergar el ANS (hoy la fecha y el motivo salen invertidos) | Solicitante |
| Encuesta de satisfacción | Al cerrar la requisición | Solicitante |

**Código heredado sin uso** (eliminar o integrar):
- dashboard anterior de reportes;
- modal de log;
- configuración "Talent 360";
- CRUD de configuración del ANS. Se propone exponerlo como pestaña de Parámetros.

---

### 5.10 Parámetros (`/settings/*`)

**Propósito:** administrar catálogos y configuración de la aplicación.

**Configuraciones generales:** parejas clave/valor de la lista *Configuraciones*: SMMLV, auxilio de transporte, enlaces, etc. Solo se edita el valor; no hay alta ni baja.

**Catálogos:** casi todos viven en la lista *Maestros*, con un discriminador `Title`.

| Catálogo | Campos |
|---|---|
| Empresas | Nombre |
| Orígenes de selección | Nombre |
| Tipos de documento | Nombre, Abreviación |
| Cargos | Nombre + salario recomendado + nivel de cargo (listas satélite) |
| Modalidades de teletrabajo | Nombre |
| Especificidad de cargo | Nombre (hoy lista Cargos por error) |
| Nivel de cargos | Nombre, Abreviación |
| Centros operativos | Nombre, Código, **carga masiva** |
| Unidades de negocio | Nombre, Código |
| Tipos de contrato | Nombre |
| Tipos de vacante | Nombre |
| Centros de costos | Nombre, Código, **carga masiva** |

**Flujo común de CRUD:**
- listado con búsqueda;
- crear y editar en un formulario lateral o modal;
- eliminar con confirmación;
- notificación del resultado.

**Carga masiva (CC y CO):**
1. Se sube un Excel con código en la columna A y nombre en la B.
2. Se hace un *upsert* por código.
3. Se recomienda una vista previa y un resumen de creados, actualizados y errores.

**Gestores de pasos de proceso** (`/settings/proceso/{cesacion|novedades|promocion|retail}`):
- **Listado de pasos:** orden, nombre, tipo, obligatorio u opcional, evidencia. Cada paso tiene acciones **Editar**, **Reglas** y **Activar/Desactivar**.
- **Alta y edición:**
  - nombre, orden (se sugiere el siguiente), tipo y si es obligatorio;
  - según el tipo: nombre de la evidencia (subida de documento), o asunto y cuerpo enriquecido con variables (notificación).
- **Reglas de activación por cargo:**
  - cargo, tipo `INCLUIR` o `EXCLUIR`, activo;
  - sin duplicados y sin mezclar tipos;
  - hoy editar una regla guarda el paso en vez de la regla.
- **Propuesta:** permitir reordenar los pasos con drag & drop.

> **Refactor:** reemplazar los 12 gestores casi idénticos por un único componente `CatalogManager`, configurado con la categoría y la definición de campos. Agregar pestañas para la configuración del ANS por nivel de cargo, los responsables por zona y nivel, y los Ids de pasos del embudo de métricas.

---

### 5.11 Accesos (`/access`)

**Propósito:** administrar los miembros de los grupos de seguridad de Entra ID y los permisos de cada grupo.

**Usuarios por grupo:**
- **Selector y búsqueda:** selector de grupo de seguridad y búsqueda en servidor (nombre, correo, UPN).
- **Tabla de miembros:** nombre, correo, UPN y acción **Quitar** (con confirmación). Se pagina con "Cargar más".
- **Añadir usuario:** por correo o UPN.
- **Sincronizar usuarios activos** (solo para el grupo de usuarios de requisiciones):
  - agrega a todos los usuarios activos del directorio;
  - excluye cuentas de servicio y externas según una lista de términos, que debe ser configurable;
  - muestra el progreso (procesados, agregados, fallidos) y un resumen.

**Permisos del grupo:**
- **Presentación:** una tarjeta por módulo y un interruptor por `FeatureKey`.
- **Guardado:** actualización optimista, que revierte el cambio si falla.
- **Mejoras:**
  - crear la fila de permiso si no existe; hoy hay que sembrar la matriz a mano;
  - recargar el `PermissionsProvider` después de los cambios.

**Código heredado:** la página "Usuarios/Perfiles", sin contenido, y los servicios de "Permisos Docu" y "Perfiles Novedades". Se eliminan.

---

## 6. Componentes compartidos del nuevo sistema

| Componente | Uso |
|---|---|
| `AppShell` (Sidebar, Header, ThemeToggle, UserMenu, DocusignStatus) | Layout global |
| `DataTable` | Tablas con orden multi-columna, paginación en servidor (cursor `nextLink`), selección de tamaño de página, vista de tarjetas en móvil, skeleton y estado vacío |
| `FilterBar` + `FilterChips` | Búsqueda con debounce, rangos de fecha, selects y chips de filtros activos |
| `FormSection`, `Field`, `Select` (con búsqueda), `DatePicker`, `CurrencyInput`, `PeoplePicker` (directorio Graph) | Formularios |
| `Stepper` / `Wizard` | Contratación, nueva requisición, envío de documento |
| `ProcessChecklist` | Motor de pasos compartido (GD y requisiciones) |
| `Modal`, `Drawer`, `ConfirmDialog` (con campo de motivo opcional u obligatorio) | Diálogos |
| `FileUpload` (dropzone, varios archivos, validación de tipo y tamaño) | Explorador, checklist, paz y salvo, carga masiva |
| `RichTextEditor` (con sanitización) | Plantillas de correo, respuestas de paz y salvo |
| `StatusBadge` | Estados de registros, sobres, carpetas, requisiciones |
| `Timeline` | Historiales (carpetas, requisiciones) |
| `KpiCard`, `Gauge`, `ChartCard` | Métricas |
| `DiffTable` | Aprobación de ediciones |
| `ExcelImportPreview` | Carga masiva y envíos masivos |

---

## 7. Patrones transversales

- **Notificaciones:**
  - API explícita: `notify.success/error/warning/info`;
  - eliminar la clasificación por palabras clave (`notify.auto`) y el puente que convierte `alert()` en toast.
- **Errores:**
  - un mapeador único de errores de Graph y DocuSign a mensajes claros;
  - error boundary por módulo.
- **Carga:**
  - skeletons en listados;
  - spinner en botones de acción;
  - bloqueo de doble envío.
- **Fechas:**
  - una sola utilidad de fechas, con zona `America/Bogota` y festivos de Colombia para varios años;
  - un formato de visualización consistente.
- **Correos:**
  - plantillas centralizadas;
  - destinatarios configurables, no escritos en el código.
- **Seguridad:**
  - nada de secretos en el código (URLs con SAS, client IDs, GUIDs): todo pasa a configuración por entorno;
  - sanitizar todo HTML que se renderiza.
- **Rendimiento:**
  - carga diferida (lazy) por módulo;
  - consultas agregadas en lugar de N+1;
  - caché de catálogos.
- **Estructura de carpetas sugerida:**
  ```
  src/
    app/          (providers, shell, rutas)
    modules/<modulo>/{pages,components,hooks,services,models}
    shared/{ui,hooks,utils,services}
    config/
  ```

---

## 8. Defectos funcionales conocidos a resolver

| Módulo | Defecto |
|---|---|
| Contrataciones | La edición directa arma el patch con los argumentos invertidos y no guarda los cambios |
| Cesaciones | El bloqueo de edición por envío consulta la Fuente equivocada (`Novedades` en lugar de `Cesacion`) |
| Retail | El permiso de edición usa `retail.view`; el filtro "Finalizados" no coincide con el estado `Completado` |
| Aprobar ediciones | La verificación de aprobador no usa `await`; no hay campo de razón; no se notifica el rechazo; el correo siempre dice "Contrato"; los valores se escriben como texto; los detalles se crean sin `await` |
| Registrar | Eliminar un registro no elimina sus detalles de pasos |
| Enviar documento | La validación no detiene el flujo; `Recipients` se guarda desactualizado; quedan borradores huérfanos |
| Envío masivo | Una columna faltante aborta el lote completo; solo se usa el rol COLABORADOR; quedan borradores de prueba huérfanos |
| Consultar | El estado del sobre no se sincroniza; "Anterior" reinicia la paginación |
| Explorador | Nombres de estado inconsistentes; campos de nombre y correo invertidos; no se guarda el motivo de devolución; el estado anterior del historial es fijo; el control se busca solo por cédula; la extensión de los archivos subidos se calcula mal |
| Paz y salvo | El filtro de fechas usa el año; el consecutivo no es seguro ante concurrencia; "otros aprobadores" sobrescribe el nombre del empleado; el HTML no se sanitiza; los permisos `paz.*` no se usan |
| Requisiciones | Los argumentos de la notificación de postergación están invertidos; la cancelación se registra como postergación; "Finalizada" falta en el filtro y no bloquea la postergación; los KPIs se calculan solo sobre la página visible; cancelar siempre reporta éxito |
| Parámetros | Especificidad lista Cargos; CO y UN no guardan el código al editar; editar una regla de paso guarda el paso |
| Accesos | No crea filas de permiso faltantes; no recarga los permisos después de un cambio |
| Shell | `AuthProvider` duplicado; el tema no persiste; "Salir" se salta el `AuthProvider` |

---

## 9. Plan de refactor por fases

1. **Fundaciones:**
   - sistema de diseño con tokens y modo claro/oscuro, y componentes base;
   - `AppShell` responsive;
   - configuración por entorno;
   - servicio base único;
   - rutas protegidas por permiso.
2. **Componentes compartidos:** `DataTable`, `FilterBar`, formularios, `ProcessChecklist`, modales y `FileUpload`.
3. **Módulos de alto uso:** Registrar Nuevo Ingreso, Aprobar Ediciones y Requisiciones (tablero, detalle, checklist).
4. **Firma electrónica:** Enviar documento, envío masivo, Consultar.
5. **Expedientes:** Explorador de documentos y Paz y salvos.
6. **Analítica y administración:** Reportes, Métricas, Parámetros (`CatalogManager`) y Accesos.
7. **Limpieza:** eliminar código heredado y sin uso, y actualizar `docs/`.

En cada fase se corrigen los defectos de la sección 8 del módulo correspondiente. Antes de cerrar la fase se valida en móvil, tablet y escritorio, y en ambos modos de color.
