import React from "react";
import type { DateRange, GetAllOpts, rsOption, SortDir, SortField, } from "../../models/Commons";
import { toGraphDateTime, toISODateFlex, toISODateTimeFlex } from "../../utils/Date";
import type { CesacionesService } from "../../Services/Cesaciones.service";
import type { Cesacion, CesacionErrors } from "../../models/Cesaciones";
import { useAuth } from "../../auth/authProvider";
import { useDebouncedValue } from "./Contratos";
import { norm } from "../../utils/text";

function includesSearch(row: Cesacion, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Nombre).includes(qq) ||
    norm(row.Title).includes(qq) ||
    norm(row.Cargo).includes(qq)
  );
}

function compareRows(a: Cesacion, b: Cesacion, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const toTime = (v: any) => {
    if (!v) return 0;

    // Caso: ya viene ISO (2026-01-23T00:00:00Z) o Date
    const d1 = new Date(v);
    if (!Number.isNaN(d1.getTime())) return d1.getTime();

    // Caso: viene como "YYYY-MM-DD" sin hora
    const s = String(v).trim();
    const isoTry = new Date(`${s}T00:00:00Z`);
    if (!Number.isNaN(isoTry.getTime())) return isoTry.getTime();

    // Caso: viene como "DD/MM/YYYY"
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    }

    return 0;
  };

  const get = (r: Cesacion) => {
    switch (field) {
      case "Cedula":
        return norm(r.Title);
      case "Nombre":
        return norm(r.Nombre);
      case "reporta":
        return norm(r.Reportadopor);
      case "Tienda":
        return norm(r.Tienda);
      case "ingreso":
        return toTime(r.FechaIngreso);
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}


export function useCesaciones(CesacionesSvc: CesacionesService,) {
  const [baseRows, setBaseRows] = React.useState<Cesacion[]>([]);
  const [rows, setRows] = React.useState<Cesacion[]>([]);
  const [workers, setWorkers] = React.useState<Cesacion[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const {account} = useAuth()
  const [state, setState] = React.useState<Cesacion>({
    Cargo: "",
    Celular: "",
    Correoelectronico: "",
    FechaIngreso: null,
    FechaLimiteDocumentos: null,
    FechaSalidaCesacion: null,
    Jefedezona: "",
    Nombre: "",
    Temporal: "",
    Tienda: "",
    Title: "",
    Reportadopor: account?.name ?? "",
    Empresaalaquepertenece: "",
    Fechaenlaquesereporta: toISODateFlex(new Date()),
    TipoDoc: "",
    Departamento: "",
    Ciudad: "",
    Niveldecargo: "",
    CargoCritico: "",
    Dependencia: "",
    CodigoCC: "",
    DescripcionCC: "",
    CodigoCO: "",
    DescripcionCO: "",
    CodigoUN: "",
    DescripcionUN: "",
    Salario: "",
    SalarioTexto: "",
    auxConectividadTexto: "",
    auxConectividadValor: "",
    Pertenecealmodelo: false,
    GrupoCVE: "",
    PresupuestaVentas: "",
    Autonomia: "",
    ImpactoCliente: "",
    contribucionEstrategia: "",
    Promedio: "",
    Estado: "En proceso",
    direccionResidencia: "",
    CanceladoPor: "",
    RazonCancelacion: ""
  });
  const [estado, setEstado] = React.useState<string>("proceso");
  const [errors, setErrors] = React.useState<CesacionErrors>({});
  const setField = <K extends keyof Cesacion>(k: K, v: Cesacion[K]) => setState((s) => ({ ...s, [k]: v }));
  const debouncedSearch = useDebouncedValue(search, 250);
  
  // construir filtro OData
 const buildServerFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if (estado === "proceso") filters.push(`fields/Estado eq 'En proceso'`);
    if (estado === "finalizado") filters.push(`fields/Estado eq 'Completado'`);
    if (estado === "cancelado") filters.push(`fields/Estado eq 'Cancelado'`);

    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/FechaIngreso ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/FechaIngreso le '${range.to}T23:59:59Z'`);
    }

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby: "fields/Created desc",
      top: 2000,
    };
  }, [estado, range.from, range.to]);

  const loadBase = React.useCallback(async () => { 
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const { items } = await CesacionesSvc.getAll(buildServerFilter());
      setBaseRows(items ?? []);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setBaseRows([]);
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [account?.username, CesacionesSvc, buildServerFilter]);

  // Traer de Graph SOLO cuando cambie estado/rango (o cuando auth esté listo)
  React.useEffect(() => {
    loadBase();
  }, [loadBase, estado, range.from, range.to, pageSize]);

  // Cuando cambie search (debounced) volvemos a la primera página CSR
  React.useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearch]);

  // =========================
  // CSR pipeline: search contains + sort multi + pagination
  // =========================
  React.useEffect(() => {
    // 1) filter contains (CSR)
    let data = baseRows;
    if (debouncedSearch?.trim()) {
      data = baseRows.filter((r) => includesSearch(r, debouncedSearch));
    }

    // 2) sort multi-col
    if (sorts?.length) {
      data = [...data].sort((a, b) => {
        for (const s of sorts) {
          const c = compareRows(a, b, s.field, s.dir);
          if (c !== 0) return c;
        }
        return 0;
      });
    }

    // 3) paginate local
    const start = (pageIndex - 1) * pageSize;
    const page = data.slice(start, start + pageSize);

    setRows(page);

    const hasMore = data.length > start + pageSize;
    setNextLink(hasMore ? "local" : null);
  }, [baseRows, debouncedSearch, sorts, pageIndex, pageSize]);

  // =========================
  // API-compatible: loadFirstPage / paging
  // =========================
  const loadFirstPage = React.useCallback(async () => {
    // CSR: recarga base del server y vuelve a page 1
    await loadBase();
    setPageIndex(1);
  }, [loadBase]);

  // siguiente página: seguir el nextLink tal cual
  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await CesacionesSvc.getByNextLink(nextLink);
      setRows(items);             
      setNextLink(n2 ?? null); 
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, CesacionesSvc]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  const toggleSort = React.useCallback((field: SortField, additive = false) => {
    setSorts(prev => {
      const idx = prev.findIndex(s => s.field === field);
      if (!additive) {
        // clic normal: solo esta columna; alterna asc/desc
        if (idx >= 0) {
          const dir: SortDir = prev[idx].dir === 'desc' ? 'asc' : 'desc';
          return [{ field, dir }];
        }
        return [{ field, dir: 'asc' }];
      }
      // Shift+clic: multi-columna
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { field, dir: copy[idx].dir === 'desc' ? 'asc' : 'desc' };
        return copy;
      }
      return [...prev, { field, dir: 'asc' }];
    });
  }, []);

  const validate = () => {
    const e: CesacionErrors = {};
    if(!state.Cargo) e.Cargo = "Seleccione un cargo"
    if(!state.Empresaalaquepertenece) e.Empresaalaquepertenece = "Seleccione una empresa"
    if(!state.TipoDoc) e.TipoDoc = "Seleccione un tipo de documento"
    if(!state.FechaIngreso) e.FechaIngreso = "Seleccione una fecha de ingreso"
    if(!state.FechaLimiteDocumentos) e.FechaLimiteDocumentos = "Seleccione una fecha limite documentos"
    if(!state.Niveldecargo) e.Niveldecargo = "Seleccione un nivel de cargo"
    if(!state.Dependencia) e.Dependencia = "Seleccione una dependencia"
    if(!state.Departamento) e.Departamento = "Seleccione un departamento"
    if(!state.Ciudad) e.Ciudad = "Seleccione una ciudad"
    if(!state.CodigoCC) e.CodigoCC = "Seleccione un CC"
    if(!state.CodigoCO) e.CodigoCO = "Seleccione un CO"
    if(!state.CodigoUN) e.CodigoUN = "Seleccione una UN"
    if(!state.CargoCritico) e.CargoCritico = "¿Es cargo critico?"
    if(!!state.Pertenecealmodelo && !state.Autonomia) e.Autonomia = "Escoja un valor para la autonomia"
    if(!!state.Pertenecealmodelo && !state.PresupuestaVentas) e.PresupuestaVentas = "Escoja un valor para el presupesto ventas/magnitud económica"
    if(!!state.Pertenecealmodelo && !state.ImpactoCliente) e.ImpactoCliente = "Escoja un valor para el impacto cliente externo"
    if(!!state.Pertenecealmodelo && !state.contribucionEstrategia) e.contribucionEstrategia = "Escoja un valor para la contribución a la estrategia"
    if(!state.Title) e.Title = "Ingrese el numero de documento"
    if(!state.Correoelectronico) e.Correoelectronico = "Ingrese el correo electronico"
    if(!state.Salario) e.Salario = "Ingrese el salario"
    if(!state.Temporal) e.Temporal = "Ingrese la temporal"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({
      Cargo: "",
      Celular: "",
      Correoelectronico: "",
      FechaIngreso: null,
      FechaLimiteDocumentos: null,
      FechaSalidaCesacion: null,
      Jefedezona: "",
      Nombre: "",
      Temporal: "",
      Tienda: "",
      Title: "",
      Reportadopor: account?.name ?? "",
      Empresaalaquepertenece: "",
      Fechaenlaquesereporta: toISODateFlex(new Date()),
      TipoDoc: "",
      Departamento: "",
      Ciudad: "",
      Niveldecargo: "",
      CargoCritico: "",
      Dependencia: "",
      CodigoCC: "",
      DescripcionCC: "",
      CodigoCO: "",
      DescripcionCO: "",
      CodigoUN: "",
      DescripcionUN: "",
      Salario: "",
      SalarioTexto: "",
      auxConectividadTexto: "",
      auxConectividadValor: "",
      Pertenecealmodelo: false,
      GrupoCVE: "",
      PresupuestaVentas: "",
      Autonomia: "",
      ImpactoCliente: "",
      contribucionEstrategia: "",
      Promedio: "",
      Estado: "En proceso",
      direccionResidencia: "",
      CanceladoPor: "",
      RazonCancelacion: ""
    })
  };

  const handleSubmit = async (): Promise<{created: string | null, ok: boolean}> => {
    if (!validate()) { 
    console.log(state)  
      alert("Hay campos sin rellenar")
      return {
        ok: false,
        created: null 
      }
    };
    console.log(state)
    setLoading(true);
    try {
      const payload: Cesacion = {
        Cargo: state.Cargo,
        Celular: state.Celular,
        Correoelectronico: state.Correoelectronico,
        FechaIngreso: toGraphDateTime(state.FechaIngreso) ?? null,
        FechaLimiteDocumentos: toGraphDateTime(state.FechaLimiteDocumentos) ?? null,
        FechaSalidaCesacion: toGraphDateTime(state.FechaSalidaCesacion) ?? null,
        Jefedezona: state.Jefedezona,
        Nombre: state.Nombre,
        Temporal: state.Temporal,
        Tienda: state.Tienda,
        Title: state.Title,
        Reportadopor: state.Reportadopor,
        Empresaalaquepertenece: state.Empresaalaquepertenece,
        Fechaenlaquesereporta: toGraphDateTime(state.Fechaenlaquesereporta) ?? null,
        TipoDoc: state.TipoDoc,
        Departamento: state.Departamento,
        Ciudad: state.Ciudad,
        Niveldecargo: state.Niveldecargo,
        CargoCritico: state.CargoCritico,
        Dependencia: state.Dependencia,
        CodigoCC: state.CodigoCC,
        DescripcionCC: state.DescripcionCC,
        CodigoCO: state.CodigoCO,
        DescripcionCO: state.DescripcionCO,
        CodigoUN: state.CodigoUN,
        DescripcionUN: state.DescripcionUN,
        Salario: String(state.Salario),
        SalarioTexto: state.SalarioTexto,
        auxConectividadTexto: state.auxConectividadTexto,
        auxConectividadValor: state.auxConectividadValor,
        Pertenecealmodelo: state.Pertenecealmodelo,
        GrupoCVE: state.GrupoCVE,
        PresupuestaVentas: state.PresupuestaVentas,
        Autonomia: state.Autonomia,
        ImpactoCliente: state.ImpactoCliente,
        contribucionEstrategia: state.contribucionEstrategia,
        Promedio: state.Promedio,
        Estado: "En proceso",
        direccionResidencia: state.direccionResidencia,
        CanceladoPor: state.CanceladoPor,
        RazonCancelacion: state.RazonCancelacion
      };
      const creado = await CesacionesSvc.create(payload);
      reloadAll()
      alert("Se ha creado el registro con éxito")
      return {
        ok: true,
        created: creado.Id ?? ""
      }
    } catch{
      return {
        ok: false,
        created: null
      }
    }finally {
        setLoading(false);
      }
  };

  const normalize = (v: any) => (v === "" ? null : v);

  const normalizeDate = (v: any) => toISODateFlex(v) ?? null;

  const fields: (keyof Cesacion)[] = [
    "Title", "Nombre", "Cargo", "Temporal", "Tienda", "Celular", "Correoelectronico", "Jefedezona", "Reportadopor", "Empresaalaquepertenece", "TipoDoc", "Departamento", "Ciudad", 
    "Niveldecargo", "CargoCritico", "Dependencia", "CodigoCC", "DescripcionCC", "CodigoCO", "DescripcionCO", "CodigoUN", "DescripcionUN", "Salario", "SalarioTexto", 
    "auxConectividadTexto", "auxConectividadValor", "Pertenecealmodelo", "GrupoCVE", "PresupuestaVentas", "Autonomia", "ImpactoCliente", "contribucionEstrategia", "Promedio", 
    "direccionResidencia",
  ];

  const dateFields: (keyof Cesacion)[] = [
    "FechaIngreso","FechaLimiteDocumentos","FechaSalidaCesacion",
  ];

  const buildPatch = (original: Cesacion, next: Cesacion) => {
    const patch: Record<string, any> = {};

    for (const k of fields) {
      const a = normalize(original[k]);
      const b = normalize(next[k]);
      if (a !== b) patch[k] = b;
    }

    for (const k of dateFields) {
      const a = normalizeDate(original[k]);
      const b = normalizeDate(next[k]);
      if (a !== b) patch[k] = b;
    }

    return patch;
  };

  const handleEdit = async (e: React.FormEvent, CesacionSeleccionada: Cesacion) => {
    e.preventDefault();
    if (!validate()) return;
    if (!CesacionSeleccionada.Id) { alert("Registro sin Id"); return; }

    setLoading(true);
    try {
      const payload = buildPatch(CesacionSeleccionada, state);

      // opcional: si no hay cambios, no pegues al servidor
      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      await CesacionesSvc.update(CesacionSeleccionada.Id, payload);
      alert("Se ha actualizado el registro con éxito");
    } catch {
      alert("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };


  const searchWorker = async (query: string): Promise<Cesacion[]> => {
    const resp = await CesacionesSvc.getAll({
      filter: `fields/Title eq '${query}'`,
      top: 200,
    });

    const workers: Cesacion[] = resp.items ?? [];
    setWorkers(workers);

    const seen = new Set<string>();

    const next: rsOption[] = workers
      .map(item => ({
        value: item.Id!, // solo el Id
        label: `Nombre: ${item.Nombre} - Cesacion - Cargo: ${item.Cargo} - Fecha ingreso: ${toISODateTimeFlex(item.FechaIngreso)}.`,
      }))
      .filter(opt => {
        if (!opt.value) return false;
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      });

    setWorkersOptions(next);
    console.log("options armadas:", next);

    return workers;
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, cargo?: string, empresa?: string, ciudad?: string) => {
    setLoading(true); setError(null);
    const filters: string[] = [];
    filters.push(`fields/FechaIngreso ge '${from}T00:00:00Z' and fields/FechaIngreso le '${to}T23:59:59Z'`)

    if(EnviadoPor){
      filters.push(`fields/Reportadopor ge '${EnviadoPor}'`)
    }

    if(cargo){ 
      filters.push(`fields/Cargo ge '${cargo}'`)
    }

    if(empresa){
      filters.push(`fields/Empresaalaquepertenece ge '${empresa}'`)
    }

    if(ciudad){
      filters.push(`fields/Ciudad ge '${ciudad}'`)
    }

   const buildedFilter = filters.join(" and ")
    try {
      const { items, nextLink } = await CesacionesSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
      setRows(items);
      setNextLink(nextLink ?? null);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [CesacionesSvc]);

  const searchRegister = async (query: string): Promise<Cesacion | null> => {
    const resp = await CesacionesSvc.getAll({filter: `fields/Title eq '${query}'`, top: 1, orderby: "fields/Created desc"});

    if(resp.items.length > 0) {
      const retorno = resp.items[0]
      return retorno
    } else {
      return null
    }
  }

  const handleCancelProcessbyId = React.useCallback(async (Id: string, RazonCancelacion: string) => {

    try{
      const proceso = await CesacionesSvc.get(Id)

      if(proceso){
        await CesacionesSvc.update(Id, {CanceladoPor: account?.name, Estado: "Cancelado", RazonCancelacion})
        alert("Se ha cancelado este proceso con éxito")
        reloadAll()
      }
    } catch {
      throw new Error("Ha ocurrido un error cancelando el proceso");
    }
}, [CesacionesSvc]);

  const handleReactivateProcessById = React.useCallback(async (Id: string) => {

    try{
      const proceso = await CesacionesSvc.get(Id)

      if(proceso){
        await CesacionesSvc.update(Id, {Estado: "En proceso",})
        alert("Se ha reactivado este proceso con éxito")
        reloadAll()
      }
    } catch {
      throw new Error("Ha ocurrido un error reactivando el proceso");
    }
}, [CesacionesSvc]);



  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, errors, sorts, state, workers, workersOptions, estado,
    setState, handleReactivateProcessById, handleCancelProcessbyId, setEstado, nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, setField, handleSubmit, searchRegister, handleEdit, searchWorker, loadToReport, cleanState, loadFirstPage, 
  };
}

 