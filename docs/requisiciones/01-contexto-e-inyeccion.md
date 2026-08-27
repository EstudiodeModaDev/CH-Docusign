# El Context de Requisiciones: qué es, por qué existe y cómo se inyecta

Archivo clave: [`src/Funcionalidades/Requisiciones/RequisicionesContext.tsx`](../../src/Funcionalidades/Requisiciones/RequisicionesContext.tsx)

## 1. La pregunta: ¿por qué `useRequisiciones` viene de un contexto?

Porque **muchos componentes distintos, en distintos niveles del árbol, necesitan leer y modificar exactamente el mismo estado** (las mismas filas cargadas, los mismos filtros, el mismo borrador del formulario), y no solo una copia parecida.

Si en vez de un Context cada componente llamara directamente al hook `useRequisicion()`, cada llamada crearía **su propia instancia independiente** de estado: su propio `useState`, su propio `fetch` a SharePoint, sus propios filtros. El tablero, el modal de detalle y el wizard de creación quedarían desincronizados entre sí (cada uno con su copia de `rows`, por ejemplo).

El Context resuelve esto con el patrón: **"llamar el hook UNA sola vez arriba, y repartir ese mismo objeto de estado hacia abajo por Context"**.

## 2. Las dos piezas: el hook y el Context

### 2.1 El hook raíz: `useRequisicion()`

Archivo: [`src/Funcionalidades/Requisiciones/Requisicion/Hooks/requisicion.ts`](../../src/Funcionalidades/Requisiciones/Requisicion/Hooks/requisicion.ts)

`useRequisicion` no tiene lógica propia casi; es un **compositor** de 6 hooks más pequeños, cada uno responsable de una porción del estado:

```ts
export function useRequisicion() {
  const formController = useNewRequisicionForm()        // borrador (state), setField, errors, cleanState
  const paginationController = useNewRequisicionPagination() // pageIndex, pageSize, nextLink, hasNext...
  const filtersController = useRequisicionFilters(paginationController.pageSize) // search, estado, cargo...
  const actionsController = useRequisicionesActions({ setErrors: formController.setErrors, state: formController.state })
  const listController = useRequisicionesList({ filters: filtersController, pagination: paginationController })
  const notificationController = useNotifyRequisiciones()

  // ...
  return {
    ...formController,
    ...paginationController,
    ...filtersController,
    ...actionsController,
    ...listController,
    ...notificationController,
    cancelarRequisicion,
    onPostergarANS,
  };
}
```

Cada sub-hook internamente usa `useCoreGraphServices()` / `useRequisicionesServices()` (ver [06](./06-modelo-datos-servicios-permisos.md)) para llamar a los servicios de SharePoint. El resultado final es **un único objeto plano** con ~40 propiedades: datos (`rows`, `state`, `errors`), banderas (`loading`, `hasNext`), y funciones (`setField`, `handleSubmit`, `nextPage`, `cancelarRequisicion`...).

Este objeto es **puro estado de React** (no hay Redux/Zustand/Recoil en este módulo) — su única particularidad es que en vez de vivir en un solo `useState`, vive repartido en 6 hooks que se combinan.

### 2.2 El Context: `RequisicionesContext.tsx`

```tsx
type RequisicionesContextValue = ReturnType<typeof useRequisicion>;

const RequisicionesContext = React.createContext<RequisicionesContextValue | null>(null);

export function RequisicionesProvider() {
  const value = useRequisicion();          // 1. se llama el hook UNA vez

  return (
    <RequisicionesContext.Provider value={value}>
      <Outlet />                           {/* 2. se expone a los hijos de la ruta */}
    </RequisicionesContext.Provider>
  );
}

export function useRequisicionesContext() {
  const ctx = React.useContext(RequisicionesContext);
  if (!ctx) {
    throw new Error("useRequisicionesContext debe usarse dentro de RequisicionesProvider");
  }
  return ctx;
}
```

Dos detalles no evidentes a primera vista:

