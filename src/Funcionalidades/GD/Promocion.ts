import React from "react";
import type { DateRange, GetAllOpts, rsOption, SortDir, SortField, } from "../../models/Commons";
import { normalize, normalizeDate, toGraphDateTime, toISODateFlex } from "../../utils/Date";
import type { PromocionesService } from "../../Services/Promociones.service";
import type { Promocion, PromocionErrors } from "../../models/Promociones";
import { useAuth } from "../../auth/authProvider";
import { useDebouncedValue } from "./Contratos";
import { norm } from "../../utils/text";

function includesSearch(row: Promocion, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.NumeroDoc).includes(qq) ||
    norm(row.NombreSeleccionado).includes(qq) ||
    norm(row.Cargo).includes(qq) 
  );
}

function compareRows(a: Promocion, b: Promocion, field: SortField, dir: SortDir) {
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

  const get = (r: Promocion) => {
    switch (field) {
      case "Cedula":
        return norm(r.NumeroDoc);
      case "Nombre":
        return norm(r.NombreSeleccionado);
      case "Salario":
        return norm(r.Salario);
      case "promocion":
        return toTime(r.FechaIngreso);
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}

export function usePromocion(PromocionesSvc: PromocionesService) {
  const [baseRows, setBaseRows] = React.useState<Promocion[]>([]);
  const [rows, setRows] = React.useState<Promocion[]>([]);
  const [workers, setWorkers] = React.useState<Promocion[]>([]);
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
  const [state, setState] = React.useState<Promocion>({
    AbreviacionTipoDoc: "",
    Adicionales: "",
    Autonomia: "",
    AuxilioRodamiento: "",
    AuxilioRodamientoLetras: "",
    AuxilioTexto: "",
    AuxilioValor: "",
    CargoCritico: "No",    
    CargueNuevoEquipoTrabajo: "No",    
    CentroOperativo: "",
    Ciudad: "",
    CodigoCentroCostos: "",
    ContribucionaLaEstrategia: "",
    Departamento: "",
    Dependencia: "",
    DescripcionCentroCostos: "",
    DescripcionCentroOperativo: "",
    Email: "",
    EmpresaSolicitante: "",
    EspecificidadCargo: "",
    EstadoProceso: "",
    FechaAjusteAcademico: null,
    FechaIngreso: null,
    CargoPersonaReporta: "",
    FechaValoracionPotencial: null,
    Garantizado_x00bf_SiNo_x003f_: "No",
    GarantizadoLetras: "",
    GrupoCVE: "",
    HerramientasColaborador: "",
    IDUnidadNegocio: "",
    ImpactoClienteExterno: "",
    InformacionEnviadaPor: account?.name ?? "",
    ModalidadTeletrabajo: "",
    NivelCargo: "",
    NombreSeleccionado: "",
    NumeroDoc: "",
    PersonasCargo: "No",
    PresupuestoVentasMagnitudEconomi: "",
    Promedio: "",
    ResultadoValoracion: "",
    Salario: "",
    SalarioAjustado: "",
    SalarioTexto: "",
    StatusIngreso: "",
    TipoContrato: "",
    TipoDoc: "",
    TipoNomina: "",
    TipoVacante: "",
    Title: "",
    UnidadNegocio: "",
    ValorGarantizado: "",
    AjusteSioNo: false,
    AuxilioRodamientoSioNo: false,
    Cargo: "",
    Correo: "",
    PerteneceModelo: false,
    Estado: "En proceso",
    CanceladoPor: "",
    razonCancelacion: ""
  });
  const [estado, setEstado] = React.useState<string>("En proceso");
  const [errors, setErrors] = React.useState<PromocionErrors>({});
  const setField = <K extends keyof Promocion>(k: K, v: Promocion[K]) => setState((s) => ({ ...s, [k]: v }));
  const debouncedSearch = useDebouncedValue(search, 250);
  
 const buildServerFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/FechaIngreso ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/FechaIngreso le '${range.to}T23:59:59Z'`);
    }

    const e = estado?.trim().toLowerCase();

    if (e && e !== "all" && e !== "todos") {
      filters.push(`fields/Estado eq '${estado}'`);
    }

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby: "fields/Created desc",
      top: 2000,
    };
  }, [range.from, range.to, estado]);

  const loadBase = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const { items } = await PromocionesSvc.getAll(buildServerFilter());
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
  }, [account?.username, PromocionesSvc, buildServerFilter]);

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
      const { items, nextLink: n2 } = await PromocionesSvc.getByNextLink(nextLink);
      setRows(items);              
      setNextLink(n2 ?? null);    
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, PromocionesSvc]);

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
    const e: PromocionErrors = {};
    if(!state.EmpresaSolicitante) e.EmpresaSolicitante = "Seleccione una empresa solicitante"
    if(!state.TipoDoc) e.TipoDoc = "Seleccione un tipo de documento"
    if(!state.NumeroDoc) e.NumeroDoc = "Ingrese el numero de identificación"
    if(!state.NombreSeleccionado) e.NombreSeleccionado = "Ingrese el nombre del seleccionado"
    if(!state.Correo) e.Correo = "Ingrese el correo del seleccionado"
    if(!state.FechaIngreso) e.FechaIngreso = "Ingrese la fecha de la promoción"
    if(!state.Cargo) e.Cargo = "Seleccione el nuevo cargo que ocupara"
    if(!state.Departamento) e.Departamento = "Seleccione un departamento"
    if(!state.Ciudad) e.Ciudad = "Seleccione una ciudad"
    if(!state.ModalidadTeletrabajo) e.ModalidadTeletrabajo = "Seleccione una modalidad de trabajo"
    if(!state.Salario) e.Salario = "Ingrese el salario"
    if(state.AjusteSioNo && !state.SalarioAjustado) e.SalarioAjustado = "Ingrese el porcentaje con el que se ajustara"
    if(state.Garantizado_x00bf_SiNo_x003f_.toLocaleLowerCase() === "si" && !state.ValorGarantizado) e.ValorGarantizado = "Ingrese el porcentaje del garantizado"
    if(state.AuxilioRodamientoSioNo && !state.AuxilioRodamiento) e.AuxilioRodamiento = "Ingrese el auxilio de rodamiento"
    if(!state.NivelCargo) e.NivelCargo = "Seleccione el nivel de cargo"
    if(!state.Dependencia) e.Dependencia = "Seleccione la dependencia"
    if(!state.DescripcionCentroCostos) e.DescripcionCentroCostos = "Seleccione un CC"
    if(!state.DescripcionCentroOperativo) e.DescripcionCentroOperativo = "Seleccione un CO"
    if(!state.UnidadNegocio) e.UnidadNegocio = "Seleccione una UN"
    if(!state.TipoVacante) e.TipoVacante = "Seleccione un tipo de vacante"
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
      const payload: Promocion = {
        Adicionales: state.Adicionales,
        AjusteSioNo: state.AjusteSioNo,
        AbreviacionTipoDoc: state.AbreviacionTipoDoc,
        Autonomia: state.Autonomia,
        AuxilioRodamiento: String(state.AuxilioRodamiento),
        AuxilioRodamientoLetras: state.AuxilioRodamientoLetras,
        AuxilioRodamientoSioNo: state.AuxilioRodamientoSioNo,
        AuxilioTexto: state.AuxilioTexto,
        AuxilioValor: state.AuxilioValor,
        Cargo: state.Cargo,
        CargoCritico: state.CargoCritico,
        CargoPersonaReporta: state.CargoPersonaReporta,
        CargueNuevoEquipoTrabajo: state.CargueNuevoEquipoTrabajo,
        CentroOperativo: state.CentroOperativo,
        Ciudad: state.Ciudad,
        CodigoCentroCostos: state.CodigoCentroCostos,
        ContribucionaLaEstrategia: state.ContribucionaLaEstrategia,
        Departamento: state.Departamento, 
        Correo: state.Correo,
        Dependencia: state.Dependencia,
        DescripcionCentroCostos: state.DescripcionCentroCostos,
        DescripcionCentroOperativo: state.DescripcionCentroOperativo,
        Email: state.Email,
        EmpresaSolicitante: state.EmpresaSolicitante,
        EspecificidadCargo: state.EspecificidadCargo,
        EstadoProceso: state.EstadoProceso,
        FechaAjusteAcademico: toGraphDateTime(state.FechaAjusteAcademico) ?? null,
        FechaIngreso: toGraphDateTime(state.FechaIngreso) ?? null,
        FechaValoracionPotencial: toGraphDateTime(state.FechaValoracionPotencial) ?? null,
        Garantizado_x00bf_SiNo_x003f_: state.Garantizado_x00bf_SiNo_x003f_,        
        GarantizadoLetras: state.GarantizadoLetras,
        GrupoCVE: state.GrupoCVE,
        HerramientasColaborador: state.HerramientasColaborador,
        IDUnidadNegocio: state.IDUnidadNegocio,
        ImpactoClienteExterno: state.ImpactoClienteExterno,
        InformacionEnviadaPor: state.InformacionEnviadaPor,
        NombreSeleccionado: state.NombreSeleccionado,
        ModalidadTeletrabajo: state.ModalidadTeletrabajo,
        NivelCargo: state.NivelCargo,
        NumeroDoc: state.NumeroDoc,
        PersonasCargo: state.PersonasCargo,
        PresupuestoVentasMagnitudEconomi: state.PresupuestoVentasMagnitudEconomi,
        Promedio: state.Promedio,
        ResultadoValoracion: String(state.ResultadoValoracion),
        Salario: String(state.Salario),
        SalarioAjustado: state.SalarioAjustado,
        SalarioTexto: state.SalarioTexto,
        StatusIngreso: state.StatusIngreso,
        TipoContrato: state.TipoContrato,
        TipoDoc: state.TipoDoc,
        TipoNomina: state.TipoNomina,
        TipoVacante: state.TipoVacante,
        Title: state.Title,
        UnidadNegocio: state.UnidadNegocio ?? "",
        ValorGarantizado: state.ValorGarantizado,
        PerteneceModelo: state.PerteneceModelo,
        Estado: "En proceso",
        CanceladoPor: state.CanceladoPor,
        razonCancelacion: state.razonCancelacion
      };
      const created = await PromocionesSvc.create(payload);
      alert("Se ha creado el registro con éxito")
      return {
        created: created.Id!,
        ok: true
      }
    } finally {
        setLoading(false);
      }
  };

  const fields: (keyof Promocion)[] = [
    "Title", "Cargo", "CargoPersonaReporta", "EmpresaSolicitante", "TipoDoc", "AbreviacionTipoDoc", "NumeroDoc", "Email", "Ciudad", "EspecificidadCargo", "NivelCargo", 
    "CargoCritico", "Dependencia", "CodigoCentroCostos", "DescripcionCentroCostos", "CentroOperativo", "DescripcionCentroOperativo", "UnidadNegocio", "PersonasCargo", 
    "TipoContrato", "TipoVacante", "ModalidadTeletrabajo", "StatusIngreso", "Salario", "SalarioTexto", "SalarioAjustado", "Adicionales", "Garantizado_x00bf_SiNo_x003f_",
    "PresupuestoVentasMagnitudEconomi", "AuxilioValor", "AuxilioTexto", "Autonomia", "ImpactoClienteExterno", "ContribucionaLaEstrategia", "ValorGarantizado", "Promedio", 
    "GrupoCVE", "HerramientasColaborador", "CargueNuevoEquipoTrabajo", "IDUnidadNegocio", "GarantizadoLetras", "AuxilioRodamiento", "AuxilioRodamientoLetras", "Departamento", 
    "NombreSeleccionado", "TipoNomina", "EstadoProceso", "ResultadoValoracion", "Correo", "AjusteSioNo", "AuxilioRodamientoSioNo", "PerteneceModelo",];

  const dateFields: (keyof Promocion)[] = [
    "FechaAjusteAcademico","FechaValoracionPotencial","FechaIngreso",
  ];

  const buildPatch = (original: Promocion, next: Promocion) => {
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

  const handleEdit = async (e: React.FormEvent, CesacionSeleccionada: Promocion) => {
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

      await PromocionesSvc.update(CesacionSeleccionada.Id, payload);
      alert("Se ha actualizado el registro con éxito");
    } catch {
      alert("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<Promocion[]> => {
    const resp = await PromocionesSvc.getAll({
      filter: `fields/NumeroDoc eq '${query}'`, // si NumeroDoc es texto
      top: 200,
    });

    const workers: Promocion[] = resp.items ?? [];
    setWorkers(workers);

    const seen = new Set<string>();

    const next: rsOption[] = workers
      .map(item => ({
        value: item.Id!, // solo el Id
        label: `Nombre: ${item.NombreSeleccionado} - Promocion - Cargo: ${item.Cargo} - Fecha de ingreso: ${toISODateFlex(item.FechaIngreso)}.`,
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
      filters.push(`fields/EmpresaSolicitante ge '${empresa}'`)
    }

    if(ciudad){
      filters.push(`fields/Ciudad ge '${ciudad}'`)
    }

   const buildedFilter = filters.join(" and ")
    try {
      const { items, nextLink } = await PromocionesSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
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
  }, [PromocionesSvc]);

  const searchRegister = async (query: string): Promise<Promocion | null> => {
    const resp = await PromocionesSvc.getAll({filter: `fields/NumeroDoc eq '${query}'`, top: 200, orderby: "fields/Created desc"});

    if(resp.items.length > 0) {
      const retorno = resp.items[0]
      return retorno
    } else {
      return null
    }
  }

  const handleCancelProcessbyId = React.useCallback(async (Id: string, RazonCancelacion: string) => {

    try{
      const proceso = await PromocionesSvc.get(Id)

      if(proceso){
        await PromocionesSvc.update(Id, {CanceladoPor: account?.name, Estado: "Cancelado", razonCancelacion: RazonCancelacion})
        alert("Se ha cancelado este proceso con éxito")
        reloadAll()
      }
    } catch {
      throw new Error("Ha ocurrido un error cancelando el proceso");
    }
}, [PromocionesSvc]);

  const handleReactivateProcessById = React.useCallback(async (Id: string) => {

    try{
      const proceso = await PromocionesSvc.get(Id)

      if(proceso){
        await PromocionesSvc.update(Id, {Estado: "En proceso",})
        alert("Se ha reactivado este proceso con éxito")
        reloadAll()
      }
    } catch {
      throw new Error("Ha ocurrido un error reactivando el proceso");
    }
}, [PromocionesSvc]);

  return {
    errors, setState, rows, loading, error, pageSize, pageIndex, hasNext, range, search, sorts, state, workers, workersOptions, estado,
    handleReactivateProcessById, handleCancelProcessbyId, setEstado, nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, handleEdit, handleSubmit, setField, searchWorker, loadToReport, loadFirstPage, searchRegister
  };
}
