import React from "react";
import type { DateRange, GetAllOpts, rsOption, SortDir, SortField, } from "../models/Commons";
import { toISODateFlex, toISODateTimeFlex } from "../utils/Date";
//import { useAuth } from "../auth/authProvider";
import type { CesacionesService } from "../Services/Cesaciones.service";
import type { Cesacion, CesacionErrors } from "../models/Cesaciones";
import { useAuth } from "../auth/authProvider";

export function useCesaciones(CesacionesSvc: CesacionesService) {
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
    FechaIngresoCesacion: null,
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
    Promedio: ""
  });
  const [errors, setErrors] = React.useState<CesacionErrors>({});
  const setField = <K extends keyof Cesacion>(k: K, v: Cesacion[K]) => setState((s) => ({ ...s, [k]: v }));
  
  // construir filtro OData
  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if(search){
        filters.push(`(startswith(fields/Nombre, '${search}') or startswith(fields/Title, '${search}') or startswith(fields/Cargo, '${search}'))`)
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
  }, [range.from, range.to, pageSize, sorts, search,]); 

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { items, nextLink } = await CesacionesSvc.getAll(buildFilter());
      setRows(items);
      setNextLink(nextLink ?? null);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando cesaciones registradas");
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [CesacionesSvc, buildFilter, sorts]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, range, search]);

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

  const sortFieldToOData: Record<SortField, string> = {
    id: 'fields/Created',
    Cedula: 'fields/Title',
    Nombre: 'fields/Nombre',
    Cargo: 'fields/Cargo',
    Tienda: 'fields/Tienda',
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

  const validate = () => {
    const e: CesacionErrors = {};
    if(!state.Cargo) e.Cargo = "Seleccione un cargo"
    if(!state.Empresaalaquepertenece) e.Empresaalaquepertenece = "Seleccione una empresa"
    if(!state.TipoDoc) e.TipoDoc = "Seleccione un tipo de documento"
    if(!state.FechaIngreso) e.FechaIngreso = "Seleccione una fecha de ingreso"
    if(!state.FechaSalidaCesacion) e.FechaSalidaCesacion = "Seleccione una fecha salida cesacion"
    if(!state.FechaIngresoCesacion) e.FechaIngresoCesacion = "Seleccione una fecha ingreso cesacion"
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
      FechaIngresoCesacion: null,
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
      Promedio: ""
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
        FechaIngreso: toISODateFlex(state.FechaIngreso) ?? null,
        FechaIngresoCesacion: toISODateFlex(state.FechaIngresoCesacion) ?? null,
        FechaLimiteDocumentos: toISODateFlex(state.FechaLimiteDocumentos) ?? null,
        FechaSalidaCesacion: toISODateFlex(state.FechaSalidaCesacion) ?? null,
        Jefedezona: state.Jefedezona,
        Nombre: state.Nombre,
        Temporal: state.Temporal,
        Tienda: state.Tienda,
        Title: state.Title,
        Reportadopor: state.Reportadopor,
        Empresaalaquepertenece: state.Empresaalaquepertenece,
        Fechaenlaquesereporta: state.Fechaenlaquesereporta,
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
        Salario: state.Salario,
        SalarioTexto: state.SalarioTexto,
        auxConectividadTexto: state.auxConectividadTexto,
        auxConectividadValor: state.auxConectividadValor,
        Pertenecealmodelo: state.Pertenecealmodelo,
        GrupoCVE: state.GrupoCVE,
        PresupuestaVentas: state.PresupuestaVentas,
        Autonomia: state.Autonomia,
        ImpactoCliente: state.ImpactoCliente,
        contribucionEstrategia: state.contribucionEstrategia,
        Promedio: state.Promedio
      };
      const creado = await CesacionesSvc.create(payload);
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

  const handleEdit = async (e: React.FormEvent, CesacionSeleccionada: Cesacion) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {  
      const payload:Cesacion = {
        Cargo: CesacionSeleccionada.Cargo !== state.Cargo ? state.Cargo : CesacionSeleccionada.Cargo,
        Celular: CesacionSeleccionada.Celular !== state.Celular ? state.Celular : CesacionSeleccionada.Celular,
        Correoelectronico: CesacionSeleccionada.Correoelectronico !== state.Correoelectronico ? state.Correoelectronico : CesacionSeleccionada.Correoelectronico,
        FechaIngreso: toISODateFlex(CesacionSeleccionada.FechaIngreso) !== toISODateFlex(state.FechaIngreso) ? toISODateFlex(state.FechaIngreso) ?? null : toISODateFlex(CesacionSeleccionada.FechaIngreso) ?? null,
        FechaIngresoCesacion: toISODateFlex(CesacionSeleccionada.FechaIngresoCesacion) !== toISODateFlex(state.FechaIngresoCesacion) ? toISODateFlex(state.FechaIngresoCesacion) ?? null : toISODateFlex(CesacionSeleccionada.FechaIngresoCesacion) ?? null,
        FechaLimiteDocumentos: toISODateFlex(CesacionSeleccionada.FechaLimiteDocumentos) !== toISODateFlex(state.FechaLimiteDocumentos) ? toISODateFlex(state.FechaLimiteDocumentos) ?? null : toISODateFlex(CesacionSeleccionada.FechaLimiteDocumentos) ?? null,
        FechaSalidaCesacion: toISODateFlex(CesacionSeleccionada.FechaSalidaCesacion) !== toISODateFlex(state.FechaSalidaCesacion) ? toISODateFlex(state.FechaSalidaCesacion) ?? null : toISODateFlex(CesacionSeleccionada.FechaSalidaCesacion) ?? null,
        Jefedezona: CesacionSeleccionada.Jefedezona !== state.Jefedezona ? state.Jefedezona : CesacionSeleccionada.Jefedezona,
        Nombre: CesacionSeleccionada.Nombre !== state.Nombre ? state.Nombre : CesacionSeleccionada.Nombre,
        Temporal: CesacionSeleccionada.Temporal !== state.Temporal ? state.Temporal : CesacionSeleccionada.Temporal,
        Tienda: CesacionSeleccionada.Tienda !== state.Tienda ? state.Tienda : CesacionSeleccionada.Tienda,
        Title: CesacionSeleccionada.Title !== state.Title ? state.Title : CesacionSeleccionada.Title,
        Reportadopor: CesacionSeleccionada.Reportadopor !== state.Reportadopor ? state.Reportadopor : CesacionSeleccionada.Reportadopor,
        Empresaalaquepertenece: CesacionSeleccionada.Empresaalaquepertenece !== state.Empresaalaquepertenece ? state.Empresaalaquepertenece : CesacionSeleccionada.Empresaalaquepertenece,
        Fechaenlaquesereporta: CesacionSeleccionada.Fechaenlaquesereporta !== state.Fechaenlaquesereporta ? state.Fechaenlaquesereporta : CesacionSeleccionada.Fechaenlaquesereporta,
        TipoDoc: CesacionSeleccionada.TipoDoc !== state.TipoDoc ? state.TipoDoc : CesacionSeleccionada.TipoDoc,
        Departamento: CesacionSeleccionada.Departamento !== state.Departamento ? state.Departamento : CesacionSeleccionada.Departamento,
        Ciudad: CesacionSeleccionada.Ciudad !== state.Ciudad ? state.Ciudad : CesacionSeleccionada.Ciudad,
        Niveldecargo: CesacionSeleccionada.Niveldecargo !== state.Niveldecargo ? state.Niveldecargo : CesacionSeleccionada.Niveldecargo,
        CargoCritico: CesacionSeleccionada.CargoCritico !== state.CargoCritico ? state.CargoCritico : CesacionSeleccionada.CargoCritico,
        Dependencia: CesacionSeleccionada.Dependencia !== state.Dependencia ? state.Dependencia : CesacionSeleccionada.Dependencia,
        CodigoCC: CesacionSeleccionada.CodigoCC !== state.CodigoCC ? state.CodigoCC : CesacionSeleccionada.CodigoCC,
        DescripcionCC: CesacionSeleccionada.DescripcionCC !== state.DescripcionCC ? state.DescripcionCC : CesacionSeleccionada.DescripcionCC, 
        CodigoCO: CesacionSeleccionada.CodigoCO !== state.CodigoCO ? state.CodigoCO : CesacionSeleccionada.CodigoCO, 
        DescripcionCO: CesacionSeleccionada.DescripcionCO !== state.DescripcionCO ? state.DescripcionCO : CesacionSeleccionada.DescripcionCO, 
        CodigoUN: CesacionSeleccionada.CodigoUN !== state.CodigoUN ? state.CodigoUN : CesacionSeleccionada.CodigoUN, 
        DescripcionUN: CesacionSeleccionada.DescripcionUN !== state.DescripcionUN ? state.DescripcionUN : CesacionSeleccionada.DescripcionUN, 
        Salario: CesacionSeleccionada.Salario !== state.Salario ? state.Salario : CesacionSeleccionada.Salario, 
        SalarioTexto: CesacionSeleccionada.SalarioTexto !== state.SalarioTexto ? state.SalarioTexto : CesacionSeleccionada.SalarioTexto, 
        auxConectividadTexto: CesacionSeleccionada.auxConectividadTexto !== state.auxConectividadTexto ? state.auxConectividadTexto : CesacionSeleccionada.auxConectividadTexto, 
        auxConectividadValor: CesacionSeleccionada.auxConectividadValor !== state.auxConectividadValor ? state.auxConectividadValor : CesacionSeleccionada.auxConectividadValor, 
        Pertenecealmodelo: CesacionSeleccionada.Pertenecealmodelo !== state.Pertenecealmodelo ? state.Pertenecealmodelo : CesacionSeleccionada.Pertenecealmodelo, 
        GrupoCVE: CesacionSeleccionada.GrupoCVE !== state.GrupoCVE ? state.GrupoCVE : CesacionSeleccionada.GrupoCVE,
        PresupuestaVentas: CesacionSeleccionada.PresupuestaVentas !== state.PresupuestaVentas ? state.PresupuestaVentas : CesacionSeleccionada.PresupuestaVentas,
        Autonomia: CesacionSeleccionada.Autonomia !== state.Autonomia ? state.Autonomia : CesacionSeleccionada.Autonomia,
        ImpactoCliente: CesacionSeleccionada.ImpactoCliente !== state.ImpactoCliente ? state.ImpactoCliente : CesacionSeleccionada.ImpactoCliente,
        contribucionEstrategia: CesacionSeleccionada.contribucionEstrategia !== state.contribucionEstrategia ? state.contribucionEstrategia : CesacionSeleccionada.contribucionEstrategia,
        Promedio: CesacionSeleccionada.Promedio !== state.Promedio ? state.Promedio : CesacionSeleccionada.Promedio,
      };
      await CesacionesSvc.update(CesacionSeleccionada.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
    } finally {
        setLoading(false);
      }
  };

  const searchWorker = async (query: string): Promise<Cesacion[]> => {
    const resp = await CesacionesSvc.getAll({
      filter: `fields/Numero_x0020_identificaci_x00f3_ eq '${query}'`,
      top: 200,
    });

    const workers: Cesacion[] = resp.items ?? [];
    setWorkers(workers);

    const seen = new Set<string>();

    const next: rsOption[] = workers
      .map(item => ({
        value: item.Id!, // solo el Id
        label: `Nombre: ${item.Nombre} - Promocion - Cargo: ${item.Cargo} - Fecha ingreso cesacion: ${toISODateTimeFlex(item.FechaIngresoCesacion)}.`,
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
      filters.push(`fields/Informaci_x00f3_n_x0020_enviada_ ge '${EnviadoPor}'`)
    }

    if(cargo){
      filters.push(`fields/CARGO ge '${cargo}'`)
    }

    if(empresa){
      filters.push(`fields/Empresa_x0020_que_x0020_solicita ge '${empresa}'`)
    }

    if(ciudad){
      filters.push(`fields/CIUDAD ge '${ciudad}'`)
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

  /*const handleCancelProcess = React.useCallback(async (documento: string, RazonCancelacion: string) => {
    if(!) return

    try{
      const procesosActivos = await ContratosSvc.getAll({filter: `fields/Numero_x0020_identificaci_x00f3_ eq '${documento}'`, orderby: "fields/Created desc", top: 1})

      if(procesosActivos.items.length > 0){
        const p = procesosActivos.items[0]
        const paylod: NovedadCancelada = {
          Barrio: p.BARRIO_x0020_,
          Cargoqueibaaocupar: p.CARGO,
          Celular: p.CELULAR_x0020_,
          Ciudad: p.CIUDAD,
          Correo: p.CORREO_x0020_ELECTRONICO_x0020_,
          Direcciondomicilio: p.DIRECCION_x0020_DE_x0020_DOMICIL,
          Empresaquesolicito: p.Empresa_x0020_que_x0020_solicita,
          Especificidaddelcargo: p.ESPECIFICIDAD_x0020_DEL_x0020_CA,
          Informacionenviadapor: p.Informaci_x00f3_n_x0020_enviada_,
          Nivelcargo: p.NIVEL_x0020_DE_x0020_CARGO,
          Nombre: p.NombreSeleccionado,
          Origendelaseleccion: p.ORIGEN_x0020_DE_x0020_LA_x0020_S,
          Numeroidentificacion: p.Numero_x0020_identificaci_x00f3_,
          Procesocanceladopor: account?.name ?? "",
          RazonCancelacion:  RazonCancelacion,
          TipoDocumento: p.tipodoc,
          Tipodocumentoabreviacion: p.Tipo_x0020_de_x0020_documento_x0,
          Title: p.Title
        }
        await novedadCanceladaSvc.create(paylod)
        await ContratosSvc.delete(p.Id ?? "")
        alert("Se ha cancelado este proceso con éxito")
      }
    } catch {
      throw new Error("Ha ocurrido un error cancelando el proceso");
    }
}, [ContratosSvc]);*/



  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, errors, sorts, state, workers, workersOptions,
    nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, setField, handleSubmit, handleEdit, searchWorker, loadToReport, cleanState, loadFirstPage, 
  };
}