- **`RequisicionesProvider` no recibe `children` como prop.** En vez de eso renderiza `<Outlet />` de `react-router-dom`. Esto es la señal de que **este componente está diseñado para ser el `element` de una `<Route>` padre**, no un wrapper genérico que se usa como `<RequisicionesProvider>{...}</RequisicionesProvider>` en cualquier parte del árbol.
- **`useRequisicionesContext()` lanza un error si no hay Provider arriba.** Es el mismo patrón "guard clause" que usan `useCoreGraphServices()`, `usePermissions()` y `useAuth()` en el resto de la app — falla rápido y con un mensaje claro en vez de devolver `undefined` silenciosamente.

## 3. Dónde se inyecta (el paso que conecta todo)

Archivo: [`src/Routes/index.tsx`](../../src/Routes/index.tsx)

```tsx
<Route path="/requisiciones" element={<RequisicionesProvider />}>
  <Route path="metricas" element={<RequisicionesMetricasWrapper/>}>...</Route>
  <Route path="tableaRequisiciones" element={<RequisicionesBoardWrapper/>}/>
  <Route path="tableaRequisiciones/visualizacionDetalle" element={<RequisicionesBoardWrapper/>}/>
</Route>

<Route path="/requisicion" element={<RequisicionesProvider />}>
  <Route index element={null} />
  <Route path="new" element={<NewRequisicionWrapper/>}/>
  <Route path="view" element={<RequisicionesBoardWrapper/>}/>
  <Route path="view/visualizacionDetalle" element={<RequisicionesBoardWrapper/>}/>
  <Route path="view/editRequisicion" element={<RequisicionesBoardWrapper/>}/>
  <Route path="metricas" element={<Navigate to="/requisiciones/metricas" replace />} />
</Route>
```

`react-router-dom` es quien hace la "inyección" en este caso: cuando la URL cae bajo `/requisicion/*` o `/requisiciones/*`, el router renderiza `<RequisicionesProvider />` como ancestro y cualquier `<Route>` hija se renderiza dentro de su `<Outlet />`. Ningún componente hijo necesita recibir el estado como prop desde arriba — cualquiera de ellos (a cualquier profundidad) puede llamar `useRequisicionesContext()` directamente y obtener el mismo objeto.

## 4. Cómo se consume, con ejemplos reales

Hay dos estilos de consumo en el código, ambos válidos:

**a) El wrapper de ruta llama al contexto y pasa props hacia abajo** (útil cuando el componente de UI debe quedar "tonto"/reusable):

```tsx
// src/Routes/Wrapper/newRequisicion.tsx
const { cleanState, reloadAll, setField, state, handleSubmit, notifyAsignacion, sendNotificationPlantaIdeal }
  = useRequisicionesContext();

<WizardRequisicion3Pasos onClose={...} state={state} handleSubmit={handleSubmit} setField={setField} ... />
```

```tsx
// src/Routes/Wrapper/RequisicionBoardWrapper.tsx
const { setState, state, onPostergarANS } = useRequisicionesContext();
```

**b) El componente de presentación llama al contexto directamente**, sin pasar por el wrapper:

```tsx
// src/Components/Requisiciones/tablaRequisiciones/tablaRequisiciones.tsx
const requisicionesController = useRequisicionesContext();
// usa requisicionesController.rows, .sorts, .setSorts, .search, .setSearch, .pageIndex, .nextPage, ...
```

```tsx
// src/Routes/Wrapper/RequisicionesMetricasWrapper.tsx
const requisicionesController = useRequisicionesContext();
// reutiliza requisicionesController.buildFilter() para traer TODAS las filas para las métricas,
// y comparte cargo/ciudad/analista como filtros del dashboard
```

Este segundo estilo es lo que permite que, por ejemplo, crear una requisición nueva (`/requisicion/new`) y volver al tablero (`/requisicion/view`) muestre la lista actualizada sin recargar la página: `NewRequisicionWrapper` llama `reloadAll()` sobre el **mismo** `listController` que lee `RequisicionesBoard` — porque ambas rutas cuelgan del mismo `<RequisicionesProvider />` (`/requisicion`).

## 5. Gotcha: dos instancias del Provider {#gotcha-dos-instancias-del-provider}

`RequisicionesContext` es un único objeto `React.createContext(...)`, pero en `Routes/index.tsx` se monta **dos veces**, como `element` de dos rutas padre distintas: `/requisicion` y `/requisiciones`. Cada montaje ejecuta `useRequisicion()` de cero, con sus propios `useState` — son dos instancias de estado completamente independientes, aunque compartan el mismo Context "molde".

