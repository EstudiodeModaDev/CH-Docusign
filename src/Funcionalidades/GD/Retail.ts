import React from "react";
import type { DateRange, GetAllOpts, rsOption, SortDir, SortField, } from "../../models/Commons";
import { toGraphDateTime, toISODateFlex } from "../../utils/Date";
import { useAuth } from "../../auth/authProvider";
import type { RetailService } from "../../Services/Retail.service";
import type { Retail, RetailErrors } from "../../models/Retail";
import type { RetailCanceladosService } from "../../Services/RetailCancelado.service";
import type { CesacionCancelada } from "../../models/Cesaciones";
import { useDebouncedValue } from "./Contratos";
import { norm } from "../../utils/text";

function includesSearch(row: Retail, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Title).includes(qq) ||
    norm(row.Nombre).includes(qq) ||
    norm(row.Cargo).includes(qq) 
  );
}

function compareRows(a: Retail, b: Retail, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const get = (r: Retail) => {
    switch (field) {
      case "Cedula":
        return norm(r.Title);
      case "Nombre":
        return norm(r.Nombre);
      case "inicio":
        return norm(r.FechaIngreso ?? "");
      case "salario":
        return norm(r.Salario ?? "");
      case "id":
      default:
        // tu tabla usa id como Created (según sortFieldToOData anterior)
        return norm(r.Title ?? r.Title ?? "");
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}

export function useRetail(RetailSvc: RetailService, retailCanceladosSvc?: RetailCanceladosService) {
  const [baseRows, setBaseRows] = React.useState<Retail[]>([]);
  const [rows, setRows] = React.useState<Retail[]>([]);
  const [workers, setWorkers] = React.useState<Retail[]>([]);
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
  const [state, setState] = React.useState<Retail>({
    Autonomia: '',
    Auxiliodetransporte: '',
    Auxiliotransporteletras: '',
    Cargo: '',
    CentroCostos: '',
    Ciudad: '',
    CodigoCentroCostos: '',
    CodigoCentroOperativo: '',
    CorreoElectronico: '',
    Celular: "",
    CentroOperativo: "",
    CodigoUnidadNegocio: "",
    Contribucion: "",
    Departamento: "",
    Depedencia: "",
    Empresaalaquepertenece: "",
    FechaIngreso: null,
    GrupoCVE: "",
    Estado: "En proceso",
    FechaReporte: new Date().toISOString() ?? "",
    Impacto: "",
    InformacionEnviadaPor: account?.name ?? "",
    NivelCargo: "",
    Nombre: "",
    PerteneceModelo: false,
    Presupuesto: "",
    Promedio: "",
    Salario: "",
    SalarioLetras: "",
    Title: "",
    TipoDoc: "",
    UnidadNegocio: "",
    OrigenSeleccion: "",
    Temporal: ""
  });
  const [estado, setEstado] = React.useState<string>("proceso");
  const [errors, setErrors] = React.useState<RetailErrors>({});
  const setField = <K extends keyof Retail>(k: K, v: Retail[K]) => setState((s) => ({ ...s, [k]: v }));
  const debouncedSearch = useDebouncedValue(search, 250);
  
 const buildServerFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/FechaIngreso ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/FechaIngreso le '${range.to}T23:59:59Z'`);
    }

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby: "fields/Created desc",
      top: 2000,
    };
  }, [range.from, range.to]);

  const loadBase = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const { items } = await RetailSvc.getAll(buildServerFilter());
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
  }, [account?.username, RetailSvc, buildServerFilter]);

  // Traer de Graph SOLO cuando cambie estado/rango (o cuando auth esté listo)
  React.useEffect(() => {
    loadBase();
  }, [loadBase, range.from, range.to, pageSize]);

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
      const { items, nextLink: n2 } = await RetailSvc.getByNextLink(nextLink);
      setRows(items);              
      setNextLink(n2 ?? null);    
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, RetailSvc]);

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
    const e: RetailErrors = {};
    if(!state.Empresaalaquepertenece) e.Empresaalaquepertenece = "Seleccione una empresa solicitante"
    if(!state.TipoDoc) e.TipoDoc = "Seleccione un tipo de documento"
    if(!state.Title) e.Title = "Ingrese el numero de identificación"
    if(!state.Nombre) e.Nombre = "Ingrese el nombre del seleccionado"
    if(!state.CorreoElectronico) e.CorreoElectronico = "Ingrese el correo del seleccionado"
    if(!state.FechaIngreso) e.FechaIngreso = "Ingrese la fecha de la promoción"
    if(!state.Cargo) e.Cargo = "Seleccione el nuevo cargo que ocupara"
    if(!state.Departamento) e.Departamento = "Seleccione un departamento"
    if(!state.Ciudad) e.Ciudad = "Seleccione una ciudad"
    if(!state.Salario) e.Salario = "Ingrese el salario"
    if(!state.NivelCargo) e.NivelCargo = "Seleccione el nivel de cargo"
    if(!state.Depedencia) e.Depedencia = "Seleccione la dependencia"
    if(!state.CentroCostos) e.CentroCostos = "Seleccione un CC"
    if(!state.CentroOperativo) e.CentroOperativo = "Seleccione un CO"
    if(!state.UnidadNegocio) e.UnidadNegocio = "Seleccione una UN"
    if(!state.OrigenSeleccion) e.OrigenSeleccion = "Seleccione un tipo de vacante"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (): Promise<{created: string | null, ok: boolean}> => {
    if (!validate()) { 
      console.log(state)
      alert("Hay campos vacios")
      return{
        created: null,
        ok: false
      }
    };
    setLoading(true);
    try {
      const payload: Retail = {
        Title: state.Title,
        TipoDoc: state.TipoDoc,
        Autonomia: state.Autonomia,
        Auxiliodetransporte: state.Auxiliodetransporte,
        Auxiliotransporteletras: state.Auxiliotransporteletras.toUpperCase(),
        Cargo: state.Cargo,
        CentroCostos: state.CentroCostos,
        Ciudad: state.Ciudad,
        CodigoCentroCostos: state.CodigoCentroCostos,
        CodigoCentroOperativo: state.CodigoCentroOperativo,
        CorreoElectronico: state.CorreoElectronico,
        Celular: state.Celular,
        CentroOperativo: state.CentroOperativo,
        CodigoUnidadNegocio: state.CodigoUnidadNegocio,
        Contribucion: state.Contribucion,
        Departamento: state.Departamento,
        Depedencia: state.Depedencia,
        Empresaalaquepertenece: state.Empresaalaquepertenece,
        FechaIngreso: toISODateFlex(state.FechaIngreso),
        GrupoCVE: state.GrupoCVE,
        Impacto: state.Impacto,
        InformacionEnviadaPor: state.InformacionEnviadaPor,
        Nombre: state.Nombre,
        PerteneceModelo: state.PerteneceModelo,
        Presupuesto: state.Presupuesto,
        Promedio: state.Promedio,
        Salario: state.Salario,
        SalarioLetras: state.SalarioLetras,
        OrigenSeleccion: state.OrigenSeleccion,
        FechaReporte: state.FechaReporte,
        Estado: state.Estado,
        NivelCargo: state.NivelCargo,
        Temporal: state.Temporal,
        UnidadNegocio: state.UnidadNegocio
    };
      const created = await RetailSvc.create(payload);
      alert("Se ha creado el registro con éxito")
      return {
        created: created.Id!,
        ok: true
      }
    } finally {
        setLoading(false);
      }
  };

  const handleEdit = async (e: React.FormEvent, RetailSeleccionado: Retail) => {
    e.preventDefault();
    if (!validate()) { 
      console.log("Hay un campo sin rellenar")
      return};
    setLoading(true);
    try {  
      const payload: Retail = {
        Autonomia: RetailSeleccionado.Autonomia !== state.Autonomia ? state.Autonomia : RetailSeleccionado.Autonomia,
        Auxiliodetransporte: RetailSeleccionado.Auxiliodetransporte !== state.Auxiliodetransporte ? state.Auxiliodetransporte : RetailSeleccionado.Auxiliodetransporte,
        Auxiliotransporteletras: RetailSeleccionado.Auxiliotransporteletras !== state.Auxiliotransporteletras ? state.Auxiliotransporteletras : RetailSeleccionado.Auxiliotransporteletras,
        Cargo: RetailSeleccionado.Cargo !== state.Cargo ? state.Cargo : RetailSeleccionado.Cargo,
        Celular: RetailSeleccionado.Celular !== state.Celular ? String(state.Celular) : String(RetailSeleccionado.Celular),
        CentroCostos: RetailSeleccionado.CentroCostos !== state.CentroCostos ? state.CentroCostos : RetailSeleccionado.CentroCostos,
        CentroOperativo: RetailSeleccionado.CentroOperativo !== state.CentroOperativo ? state.CentroOperativo : RetailSeleccionado.CentroOperativo,
        Ciudad: RetailSeleccionado.Ciudad !== state.Ciudad ? state.Ciudad : RetailSeleccionado.Ciudad,
        CodigoCentroCostos: RetailSeleccionado.CodigoCentroCostos !== state.CodigoCentroCostos ? state.CodigoCentroCostos : RetailSeleccionado.CodigoCentroCostos,
        CodigoCentroOperativo: RetailSeleccionado.CodigoCentroOperativo !== state.CodigoCentroOperativo ? state.Cargo : RetailSeleccionado.Cargo,
        CodigoUnidadNegocio: RetailSeleccionado.CodigoUnidadNegocio !== state.CodigoUnidadNegocio ? state.CodigoUnidadNegocio : RetailSeleccionado.CodigoUnidadNegocio,
        Contribucion: RetailSeleccionado.Contribucion !== state.Contribucion ? state.Contribucion : RetailSeleccionado.Contribucion,
        CorreoElectronico: RetailSeleccionado.CorreoElectronico !== state.CorreoElectronico ? state.CorreoElectronico : RetailSeleccionado.CorreoElectronico,
        Departamento: RetailSeleccionado.Departamento !== state.Departamento ? state.Departamento : RetailSeleccionado.Departamento,
        Depedencia: RetailSeleccionado.Depedencia !== state.Depedencia ? state.Depedencia : RetailSeleccionado.Depedencia,
        Empresaalaquepertenece: RetailSeleccionado.Empresaalaquepertenece !== state.Empresaalaquepertenece ? state.Empresaalaquepertenece : RetailSeleccionado.Empresaalaquepertenece,
        Estado: RetailSeleccionado.Estado !== state.Estado ? state.Estado : RetailSeleccionado.Estado,
        PerteneceModelo: RetailSeleccionado.PerteneceModelo !== state.PerteneceModelo ? state.PerteneceModelo : RetailSeleccionado.PerteneceModelo,
        GrupoCVE: RetailSeleccionado.GrupoCVE !== state.GrupoCVE ? state.GrupoCVE : RetailSeleccionado.GrupoCVE,
        Impacto: RetailSeleccionado.Impacto !== state.Impacto ? state.Impacto : RetailSeleccionado.Impacto,
        InformacionEnviadaPor: RetailSeleccionado.InformacionEnviadaPor !== state.InformacionEnviadaPor ? state.InformacionEnviadaPor : RetailSeleccionado.InformacionEnviadaPor,
        NivelCargo: RetailSeleccionado.NivelCargo !== state.NivelCargo ? state.NivelCargo : RetailSeleccionado.NivelCargo,
        Nombre: RetailSeleccionado.Nombre !== state.Nombre ? state.Nombre : RetailSeleccionado.Nombre,
        OrigenSeleccion: RetailSeleccionado.OrigenSeleccion !== state.OrigenSeleccion ? state.OrigenSeleccion : RetailSeleccionado.OrigenSeleccion,
        Presupuesto: RetailSeleccionado.Presupuesto !== state.Presupuesto ? state.Presupuesto : RetailSeleccionado.Presupuesto,
        FechaIngreso: toGraphDateTime(RetailSeleccionado.FechaIngreso) !== toGraphDateTime(state.FechaIngreso) ? toGraphDateTime(state.FechaIngreso) ?? null : toGraphDateTime(RetailSeleccionado.FechaIngreso) ?? null,
        FechaReporte: toGraphDateTime(RetailSeleccionado.FechaReporte) !== toGraphDateTime(state.FechaReporte) ? toGraphDateTime(state.FechaReporte) ?? null : toGraphDateTime(RetailSeleccionado.FechaReporte) ?? null,
        Promedio: RetailSeleccionado.Promedio !== state.Promedio ? state.Promedio : RetailSeleccionado.Promedio,
        Salario: RetailSeleccionado.Salario !== state.Salario ? state.Salario : RetailSeleccionado.Salario,
        SalarioLetras: RetailSeleccionado.SalarioLetras !== state.SalarioLetras ? state.SalarioLetras : RetailSeleccionado.SalarioLetras,
        Temporal: RetailSeleccionado.Temporal !== state.Temporal ? state.Temporal : RetailSeleccionado.Temporal,
        TipoDoc: RetailSeleccionado.TipoDoc !== state.TipoDoc ? state.TipoDoc : RetailSeleccionado.TipoDoc,
        Title: RetailSeleccionado.Title !== state.Title ? state.Title : RetailSeleccionado.Title,
        UnidadNegocio: RetailSeleccionado.UnidadNegocio !== state.UnidadNegocio ? state.UnidadNegocio : RetailSeleccionado.UnidadNegocio,
      };
      await RetailSvc.update(RetailSeleccionado.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
    } finally {
        setLoading(false);
      }
  };

  const searchWorker = async (query: string): Promise<Retail[]> => {
    const resp = await RetailSvc.getAll({
      filter: `fields/Title eq '${query}'`, // si NumeroDoc es texto
      top: 200,
    });

    const workers: Retail[] = resp.items ?? [];
    setWorkers(workers);

    const seen = new Set<string>();

    const next: rsOption[] = workers
      .map(item => ({
        value: item.Id!, // solo el Id
        label: `Nombre: ${item.Nombre} - Promocion - Cargo: ${item.Cargo} - Fecha de ingreso: ${toISODateFlex(item.FechaIngreso)}.`,
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
    filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

    if(EnviadoPor){
      filters.push(`fields/InformacionEnviadaPor ge '${EnviadoPor}'`)
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
      const { items, nextLink } = await RetailSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
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
  }, [RetailSvc]);

  const searchRegister = async (query: string): Promise<Retail | null> => {
    const resp = await RetailSvc.getAll({filter: `fields/Title eq '${query}'`, top: 200, orderby: "fields/Created desc"});

    if(resp.items.length > 0) {
      const retorno = resp.items[0]
      return retorno
    } else {
      return null
    }
  }

  
  const handleCancelProcessbyId = React.useCallback(async (Id: string, RazonCancelacion: string) => {
    if(!retailCanceladosSvc) return

    try{
      const proceso = await RetailSvc.get(Id)

      if(proceso){
        const paylod: CesacionCancelada = {
          Ciudad: proceso.Ciudad,
          Correo: proceso.CorreoElectronico,
          Empresaquesolicito: proceso.Empresaalaquepertenece,
          Informacionenviadapor: proceso.InformacionEnviadaPor,
          Nombre: proceso.Nombre,
          Numeroidentificacion: proceso.Title,
          Procesocanceladopor: account?.name ?? "",
          RazonCancelacion:  RazonCancelacion,
          TipoDocumento: proceso.TipoDoc,
          Title: proceso.Title
        }
        await retailCanceladosSvc.create(paylod)
        await RetailSvc.delete(proceso.Id ?? "")
        alert("Se ha cancelado este proceso con éxito")
      }
    } catch {
      throw new Error("Ha ocurrido un error cancelando el proceso");
    }
  }, [RetailSvc]);

  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, sorts, state, errors, workers, workersOptions, estado,
    handleCancelProcessbyId, setEstado, nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, handleEdit, handleSubmit, setField, searchWorker, loadToReport, loadFirstPage, searchRegister
  };
}

export function useRetailCancelados(retailCanceladosSvc: RetailCanceladosService) {
  const [rows, setRows] = React.useState<CesacionCancelada[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("proceso");
  
  // construir filtro OData
  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if(search){
        filters.push(`(startswith(fields/Nombre, '${search}') or startswith(fields/Title, '${search}'))`)
    }

    if (range.from && range.to && (range.from < range.to)) {
      if (range.from) filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
      if (range.to)   filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
    }

    const orderParts: string[] = sorts
      .map(s => {
        const col = sortFieldToOData[s.field];
        return col ? `${col} ${s.dir}` : '';
      })
      .filter(Boolean);

    // Estabilidad de orden: si no incluiste 'id', agrega 'id desc' como desempate.
    if (!sorts.some(s => s.field === 'id')) {
      orderParts.push('ID desc');
    }
    return {
      filter: filters.join(" and "),
      orderby: orderParts.join(","),
      top: pageSize,
    };
  }, [range.from, range.to, pageSize, sorts, search, estado] ); 
 
  const loadFirstPage = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { items, nextLink } = await retailCanceladosSvc.getAll(buildFilter()); // debe devolver {items,nextLink}
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
  }, [retailCanceladosSvc, buildFilter, sorts]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, range, search]);

  // siguiente página: seguir el nextLink tal cual
  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await retailCanceladosSvc.getByNextLink(nextLink);
      setRows(items);              // 👈 reemplaza la página visible
      setNextLink(n2 ?? null);     // null si no hay más
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, retailCanceladosSvc]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  const sortFieldToOData: Record<SortField, string> = {
    id: 'fields/Created',
    Cedula: 'fields/Numero_x0020_identificaci_x00f3_',
    Nombre: 'fields/NombreSeleccionado',
    inicio: 'fields/FECHA_x0020_REQUERIDA_x0020_PARA0',
  };

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





  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, sorts, estado,
    nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, loadFirstPage, setEstado
  };
}