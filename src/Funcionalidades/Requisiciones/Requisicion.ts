import React from "react";
import type { DateRange, GetAllOpts, SortDir, SortField, } from "../../models/Commons";
import {  toGraphDateTime, toISODateFlex, toISODateTimeFlex } from "../../utils/Date";
import { useAuth } from "../../auth/authProvider";
import { emailsArray, esc, norm } from "../../utils/text";
import type { RequisicionesService } from "../../Services/Requisiciones.service";
import type { cargoCiudadAnalista, requisiciones, RequisicionesErrors } from "../../models/requisiciones";
import { calcularFechaSolucionRequisicion, startDateByCutoff } from "../../utils/ansRequisicion";
import type { Holiday } from "festivos-colombianos";
import { fetchHolidays } from "../../Services/Festivos";
import { buildRecipients } from "../../utils/mail";
import { useGraphServices } from "../../graph/graphContext";
import { usePermissions } from "../Permisos";
import { useDebouncedValue } from "../Common/debounce";


function includesSearch(row: requisiciones, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Id).includes(qq)
  );
}

export function useRequsiciones(requisicionSvc: RequisicionesService,) {
  const {mail, maestrosMotivos} = useGraphServices()
  const { engine, loading: loadingPerms } = usePermissions();
  const [rows, setRows] = React.useState<requisiciones[]>([]);
  const [baseRows, setBaseRows] = React.useState<requisiciones[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("all");
  const [cargo, setCargo] = React.useState<string>("all");
  const [año, setAño] = React.useState<string>("2026");
  const [cumpleANS, setCumpleANS] = React.useState<string>("all");
  const [ciudad, setCiudad] = React.useState<string>("all");
  const [analista, setAnalista] = React.useState<string>("all");
  const {account} = useAuth()
  const [state, setState] = React.useState<requisiciones>(
    {
      nuevoPromocion: "",
      Area: "",
      Ciudad: "",
      codigoCentroCosto: "",
      codigoCentroOperativo: "",
      codigoUnidadNegocio: "",
      comisiones: "",
      correoProfesional: "",
      correoSolicitante: account?.username ?? "",
      descripcionCentroCosto:  "",
      descripcionCentroOperativo: "",
      descripcionUnidadNegocio: "",
      diasHabiles: 0,
      fechaInicioProceso: toISODateFlex(new Date()),
      fechaLimite: null,
      genero: "",
      motivo: "AUMENTO DE LA PLANTA",
      nombreProfesional: "",
      observacionesSalario: "",
      razon: "",
      salarioBasico: "",
      solicitante: account?.name ?? "",
      tipoConvocatoria: "",
      tipoRequisicion: "",
      Title: "",
      ANS: "",
      fechaIngreso: null,
      cumpleANS: "Pendiente",
      direccion: "",
      grupoCVE: "",
      empresaContratista: "",
      Estado: "Activo",
      fechaTerna: null,
      Identificador: "",
      motivoNoCumplimiento: "",
      nombreEmpleadoVinculado: "",
      cedulaEmpleadoVinculado: ""
  });
  const [errors, setErrors] = React.useState<RequisicionesErrors>({});
  const setField = React.useCallback(<K extends keyof requisiciones>(k: K, v: requisiciones[K]) => { setState((s) => ({ ...s, [k]: v }));}, []);
  const debouncedSearch = useDebouncedValue(search, 250);
  const canViewAll = engine.can("requisiciones.viewAll")

  const securityFilter = React.useMemo(() => {
    if (loadingPerms) return "";        
    if (!account?.username) return "";            
    if (canViewAll) return "";         
    return `fields/correoSolicitante eq '${esc(account?.username)}'`; 
  }, [loadingPerms, canViewAll, account?.username]);

 const buildServerFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if (estado && estado !== "all") filters.push(`fields/Estado eq '${estado}'`);
    if (cargo && cargo !== "all") filters.push(`fields/Title eq '${cargo}'`);
    if (cumpleANS && cumpleANS !== "all") filters.push(`fields/cumpleANS eq '${cumpleANS}'`);
    if (ciudad && ciudad !== "all") filters.push(`fields/Ciudad eq '${ciudad}'`);
    if (analista && analista !== "all") filters.push(`fields/nombreProfesional eq '${analista}'`);
    if (año && año !== "all") {
      const y = Number(año);
      const from = `${y}-01-01T00:00:00Z`;
      const toExclusive = `${y + 1}-01-01T00:00:00Z`;
      filters.push(`fields/Created ge '${from}'`);
      filters.push(`fields/Created lt '${toExclusive}'`);
    }
    if(securityFilter) filters.push(securityFilter)
    

    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
    }

    console.warn(filters.join(" and "))

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby: "fields/Created desc",
      top: 2000,
    };
  }, [estado, range.from, range.to, cargo, cumpleANS, ciudad, analista, año]);

  const loadFIrstPage = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const { items } = await requisicionSvc.getAll(buildServerFilter());
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
  }, [account?.username, requisicionSvc, buildServerFilter]);

  // Traer de Graph SOLO cuando cambie estado/rango (o cuando auth esté listo)
  React.useEffect(() => {
    loadFIrstPage();
  }, [loadFIrstPage, estado, range.from, range.to, pageSize]);

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

    // 2) paginate local
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
    await loadFIrstPage();
    setPageIndex(1);
  }, [loadFIrstPage]);


  // siguiente página: seguir el nextLink tal cual
  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await requisicionSvc.getByNextLink(nextLink);
      setRows(items);              // 👈 reemplaza la página visible
      setNextLink(n2 ?? null);     // null si no hay más
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, requisicionSvc]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  const validate = () => {
    const e: RequisicionesErrors = {};
    if(!state.Title) e.Title = "Seleccione una Cargo"
    if(!state.Ciudad) e.Ciudad = "Seleccione una Ciudad"
    if(!state.tipoConvocatoria) e.tipoConvocatoria = "Seleccione un tipo de convocatoria"
    if(!state.Area) e.Area = "Seleccione un Área"
    if(!state.codigoCentroOperativo) e.codigoCentroOperativo = "Seleccione un Centro Operativo"
    if(!state.codigoCentroCosto) e.codigoCentroCosto = "Seleccione un Centro de Costos"
    if(!state.codigoUnidadNegocio) e.codigoUnidadNegocio = "Seleccione una Unidad de Negocio"
    if(!state.genero) e.genero = "Seleccione un genero"
    if(!state.motivo) e.motivo = "Seleccione un motivo"
    if(!state.tipoConvocatoria) e.tipoConvocatoria = "Seleccione un Tipo de convocatoria"
    if(!state.salarioBasico) e.salarioBasico = "Ingrese el salario basico"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({
      nuevoPromocion: "",
      cedulaEmpleadoVinculado: "",
      Area: "",
      Ciudad: "",
      codigoCentroCosto: "",
      codigoCentroOperativo: "",
      codigoUnidadNegocio: "",
      comisiones: "",
      correoProfesional: "",
      correoSolicitante: account?.username ?? "",
      descripcionCentroCosto:  "",
      descripcionCentroOperativo: "",
      descripcionUnidadNegocio: "",
      diasHabiles: 0,
      fechaInicioProceso: toISODateTimeFlex(new Date()),
      fechaLimite: null,
      genero: "",
      motivo: "",
      nombreProfesional: "",
      observacionesSalario: "",
      razon: "",
      salarioBasico: "",
      solicitante: account?.name ?? "",
      tipoConvocatoria: "",
      tipoRequisicion: "",
      Title: "",
      ANS: "",
      fechaIngreso: null,
      cumpleANS: "Pendiente",
      direccion: "",
      grupoCVE: "",
      empresaContratista: "",
      Estado: "Activo",
      fechaTerna: null,
      Identificador: "",
      motivoNoCumplimiento: "",
      nombreEmpleadoVinculado: "",
    })
  };

  const handleSubmit = async (ans: number, analista: cargoCiudadAnalista): Promise<{created: requisiciones | null, ok: boolean}> => {
    if (!validate()) { 
      alert("Hay campos sin rellenar")
      console.log(errors)
      return {
        created: null,
        ok: false        
      }
    };
    console.log(state)
    setLoading(true);
    try {
      const holidays: Holiday[] = await fetchHolidays()
      const fechaInicio = startDateByCutoff(new Date(), holidays)
      const fechaFinal = calcularFechaSolucionRequisicion(fechaInicio, ans, holidays)
      const payload: requisiciones = {
        cedulaEmpleadoVinculado: state.cedulaEmpleadoVinculado,
        ANS: String(ans),
        Area: state.Area,
        Ciudad: state.Ciudad,
        codigoCentroCosto: state.codigoCentroCosto,
        codigoCentroOperativo: state.codigoCentroOperativo,
        codigoUnidadNegocio: String(state.codigoUnidadNegocio),
        comisiones: String(state.comisiones),
        correoProfesional: analista.Title,
        correoSolicitante: state.correoSolicitante,
        cumpleANS: state.cumpleANS,
        descripcionCentroCosto: state.descripcionCentroCosto,
        descripcionCentroOperativo: state.descripcionCentroOperativo,
        descripcionUnidadNegocio: state.descripcionUnidadNegocio,
        diasHabiles: Number(ans),
        fechaIngreso: toGraphDateTime(state.fechaIngreso) ?? null,
        fechaInicioProceso: toGraphDateTime(fechaInicio) ?? null,
        fechaLimite: toGraphDateTime(fechaFinal) ?? null,
        genero: state.genero,
        motivo: state.motivo,
        nombreProfesional: analista.nombreAnalista,
        observacionesSalario: state.observacionesSalario,
        razon: state.razon,
        salarioBasico: state.salarioBasico,
        solicitante: state.solicitante,
        tipoConvocatoria: state.tipoConvocatoria,
        tipoRequisicion: state.tipoRequisicion,
        Title: state.Title,
        Created: state.Created,
        direccion: state.direccion,
        grupoCVE: state.grupoCVE,
        empresaContratista: state.empresaContratista,
        Estado: state.Estado,
        fechaTerna: state.fechaTerna,
        Identificador: state.Identificador,
        motivoNoCumplimiento: state.motivoNoCumplimiento,
        nombreEmpleadoVinculado: state.nombreEmpleadoVinculado,
        nuevoPromocion: state.nuevoPromocion,
      }; 
      const created = await requisicionSvc.create(payload);
      alert("Se ha creado el registro con éxito")
      return {
        created: created,
        ok: true        
      }
    } catch{
      return {
        created: null,
        ok: false        
      }
    }finally {
        setLoading(false);
      }
  };

  const handleEdit = async (requisicionSeleccionada: requisiciones) => {
    if (!validate()) { return};
    setLoading(true);
    try {  
      const payload: requisiciones = {
        Area: requisicionSeleccionada.Area !== state.Area ? state.Area : requisicionSeleccionada.Area,
        Ciudad: requisicionSeleccionada.Ciudad !== state.Ciudad ? state.Ciudad : requisicionSeleccionada.Ciudad,
        codigoCentroCosto: requisicionSeleccionada.codigoCentroCosto !== state.codigoCentroCosto ? state.codigoCentroCosto : requisicionSeleccionada.codigoCentroCosto,
        codigoCentroOperativo: requisicionSeleccionada.codigoCentroOperativo !== state.codigoCentroOperativo ? state.codigoCentroOperativo : requisicionSeleccionada.codigoCentroOperativo,
        codigoUnidadNegocio: requisicionSeleccionada.codigoUnidadNegocio !== state.codigoUnidadNegocio ? state.codigoUnidadNegocio : requisicionSeleccionada.codigoUnidadNegocio,
        comisiones: requisicionSeleccionada.comisiones !== state.comisiones ? state.comisiones : requisicionSeleccionada.comisiones,
        correoProfesional: requisicionSeleccionada.correoProfesional !== state.correoProfesional ? state.correoProfesional : requisicionSeleccionada.correoProfesional,
        correoSolicitante: requisicionSeleccionada.correoSolicitante !== state.correoSolicitante ? state.correoSolicitante : requisicionSeleccionada.correoSolicitante,
        descripcionCentroCosto: requisicionSeleccionada.descripcionCentroCosto !== state.descripcionCentroCosto ? state.descripcionCentroCosto : requisicionSeleccionada.descripcionCentroCosto,
        descripcionCentroOperativo: requisicionSeleccionada.descripcionCentroOperativo !== state.descripcionCentroOperativo ? state.descripcionCentroOperativo : requisicionSeleccionada.descripcionCentroOperativo,
        descripcionUnidadNegocio: requisicionSeleccionada.descripcionUnidadNegocio !== state.descripcionUnidadNegocio ? state.descripcionUnidadNegocio : requisicionSeleccionada.descripcionUnidadNegocio,
        diasHabiles: Number(requisicionSeleccionada.diasHabiles) !== Number(state.diasHabiles) ? Number(state.diasHabiles) : Number(requisicionSeleccionada.diasHabiles),
        fechaInicioProceso: toGraphDateTime(requisicionSeleccionada.fechaInicioProceso) !== toGraphDateTime(state.fechaInicioProceso) ? toGraphDateTime(state.fechaInicioProceso) ?? null : toGraphDateTime(requisicionSeleccionada.fechaInicioProceso) ?? null,
        fechaLimite: toGraphDateTime(requisicionSeleccionada.fechaLimite) !== toGraphDateTime(state.fechaLimite) ? toGraphDateTime(state.fechaLimite) ?? null : toGraphDateTime(requisicionSeleccionada.fechaLimite) ?? null,
        fechaIngreso: toGraphDateTime(requisicionSeleccionada.fechaIngreso) !== toGraphDateTime(state.fechaIngreso) ? toGraphDateTime(state.fechaIngreso) ?? null : toGraphDateTime(requisicionSeleccionada.fechaIngreso) ?? null,
        fechaTerna: toGraphDateTime(requisicionSeleccionada.fechaTerna) !== toGraphDateTime(state.fechaTerna) ? toGraphDateTime(state.fechaTerna) ?? null : toGraphDateTime(requisicionSeleccionada.fechaTerna) ?? null,
        genero: requisicionSeleccionada.genero !== state.genero ? state.genero : requisicionSeleccionada.genero,
        motivo: requisicionSeleccionada.motivo !== state.motivo ? state.motivo : requisicionSeleccionada.motivo,
        nombreProfesional: requisicionSeleccionada.nombreProfesional !== state.nombreProfesional ? state.nombreProfesional : requisicionSeleccionada.nombreProfesional,
        observacionesSalario: requisicionSeleccionada.observacionesSalario !== state.observacionesSalario ? state.observacionesSalario : requisicionSeleccionada.observacionesSalario,
        razon: requisicionSeleccionada.razon !== state.razon ? state.razon : requisicionSeleccionada.razon,
        salarioBasico: requisicionSeleccionada.salarioBasico !== state.salarioBasico ? state.salarioBasico : requisicionSeleccionada.salarioBasico,
        solicitante: requisicionSeleccionada.solicitante !== state.solicitante ? state.solicitante : requisicionSeleccionada.solicitante,
        tipoConvocatoria: requisicionSeleccionada.tipoConvocatoria !== state.tipoConvocatoria ? state.tipoConvocatoria : requisicionSeleccionada.tipoConvocatoria,       
        tipoRequisicion: requisicionSeleccionada.tipoRequisicion !== state.tipoRequisicion ? state.tipoRequisicion : requisicionSeleccionada.tipoRequisicion,
        Title: requisicionSeleccionada.Title !== state.Title ? String(state.Title) : String(requisicionSeleccionada.Title),
        ANS: requisicionSeleccionada.ANS !== state.ANS ? String(state.ANS) : String(requisicionSeleccionada.ANS),
        cumpleANS: requisicionSeleccionada.cumpleANS !== state.cumpleANS ? state.cumpleANS : requisicionSeleccionada.cumpleANS,
        cedulaEmpleadoVinculado: requisicionSeleccionada.cedulaEmpleadoVinculado !== state.cedulaEmpleadoVinculado ? state.cedulaEmpleadoVinculado : requisicionSeleccionada.cedulaEmpleadoVinculado,
        direccion: requisicionSeleccionada.direccion !== state.direccion ? state.direccion : requisicionSeleccionada.direccion,
        empresaContratista: requisicionSeleccionada.empresaContratista !== state.empresaContratista ? state.empresaContratista : requisicionSeleccionada.empresaContratista,
        Estado: requisicionSeleccionada.Estado !== state.Estado ? state.Estado : requisicionSeleccionada.Estado,
        grupoCVE: requisicionSeleccionada.grupoCVE !== state.grupoCVE ? state.grupoCVE : requisicionSeleccionada.grupoCVE,
        motivoNoCumplimiento: requisicionSeleccionada.motivoNoCumplimiento !== state.motivoNoCumplimiento ? state.motivoNoCumplimiento : requisicionSeleccionada.motivoNoCumplimiento,
        nombreEmpleadoVinculado: requisicionSeleccionada.nombreEmpleadoVinculado !== state.nombreEmpleadoVinculado ? state.nombreEmpleadoVinculado : requisicionSeleccionada.nombreEmpleadoVinculado,
        nuevoPromocion: requisicionSeleccionada.nuevoPromocion !== state.nuevoPromocion ? state.nuevoPromocion : requisicionSeleccionada.nuevoPromocion,
        Identificador: requisicionSeleccionada.Identificador !== state.Identificador ? state.Identificador : requisicionSeleccionada.Identificador,
      };

      if(payload.fechaIngreso){
        const limite = new Date(state.fechaLimite ?? "").getTime();
        const ingreso = new Date(state.fechaIngreso ?? "").getTime();
        const cumple = limite < ingreso ? "No" : "Si"
        await requisicionSvc.update(requisicionSeleccionada.Id!, {...payload, Estado: "Cerrado", cumpleANS: cumple})
        alert("Se ha finalizado con éxito la requisición")
        return
      }

      await requisicionSvc.update(requisicionSeleccionada.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
      return
    } finally {
        setLoading(false);
      }
  };

  const notifyAsignacion = async (created: requisiciones) => {

    const htmlBody = `
      Cordial saludo,<br> 
      <br> Por favor gestionar la siguiente requisición: <br> <br> <br>
      <strong>Cargo</strong>: ${created.Title} <br> <br> 
      <strong>Ciudad:</strong> ${created.Ciudad} <br> <br> 
      <strong>Fecha de inicio:</strong> ${created.fechaInicioProceso} <br> <br> 
      <strong>Fecha límite:</strong> ${created.fechaLimite} <br> <br> 
      <strong>Tienda:</strong> ${created.descripcionCentroOperativo} <br> 
      <strong>Área:</strong> ${created.Area} <br> <br> 
      <strong>Jefatura:</strong> ${created.direccion}
    `;

    const toRecipients = buildRecipients([created.correoProfesional])

    const mailPayload: any = {
      message: {
        subject: `Requisión asignada ID - ${created.Id}`,
        body: { contentType: "HTML", content: htmlBody },
      toRecipients,
    },
    saveToSentItems: true,
  };
    
  await mail.sendEmail(mailPayload);
   
  };

  const notificarMotivo = async (motivo: string, coCodigo: string, coNombre: string) => {
    const opciones = await maestrosMotivos.getAll({filter: `fields/Title eq '${motivo}'`})
    const final = opciones[0]

    if(!final) return
    
    switch(final.realVsPpto){
      case "todos": 
        const htmlBody = `${final.notificacion} <br> <br> <strong>Centro Operativo:</strong> ${coCodigo} - ${coNombre}`;
        const toRecipients = buildRecipients(emailsArray(final.destinatarios))

          const mailPayload: any = {
            message: {
              subject: `Advertencia: ${final.notificacion}`,
              body: { contentType: "HTML", content: htmlBody },
            toRecipients,
          },
            saveToSentItems: true,
          };  
        await mail.sendEmail(mailPayload);
      break

      //TODO: Añadir validacion de planta real vs planta 

    }
  }

  const cancelarRequisicion = async (r: requisiciones): Promise<boolean> => {
    alert(r.Id)
    if(!state.motivoNoCumplimiento) return false
    await requisicionSvc.update(r.Id ?? "", {Estado: "Cancelado", cumpleANS: "No Aplica", motivoNoCumplimiento: r.motivoNoCumplimiento})
    alert("Se ha cancelado la requisición con éxito")
    reloadAll()
    return true
  }

  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, errors, sorts, state, estado, cargo, cumpleANS, ciudad, analista, año,
    cancelarRequisicion, setAño, setState, setAnalista, nextPage, applyRange, reloadAll, setCargo, setRange, setPageSize, setSearch, notificarMotivo, setSorts, setField, handleSubmit, handleEdit, setCiudad, cleanState, loadFirstPage, setCumpleANS, setEstado, notifyAsignacion
  };
}