Consecuencia práctica: navegar entre `/requisicion/view` (tablero) y `/requisicion/new` (wizard) **conserva** el estado (mismos filtros, mismas filas cargadas), porque ambas rutas están bajo el mismo `<RequisicionesProvider />`. Pero navegar desde `/requisicion/view` hacia `/requisiciones/metricas` **desmonta** el primer Provider y monta uno nuevo — se pierde cualquier filtro que se hubiera configurado en el tablero, porque el dashboard arranca con un `useRequisicion()` fresco.

Esto probablemente sea remanente de una migración de rutas en singular (`/requisicion/...`) hacia plural (`/requisiciones/...`) — de hecho `/requisicion/metricas` hace `<Navigate to="/requisiciones/metricas" replace />`. Si en algún momento se quiere que el tablero y las métricas compartan filtros en vivo, habría que unificarlos bajo un mismo `<Route>` padre.

## 6. Gotcha: propiedades duplicadas entre sub-hooks

Como `useRequisicion` combina los 6 sub-hooks con spread (`{...formController, ...paginationController, ...filtersController, ...actionsController, ...listController, ...notificationController}`), si dos sub-hooks devuelven una propiedad con el mismo nombre, **la del hook que se spreadea después gana**, silenciosamente. Dos casos reales en el código actual:

- **`loading`**: lo definen tanto `useRequisicionesActions` (indica que se está creando/editando/postergando) como `useRequisicionesList` (indica que se está trayendo la página de resultados). Como `listController` se spreadea después que `actionsController`, `requisicionesController.loading` **siempre refleja el loading del listado**, nunca el de guardar/crear. Si necesitas saber si un `handleSubmit` está en curso, no uses `loading` desde el contexto — usa el valor que devuelve `useRequisicionesActions` directamente si lo necesitas aislado.
- **`sorts` / `setSorts`**: existen tanto en `useNewRequisicionForm` como en `useRequisicionFilters`. Como `filtersController` se spreadea después, gana el `sorts` de los filtros (que sí está conectado al `orderby` de la query a Graph vía `buildFilter()`). El `sorts` que declara `useNewRequisicionForm.ts` queda efectivamente sin uso.

No es necesariamente un bug (el tablero funciona con el `sorts` "correcto"), pero es útil saberlo para no perder tiempo buscando por qué cambiar un estado en un sub-hook no parece tener efecto: puede estar siendo tapado por otro sub-hook posterior en el spread.

## 7. El mismo patrón se repite en otras partes de la app

Para reconocerlo rápido en el resto del código:

| Context | Hook interno | Qué guarda | Dónde se monta |
|---|---|---|---|
| `RequisicionesContext` | `useRequisicion()` | Estado de UI/negocio del módulo (filtros, filas, borrador, acciones) | `<Route element={<RequisicionesProvider/>}>` en `Routes/index.tsx` |
| `GraphServicesProvider` (en `graph/graphContext.tsx`) | `buildGraphDomainServices(cfg, graph)` | **Instancias de servicios** (clientes de listas SharePoint), no estado de UI | Envuelve toda la app autenticada, en `App.tsx` |
| `PermissionsProvider` (en `Funcionalidades/Permisos.tsx`) | motor de permisos (`engine.can`, `engine.canAny`) | Qué puede hacer el usuario logueado | Envuelve toda la app autenticada, en `App.tsx` |
| `RequisicionesMetricasDataContext` (en `Components/Requisiciones/Metricas/RequisicionesMetricasContext.tsx`) | ninguno (recibe `value` calculado por `RequisicionesMetricasLayout`) | `{ loading, error, rowsCount, metrics }` para las 3 pestañas del dashboard | `<Outlet/>` dentro de `RequisicionesMetricasLayout` |

Es importante no confundir `useRequisicionesContext()` (estado de negocio: filas, filtros, formulario) con `useRequisicionesServices()` / `useCoreGraphServices()` (clientes de API hacia SharePoint). El primero se construye **usando** el segundo por debajo — ver [06-modelo-datos-servicios-permisos.md](./06-modelo-datos-servicios-permisos.md).
