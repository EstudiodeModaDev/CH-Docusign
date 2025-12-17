import React from "react";
import type { DateRange, GetAllOpts, rsOption, SortDir, SortField, } from "../models/Commons";
import type { ContratosService } from "../Services/Contratos.service";
import type { Novedad, NovedadCancelada, NovedadErrors } from "../models/Novedades";
import { getTodayLocalISO, toGraphDateTime, toISODateTimeFlex } from "../utils/Date";
import { useAuth } from "../auth/authProvider";
import { NovedadCanceladaService } from "../Services/NovedadCancelada.service";

export function useContratos(ContratosSvc: ContratosService, novedadCanceladaSvc?: NovedadCanceladaService) {
  const [rows, setRows] = React.useState<Novedad[]>([]);
  const [workers, setWorkers] = React.useState<Novedad[]>([]);
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
  const [state, setState] = React.useState<Novedad>({
    ADICIONALES_x0020_: "",
    AUTONOM_x00cd_A_x0020_: "",
    auxconectividadtexto: "",
    auxconectividadvalor: "",
    Auxilio_x0020_de_x0020_rodamient: "",
    Auxilio_x0020_de_x0020_rodamient0: "",
    BARRIO_x0020_: "",
    CARGO: "",    
    CARGO_x0020_CRITICO: "No", 
    Cargo_x0020_de_x0020_la_x0020_pe: "",    
    CELULAR_x0020_: "",
    CENTRO_x0020_OPERATIVO_x0020_: "",
    CIUDAD: "",
    CODIGO_x0020_CENTRO_x0020_DE_x00: "",
    CONTRIBUCION_x0020_A_x0020_LA_x0: "",
    CORREO_x0020_ELECTRONICO_x0020_: "",
    Departamento: "",
    DEPENDENCIA_x0020_: "",
    DESCRIPCION_x0020_CENTRO_x0020_O: "",
    DESCRIPCION_x0020_DE_x0020_CENTR: "",
    DIRECCION_x0020_DE_x0020_DOMICIL: "",
    Empresa_x0020_que_x0020_solicita: "",
    ESPECIFICIDAD_x0020_DEL_x0020_CA: "",
    FECHA_x0020_DE_x0020_AJUSTE_x002: null,
    FECHA_x0020_DE_x0020_ENTREGA_x00: null,
    FECHA_x0020_HASTA_x0020_PARA_x00: null,
    FECHA_x0020_REQUERIDA_x0020_PARA: null,
    FECHA_x0020_REQUERIDA_x0020_PARA0: "",
    GARANTIZADO_x0020__x0020__x00bf_: "No",
    Garantizado_x0020_en_x0020_letra: "",
    GRUPO_x0020_CVE_x0020_: "",
    HERRAMIENTAS_x0020_QUE_x0020_POS: "",
    ID_x0020_UNIDAD_x0020_DE_x0020_N: "",
    IMPACTO_x0020_CLIENTE_x0020_EXTE: "",
    Informaci_x00f3_n_x0020_enviada_: account?.name ?? "",
    MODALIDAD_x0020_TELETRABAJO: "",
    NIVEL_x0020_DE_x0020_CARGO: "",
    NombreSeleccionado: "",
    Numero_x0020_identificaci_x00f3_: "",
    ORIGEN_x0020_DE_x0020_LA_x0020_S: "",
    PERSONAS_x0020_A_x0020_CARGO: "No",
    Pertenecealmodelo: false,
    PRESUPUESTO_x0020_VENTAS_x002f_M: "",
    PROMEDIO_x0020_: "",
    SALARIO: "",
    SALARIO_x0020_AJUSTADO: "",
    salariotexto: "",
    SE_x0020_DEBE_x0020_HACER_x0020_: "No",
    STATUS_x0020_DE_x0020_INGRESO_x0: "",
    TEMPORAL: "No",
    TIPO_x0020_DE_x0020_CONTRATO: "",
    Tipo_x0020_de_x0020_documento_x0: "",
    TIPO_x0020_DE_x0020_VACANTE_x002: "",
    tipodoc: "",
    Title: toGraphDateTime(getTodayLocalISO())!,
    FechaReporte: toGraphDateTime(getTodayLocalISO()) ?? null,
    UNIDAD_x0020_DE_x0020_NEGOCIO_x0: "",
    VALOR_x0020_GARANTIZADO: "",
    Ajustesalario: false,
    Auxilioderodamientosiono: false   
  });
  const [errors, setErrors] = React.useState<NovedadErrors>({});
  const setField = <K extends keyof Novedad>(k: K, v: Novedad[K]) => setState((s) => ({ ...s, [k]: v }));
  
  // construir filtro OData
  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if(search){
        filters.push(`(startswith(fields/NombreSeleccionado, '${search}') or startswith(fields/Numero_x0020_identificaci_x00f3_, '${search}') or startswith(fields/CARGO, '${search}'))`)
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
      const { items, nextLink } = await ContratosSvc.getAll(buildFilter()); // debe devolver {items,nextLink}
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
  }, [ContratosSvc, buildFilter, sorts]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, range, search]);

  // siguiente página: seguir el nextLink tal cual
  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await ContratosSvc.getByNextLink(nextLink);
      setRows(items);              // 👈 reemplaza la página visible
      setNextLink(n2 ?? null);     // null si no hay más
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, ContratosSvc]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  const sortFieldToOData: Record<SortField, string> = {
    id: 'fields/Created',
    Cedula: 'fields/Numero_x0020_identificaci_x00f3_',
    Nombre: 'fields/NombreSeleccionado',
    Salario: 'fields/SALARIO',
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

  const validate = () => {
    const e: NovedadErrors = {};
    if(!state.Empresa_x0020_que_x0020_solicita) e.Empresa_x0020_que_x0020_solicita = "Seleccione una empresa solicitante"
    if(!state.tipodoc) e.tipodoc = "Seleccione un tipo de documento"
    if(!state.Numero_x0020_identificaci_x00f3_) e.Numero_x0020_identificaci_x00f3_ = "Ingrese el numero de identificación"
    if(!state.NombreSeleccionado) e.NombreSeleccionado = "Ingrese el nombre del seleccionado"
    if(!state.CORREO_x0020_ELECTRONICO_x0020_) e.CORREO_x0020_ELECTRONICO_x0020_ = "Ingrese el correo del seleccionado"
    if(!state.FECHA_x0020_REQUERIDA_x0020_PARA0) e.FECHA_x0020_REQUERIDA_x0020_PARA0 = "Ingrese la fecha de inicio"
    if(!state.CARGO) e.CARGO = "Seleccione el cargo que ocupara"
    if(!state.Departamento) e.Departamento = "Seleccione un departamento"
    if(!state.CIUDAD) e.CIUDAD = "Seleccione una ciudad"
    if(!state.MODALIDAD_x0020_TELETRABAJO) e.MODALIDAD_x0020_TELETRABAJO = "Seleccione una modalidad de trabajo"
    if(!state.SALARIO) e.SALARIO = "Ingrese el salario"
    if(!state.CELULAR_x0020_) e.CELULAR_x0020_ = "Ingrese el celular del seleccionado"
    if(!state.DIRECCION_x0020_DE_x0020_DOMICIL) e.DIRECCION_x0020_DE_x0020_DOMICIL = "Ingrese la direccion de domicilio"
    if(!state.BARRIO_x0020_) e.BARRIO_x0020_ = "Ingrese el barrio"
    if(!state.ESPECIFICIDAD_x0020_DEL_x0020_CA)e.ESPECIFICIDAD_x0020_DEL_x0020_CA = "Seleccione la especificidad del cargo"
    if(!!state.Ajustesalario && !state.SALARIO_x0020_AJUSTADO) e.SALARIO_x0020_AJUSTADO = "Debe ingresar el porcentaje de ajuste"
    if(state.GARANTIZADO_x0020__x0020__x00bf_.toLocaleLowerCase() === "si" && Number(state.VALOR_x0020_GARANTIZADO) < 1) e.VALOR_x0020_GARANTIZADO = "Debe ingresar el porcentaje de ajuste en el garantizado"
    if(!!state.Auxilioderodamientosiono && !state.Auxilio_x0020_de_x0020_rodamient) e.Auxilio_x0020_de_x0020_rodamient = "Ingrese el valor del auxilio de rodamiento"
    if(!state.DEPENDENCIA_x0020_) e.DEPENDENCIA_x0020_ = "Seleccione la dependencia"
    if(!state.CODIGO_x0020_CENTRO_x0020_DE_x00) e.CODIGO_x0020_CENTRO_x0020_DE_x00 = "Seleccione un CC"
    if(!state.CENTRO_x0020_OPERATIVO_x0020_) e.CENTRO_x0020_OPERATIVO_x0020_ = "Seleccione un CO"
    if(!state.UNIDAD_x0020_DE_x0020_NEGOCIO_x0) e.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 = "Seleccione una UN"
    if(!state.ORIGEN_x0020_DE_x0020_LA_x0020_S) e.ORIGEN_x0020_DE_x0020_LA_x0020_S = "Seleccione un origen de la selección"
    if(!state.TIPO_x0020_DE_x0020_CONTRATO) e.TIPO_x0020_DE_x0020_CONTRATO = "Seleccione un tipo de contrato"
    if(!state.TIPO_x0020_DE_x0020_VACANTE_x002) e.TIPO_x0020_DE_x0020_VACANTE_x002 = "Seleccione un tipo de vacante"
    if(!!state.Pertenecealmodelo && !state.AUTONOM_x00cd_A_x0020_) e.AUTONOM_x00cd_A_x0020_ = "Escoja un valor para la autonomia"
    if(!!state.Pertenecealmodelo && !state.PRESUPUESTO_x0020_VENTAS_x002f_M) e.PRESUPUESTO_x0020_VENTAS_x002f_M = "Escoja un valor para el presupesto ventas/magnitud económica"
    if(!!state.Pertenecealmodelo && !state.IMPACTO_x0020_CLIENTE_x0020_EXTE) e.IMPACTO_x0020_CLIENTE_x0020_EXTE = "Escoja un valor para el impacto cliente externo"
    if(!!state.Pertenecealmodelo && !state.CONTRIBUCION_x0020_A_x0020_LA_x0) e.CONTRIBUCION_x0020_A_x0020_LA_x0 = "Escoja un valor para la contribución a la estrategia"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({
      ADICIONALES_x0020_: "",
      AUTONOM_x00cd_A_x0020_: "",
      auxconectividadtexto: "",
      auxconectividadvalor: "",
      Auxilio_x0020_de_x0020_rodamient: "",
      Auxilio_x0020_de_x0020_rodamient0: "",
      BARRIO_x0020_: "",
      CARGO: "",    
      CARGO_x0020_CRITICO: "No", 
      Cargo_x0020_de_x0020_la_x0020_pe: "",    
      CELULAR_x0020_: "",
      CENTRO_x0020_OPERATIVO_x0020_: "",
      CIUDAD: "",
      CODIGO_x0020_CENTRO_x0020_DE_x00: "",
      CONTRIBUCION_x0020_A_x0020_LA_x0: "",
      CORREO_x0020_ELECTRONICO_x0020_: "",
      Departamento: "",
      DEPENDENCIA_x0020_: "",
      DESCRIPCION_x0020_CENTRO_x0020_O: "",
      DESCRIPCION_x0020_DE_x0020_CENTR: "",
      DIRECCION_x0020_DE_x0020_DOMICIL: "",
      Empresa_x0020_que_x0020_solicita: "",
      ESPECIFICIDAD_x0020_DEL_x0020_CA: "",
      FECHA_x0020_DE_x0020_AJUSTE_x002: null,
      FECHA_x0020_DE_x0020_ENTREGA_x00: null,
      FECHA_x0020_HASTA_x0020_PARA_x00: null,
      FECHA_x0020_REQUERIDA_x0020_PARA: null,
      FECHA_x0020_REQUERIDA_x0020_PARA0: "",
      GARANTIZADO_x0020__x0020__x00bf_: "No",
      Garantizado_x0020_en_x0020_letra: "",
      GRUPO_x0020_CVE_x0020_: "",
      HERRAMIENTAS_x0020_QUE_x0020_POS: "",
      ID_x0020_UNIDAD_x0020_DE_x0020_N: "",
      IMPACTO_x0020_CLIENTE_x0020_EXTE: "",
      Informaci_x00f3_n_x0020_enviada_: account?.name ?? "",
      MODALIDAD_x0020_TELETRABAJO: "",
      NIVEL_x0020_DE_x0020_CARGO: "",
      NombreSeleccionado: "",
      Numero_x0020_identificaci_x00f3_: "",
      ORIGEN_x0020_DE_x0020_LA_x0020_S: "",
      PERSONAS_x0020_A_x0020_CARGO: "No",
      Pertenecealmodelo: false,
      PRESUPUESTO_x0020_VENTAS_x002f_M: "",
      PROMEDIO_x0020_: "",
      SALARIO: "",
      SALARIO_x0020_AJUSTADO: "",
      salariotexto: "",
      SE_x0020_DEBE_x0020_HACER_x0020_: "No",
      STATUS_x0020_DE_x0020_INGRESO_x0: "",
      TEMPORAL: "No",
      TIPO_x0020_DE_x0020_CONTRATO: "",
      Tipo_x0020_de_x0020_documento_x0: "",
      TIPO_x0020_DE_x0020_VACANTE_x002: "",
      tipodoc: "",
      Title: toGraphDateTime(getTodayLocalISO())!,
      FechaReporte: toGraphDateTime(getTodayLocalISO()) ?? null,
      UNIDAD_x0020_DE_x0020_NEGOCIO_x0: "",
      VALOR_x0020_GARANTIZADO: "",
      Ajustesalario: false,
      Auxilioderodamientosiono: false 
    })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {
          
      // Objeto de creación
      const payload: Novedad = {
        ADICIONALES_x0020_: state.ADICIONALES_x0020_,
        Ajustesalario: state.Ajustesalario,
        AUTONOM_x00cd_A_x0020_: state.AUTONOM_x00cd_A_x0020_,
        auxconectividadtexto: state.auxconectividadtexto,
        auxconectividadvalor: state.auxconectividadvalor,
        Auxilio_x0020_de_x0020_rodamient: state.Auxilio_x0020_de_x0020_rodamient,
        Auxilio_x0020_de_x0020_rodamient0: state.Auxilio_x0020_de_x0020_rodamient0,
        Auxilioderodamientosiono: state.Auxilioderodamientosiono,
        BARRIO_x0020_: state.BARRIO_x0020_,
        CARGO: state.CARGO,
        CARGO_x0020_CRITICO: state.CARGO_x0020_CRITICO,
        CELULAR_x0020_: state.CELULAR_x0020_,
        CENTRO_x0020_OPERATIVO_x0020_: state.CENTRO_x0020_OPERATIVO_x0020_,
        CIUDAD: state.CIUDAD,
        CODIGO_x0020_CENTRO_x0020_DE_x00: state.CODIGO_x0020_CENTRO_x0020_DE_x00,
        CONTRIBUCION_x0020_A_x0020_LA_x0: state.CONTRIBUCION_x0020_A_x0020_LA_x0,
        CORREO_x0020_ELECTRONICO_x0020_: state.CORREO_x0020_ELECTRONICO_x0020_,
        Departamento: state.Departamento, 
        DEPENDENCIA_x0020_: state.DEPENDENCIA_x0020_,
        DESCRIPCION_x0020_CENTRO_x0020_O: state.DESCRIPCION_x0020_CENTRO_x0020_O,
        DESCRIPCION_x0020_DE_x0020_CENTR: state.DESCRIPCION_x0020_DE_x0020_CENTR,
        DIRECCION_x0020_DE_x0020_DOMICIL: state.DIRECCION_x0020_DE_x0020_DOMICIL,
        Empresa_x0020_que_x0020_solicita: state.Empresa_x0020_que_x0020_solicita,
        ESPECIFICIDAD_x0020_DEL_x0020_CA: state.ESPECIFICIDAD_x0020_DEL_x0020_CA,
        FECHA_x0020_DE_x0020_AJUSTE_x002: toGraphDateTime(state.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? null,
        FECHA_x0020_DE_x0020_ENTREGA_x00: toGraphDateTime(state.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? null,
        FECHA_x0020_HASTA_x0020_PARA_x00: toGraphDateTime(state.FECHA_x0020_HASTA_x0020_PARA_x00) ?? null,
        FECHA_x0020_REQUERIDA_x0020_PARA: toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA) ?? null,
        FECHA_x0020_REQUERIDA_x0020_PARA0: toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? null,
        GARANTIZADO_x0020__x0020__x00bf_: state.GARANTIZADO_x0020__x0020__x00bf_,
        Garantizado_x0020_en_x0020_letra: state.Garantizado_x0020_en_x0020_letra,
        GRUPO_x0020_CVE_x0020_: state.GRUPO_x0020_CVE_x0020_,
        HERRAMIENTAS_x0020_QUE_x0020_POS: state.HERRAMIENTAS_x0020_QUE_x0020_POS,
        ID_x0020_UNIDAD_x0020_DE_x0020_N: state.ID_x0020_UNIDAD_x0020_DE_x0020_N,
        IMPACTO_x0020_CLIENTE_x0020_EXTE: state.IMPACTO_x0020_CLIENTE_x0020_EXTE,
        Informaci_x00f3_n_x0020_enviada_: state.Informaci_x00f3_n_x0020_enviada_,
        MODALIDAD_x0020_TELETRABAJO: state.MODALIDAD_x0020_TELETRABAJO,
        NIVEL_x0020_DE_x0020_CARGO: state.NIVEL_x0020_DE_x0020_CARGO,
        NombreSeleccionado: state.NombreSeleccionado,
        Numero_x0020_identificaci_x00f3_: state.Numero_x0020_identificaci_x00f3_,
        ORIGEN_x0020_DE_x0020_LA_x0020_S: state.ORIGEN_x0020_DE_x0020_LA_x0020_S,
        PERSONAS_x0020_A_x0020_CARGO: state.PERSONAS_x0020_A_x0020_CARGO,
        Pertenecealmodelo: state.Pertenecealmodelo,
        PRESUPUESTO_x0020_VENTAS_x002f_M: state.PRESUPUESTO_x0020_VENTAS_x002f_M,
        PROMEDIO_x0020_: state.PROMEDIO_x0020_,
        SALARIO: String(state.SALARIO),
        SALARIO_x0020_AJUSTADO: state.SALARIO_x0020_AJUSTADO,
        salariotexto: state.salariotexto,
        SE_x0020_DEBE_x0020_HACER_x0020_: state.SE_x0020_DEBE_x0020_HACER_x0020_,
        STATUS_x0020_DE_x0020_INGRESO_x0: state.STATUS_x0020_DE_x0020_INGRESO_x0,
        TEMPORAL: state.TEMPORAL,
        TIPO_x0020_DE_x0020_CONTRATO: state.TIPO_x0020_DE_x0020_CONTRATO,
        Tipo_x0020_de_x0020_documento_x0: state.Tipo_x0020_de_x0020_documento_x0,
        TIPO_x0020_DE_x0020_VACANTE_x002: state.TIPO_x0020_DE_x0020_VACANTE_x002,
        tipodoc: state.tipodoc,
        Title: state.Title ?? "",
        UNIDAD_x0020_DE_x0020_NEGOCIO_x0: state.UNIDAD_x0020_DE_x0020_NEGOCIO_x0,
        VALOR_x0020_GARANTIZADO: state.VALOR_x0020_GARANTIZADO,
        Cargo_x0020_de_x0020_la_x0020_pe: state.Cargo_x0020_de_x0020_la_x0020_pe,
        FechaReporte: state.FechaReporte
      };
      await ContratosSvc.create(payload);
      alert("Se ha creado el registro con éxito")
    } finally {
        setLoading(false);
      }
  };

  const handleEdit = async (e: React.FormEvent, NovedadSeleccionada: Novedad) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {  
      const payload = {
        ADICIONALES_x0020_: NovedadSeleccionada.ADICIONALES_x0020_ !== state.ADICIONALES_x0020_ ? state.ADICIONALES_x0020_ : NovedadSeleccionada.ADICIONALES_x0020_,
        Ajustesalario: NovedadSeleccionada.Ajustesalario !== state.Ajustesalario ? state.Ajustesalario : NovedadSeleccionada.Ajustesalario,
        AUTONOM_x00cd_A_x0020_: NovedadSeleccionada.AUTONOM_x00cd_A_x0020_ !== state.AUTONOM_x00cd_A_x0020_ ? state.AUTONOM_x00cd_A_x0020_ : NovedadSeleccionada.AUTONOM_x00cd_A_x0020_,
        auxconectividadtexto: NovedadSeleccionada.auxconectividadtexto !== state.auxconectividadtexto ? state.auxconectividadtexto : NovedadSeleccionada.auxconectividadtexto,
        auxconectividadvalor: NovedadSeleccionada.auxconectividadvalor !== state.auxconectividadvalor ? state.auxconectividadvalor : NovedadSeleccionada.auxconectividadvalor,
        Auxilio_x0020_de_x0020_rodamient: NovedadSeleccionada.Auxilio_x0020_de_x0020_rodamient !== state.Auxilio_x0020_de_x0020_rodamient ? state.Auxilio_x0020_de_x0020_rodamient : NovedadSeleccionada.Auxilio_x0020_de_x0020_rodamient,
        Auxilio_x0020_de_x0020_rodamient0: NovedadSeleccionada.Auxilio_x0020_de_x0020_rodamient0 !== state.Auxilio_x0020_de_x0020_rodamient0 ? state.Auxilio_x0020_de_x0020_rodamient0 : NovedadSeleccionada.Auxilio_x0020_de_x0020_rodamient0,
        Auxilioderodamientosiono: NovedadSeleccionada.Auxilioderodamientosiono !== state.Auxilioderodamientosiono ? state.Auxilioderodamientosiono : NovedadSeleccionada.Auxilioderodamientosiono,
        BARRIO_x0020_: NovedadSeleccionada.BARRIO_x0020_ !== state.BARRIO_x0020_ ? state.BARRIO_x0020_ : NovedadSeleccionada.BARRIO_x0020_,
        CARGO: NovedadSeleccionada.CARGO !== state.CARGO ? state.CARGO : NovedadSeleccionada.CARGO,
        CARGO_x0020_CRITICO: NovedadSeleccionada.CARGO_x0020_CRITICO !== state.CARGO_x0020_CRITICO ? state.CARGO_x0020_CRITICO : NovedadSeleccionada.CARGO_x0020_CRITICO,
        CENTRO_x0020_OPERATIVO_x0020_: NovedadSeleccionada.CENTRO_x0020_OPERATIVO_x0020_ !== state.CENTRO_x0020_OPERATIVO_x0020_ ? state.CENTRO_x0020_OPERATIVO_x0020_ : NovedadSeleccionada.CENTRO_x0020_OPERATIVO_x0020_,
        CELULAR_x0020_: NovedadSeleccionada.CELULAR_x0020_ !== state.CELULAR_x0020_ ? state.CELULAR_x0020_ : NovedadSeleccionada.CELULAR_x0020_,
        CIUDAD: NovedadSeleccionada.CIUDAD !== state.CIUDAD ? state.CIUDAD : NovedadSeleccionada.CIUDAD,
        CODIGO_x0020_CENTRO_x0020_DE_x00: NovedadSeleccionada.CODIGO_x0020_CENTRO_x0020_DE_x00 !== state.CODIGO_x0020_CENTRO_x0020_DE_x00 ? state.CODIGO_x0020_CENTRO_x0020_DE_x00 : NovedadSeleccionada.CODIGO_x0020_CENTRO_x0020_DE_x00,
        CONTRIBUCION_x0020_A_x0020_LA_x0: NovedadSeleccionada.CONTRIBUCION_x0020_A_x0020_LA_x0 !== state.CONTRIBUCION_x0020_A_x0020_LA_x0 ? state.CONTRIBUCION_x0020_A_x0020_LA_x0 : NovedadSeleccionada.CONTRIBUCION_x0020_A_x0020_LA_x0,
        CORREO_x0020_ELECTRONICO_x0020_: NovedadSeleccionada.CORREO_x0020_ELECTRONICO_x0020_ !== state.CORREO_x0020_ELECTRONICO_x0020_ ? state.CORREO_x0020_ELECTRONICO_x0020_ : NovedadSeleccionada.CORREO_x0020_ELECTRONICO_x0020_,
        Departamento: NovedadSeleccionada.Departamento !== state.Departamento ? state.Departamento : NovedadSeleccionada.Departamento,
        DEPENDENCIA_x0020_: NovedadSeleccionada.DEPENDENCIA_x0020_ !== state.DEPENDENCIA_x0020_ ? state.DEPENDENCIA_x0020_ : NovedadSeleccionada.DEPENDENCIA_x0020_,
        DESCRIPCION_x0020_CENTRO_x0020_O: NovedadSeleccionada.DESCRIPCION_x0020_CENTRO_x0020_O !== state.DESCRIPCION_x0020_CENTRO_x0020_O ? state.DESCRIPCION_x0020_CENTRO_x0020_O : NovedadSeleccionada.DESCRIPCION_x0020_CENTRO_x0020_O,
        DESCRIPCION_x0020_DE_x0020_CENTR: NovedadSeleccionada.DESCRIPCION_x0020_DE_x0020_CENTR !== state.DESCRIPCION_x0020_DE_x0020_CENTR ? state.DESCRIPCION_x0020_DE_x0020_CENTR : NovedadSeleccionada.DESCRIPCION_x0020_DE_x0020_CENTR,
        DIRECCION_x0020_DE_x0020_DOMICIL: NovedadSeleccionada.DIRECCION_x0020_DE_x0020_DOMICIL !== state.DIRECCION_x0020_DE_x0020_DOMICIL ? state.DIRECCION_x0020_DE_x0020_DOMICIL : NovedadSeleccionada.DIRECCION_x0020_DE_x0020_DOMICIL,
        Empresa_x0020_que_x0020_solicita: NovedadSeleccionada.Empresa_x0020_que_x0020_solicita !== state.Empresa_x0020_que_x0020_solicita ? state.Empresa_x0020_que_x0020_solicita : NovedadSeleccionada.Empresa_x0020_que_x0020_solicita,
        ESPECIFICIDAD_x0020_DEL_x0020_CA: NovedadSeleccionada.ESPECIFICIDAD_x0020_DEL_x0020_CA !== state.ESPECIFICIDAD_x0020_DEL_x0020_CA ? state.ESPECIFICIDAD_x0020_DEL_x0020_CA : NovedadSeleccionada.ESPECIFICIDAD_x0020_DEL_x0020_CA,
        GARANTIZADO_x0020__x0020__x00bf_: NovedadSeleccionada.GARANTIZADO_x0020__x0020__x00bf_ !== state.GARANTIZADO_x0020__x0020__x00bf_ ? state.GARANTIZADO_x0020__x0020__x00bf_ : NovedadSeleccionada.GARANTIZADO_x0020__x0020__x00bf_,
        Garantizado_x0020_en_x0020_letra: NovedadSeleccionada.Garantizado_x0020_en_x0020_letra !== state.Garantizado_x0020_en_x0020_letra ? state.Garantizado_x0020_en_x0020_letra : NovedadSeleccionada.Garantizado_x0020_en_x0020_letra,
        GRUPO_x0020_CVE_x0020_: NovedadSeleccionada.GRUPO_x0020_CVE_x0020_ !== state.GRUPO_x0020_CVE_x0020_ ? state.GRUPO_x0020_CVE_x0020_ : NovedadSeleccionada.GRUPO_x0020_CVE_x0020_,
        HERRAMIENTAS_x0020_QUE_x0020_POS: NovedadSeleccionada.HERRAMIENTAS_x0020_QUE_x0020_POS !== state.HERRAMIENTAS_x0020_QUE_x0020_POS ? state.HERRAMIENTAS_x0020_QUE_x0020_POS : NovedadSeleccionada.HERRAMIENTAS_x0020_QUE_x0020_POS,
        ID_x0020_UNIDAD_x0020_DE_x0020_N: NovedadSeleccionada.ID_x0020_UNIDAD_x0020_DE_x0020_N !== state.ID_x0020_UNIDAD_x0020_DE_x0020_N ? state.ID_x0020_UNIDAD_x0020_DE_x0020_N : NovedadSeleccionada.ID_x0020_UNIDAD_x0020_DE_x0020_N,
        IMPACTO_x0020_CLIENTE_x0020_EXTE: NovedadSeleccionada.IMPACTO_x0020_CLIENTE_x0020_EXTE !== state.IMPACTO_x0020_CLIENTE_x0020_EXTE ? state.IMPACTO_x0020_CLIENTE_x0020_EXTE : NovedadSeleccionada.IMPACTO_x0020_CLIENTE_x0020_EXTE,
        FECHA_x0020_DE_x0020_AJUSTE_x002: toGraphDateTime(NovedadSeleccionada.FECHA_x0020_DE_x0020_AJUSTE_x002) !== toGraphDateTime(state.FECHA_x0020_DE_x0020_AJUSTE_x002) ? toGraphDateTime(state.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? null : toGraphDateTime(NovedadSeleccionada.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? null,
        FECHA_x0020_DE_x0020_ENTREGA_x00: toGraphDateTime(NovedadSeleccionada.FECHA_x0020_DE_x0020_ENTREGA_x00) !== toGraphDateTime(state.FECHA_x0020_DE_x0020_ENTREGA_x00) ? toGraphDateTime(state.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? null : toGraphDateTime(NovedadSeleccionada.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? null,
        FECHA_x0020_HASTA_x0020_PARA_x00: toGraphDateTime(NovedadSeleccionada.FECHA_x0020_HASTA_x0020_PARA_x00) !== toGraphDateTime(state.FECHA_x0020_HASTA_x0020_PARA_x00) ? toGraphDateTime(state.FECHA_x0020_HASTA_x0020_PARA_x00) ?? null : toGraphDateTime(NovedadSeleccionada.FECHA_x0020_HASTA_x0020_PARA_x00) ?? null,
        FECHA_x0020_REQUERIDA_x0020_PARA: toGraphDateTime(NovedadSeleccionada.FECHA_x0020_REQUERIDA_x0020_PARA) !== toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA) ? toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA) ?? null : toGraphDateTime(NovedadSeleccionada.FECHA_x0020_REQUERIDA_x0020_PARA) ?? null,
        FECHA_x0020_REQUERIDA_x0020_PARA0: toGraphDateTime(NovedadSeleccionada.FECHA_x0020_REQUERIDA_x0020_PARA0) !== toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA0) ? toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? null : toGraphDateTime(NovedadSeleccionada.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? null,             
        MODALIDAD_x0020_TELETRABAJO: NovedadSeleccionada.MODALIDAD_x0020_TELETRABAJO !== state.MODALIDAD_x0020_TELETRABAJO ? state.MODALIDAD_x0020_TELETRABAJO : NovedadSeleccionada.MODALIDAD_x0020_TELETRABAJO,
        NIVEL_x0020_DE_x0020_CARGO: NovedadSeleccionada.NIVEL_x0020_DE_x0020_CARGO !== state.NIVEL_x0020_DE_x0020_CARGO ? state.NIVEL_x0020_DE_x0020_CARGO : NovedadSeleccionada.NIVEL_x0020_DE_x0020_CARGO,
        NombreSeleccionado: NovedadSeleccionada.NombreSeleccionado !== state.NombreSeleccionado ? state.NombreSeleccionado : NovedadSeleccionada.NombreSeleccionado,
        Numero_x0020_identificaci_x00f3_: NovedadSeleccionada.Numero_x0020_identificaci_x00f3_ !== state.Numero_x0020_identificaci_x00f3_ ? state.Numero_x0020_identificaci_x00f3_ : NovedadSeleccionada.Numero_x0020_identificaci_x00f3_,
        ORIGEN_x0020_DE_x0020_LA_x0020_S: NovedadSeleccionada.ORIGEN_x0020_DE_x0020_LA_x0020_S !== state.ORIGEN_x0020_DE_x0020_LA_x0020_S ? state.ORIGEN_x0020_DE_x0020_LA_x0020_S : NovedadSeleccionada.ORIGEN_x0020_DE_x0020_LA_x0020_S,
        PERSONAS_x0020_A_x0020_CARGO: NovedadSeleccionada.PERSONAS_x0020_A_x0020_CARGO !== state.PERSONAS_x0020_A_x0020_CARGO ? state.PERSONAS_x0020_A_x0020_CARGO : NovedadSeleccionada.PERSONAS_x0020_A_x0020_CARGO,
        Pertenecealmodelo: NovedadSeleccionada.Pertenecealmodelo !== state.Pertenecealmodelo ? state.Pertenecealmodelo : NovedadSeleccionada.Pertenecealmodelo,
        PRESUPUESTO_x0020_VENTAS_x002f_M: NovedadSeleccionada.PRESUPUESTO_x0020_VENTAS_x002f_M !== state.PRESUPUESTO_x0020_VENTAS_x002f_M ? state.PRESUPUESTO_x0020_VENTAS_x002f_M : NovedadSeleccionada.PRESUPUESTO_x0020_VENTAS_x002f_M,       
        PROMEDIO_x0020_: NovedadSeleccionada.PROMEDIO_x0020_ !== state.PROMEDIO_x0020_ ? state.PROMEDIO_x0020_ : NovedadSeleccionada.PROMEDIO_x0020_,
        SALARIO: NovedadSeleccionada.SALARIO !== state.SALARIO ? String(state.SALARIO) : String(NovedadSeleccionada.SALARIO),
        SALARIO_x0020_AJUSTADO: NovedadSeleccionada.SALARIO_x0020_AJUSTADO !== state.SALARIO_x0020_AJUSTADO ? state.SALARIO_x0020_AJUSTADO : NovedadSeleccionada.SALARIO_x0020_AJUSTADO,
        salariotexto: NovedadSeleccionada.salariotexto !== state.salariotexto ? state.salariotexto : NovedadSeleccionada.salariotexto,
        SE_x0020_DEBE_x0020_HACER_x0020_: NovedadSeleccionada.SE_x0020_DEBE_x0020_HACER_x0020_ !== state.SE_x0020_DEBE_x0020_HACER_x0020_ ? state.SE_x0020_DEBE_x0020_HACER_x0020_ : NovedadSeleccionada.SE_x0020_DEBE_x0020_HACER_x0020_,
        STATUS_x0020_DE_x0020_INGRESO_x0: NovedadSeleccionada.STATUS_x0020_DE_x0020_INGRESO_x0 !== state.STATUS_x0020_DE_x0020_INGRESO_x0 ? state.STATUS_x0020_DE_x0020_INGRESO_x0 : NovedadSeleccionada.STATUS_x0020_DE_x0020_INGRESO_x0,
        TEMPORAL: NovedadSeleccionada.TEMPORAL !== state.TEMPORAL ? state.TEMPORAL : NovedadSeleccionada.TEMPORAL,
        TIPO_x0020_DE_x0020_CONTRATO: NovedadSeleccionada.TIPO_x0020_DE_x0020_CONTRATO !== state.TIPO_x0020_DE_x0020_CONTRATO ? state.TIPO_x0020_DE_x0020_CONTRATO : NovedadSeleccionada.TIPO_x0020_DE_x0020_CONTRATO,
        Tipo_x0020_de_x0020_documento_x0: NovedadSeleccionada.Tipo_x0020_de_x0020_documento_x0 !== state.Tipo_x0020_de_x0020_documento_x0 ? state.Tipo_x0020_de_x0020_documento_x0 : NovedadSeleccionada.Tipo_x0020_de_x0020_documento_x0,        
        TIPO_x0020_DE_x0020_VACANTE_x002: NovedadSeleccionada.TIPO_x0020_DE_x0020_VACANTE_x002 !== state.TIPO_x0020_DE_x0020_VACANTE_x002 ? state.TIPO_x0020_DE_x0020_VACANTE_x002 : NovedadSeleccionada.TIPO_x0020_DE_x0020_VACANTE_x002,
        tipodoc: NovedadSeleccionada.tipodoc !== state.tipodoc ? state.tipodoc : NovedadSeleccionada.tipodoc,
        Title: NovedadSeleccionada.Title !== state.Title ? state.Title : NovedadSeleccionada.Title,
        UNIDAD_x0020_DE_x0020_NEGOCIO_x0: NovedadSeleccionada.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 !== state.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 ? state.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 : NovedadSeleccionada.UNIDAD_x0020_DE_x0020_NEGOCIO_x0,    
        VALOR_x0020_GARANTIZADO: NovedadSeleccionada.VALOR_x0020_GARANTIZADO !== state.VALOR_x0020_GARANTIZADO ? state.VALOR_x0020_GARANTIZADO : NovedadSeleccionada.VALOR_x0020_GARANTIZADO,
        Cargo_x0020_de_x0020_la_x0020_pe: NovedadSeleccionada.Cargo_x0020_de_x0020_la_x0020_pe !== state.Cargo_x0020_de_x0020_la_x0020_pe ? state.Cargo_x0020_de_x0020_la_x0020_pe : NovedadSeleccionada.Cargo_x0020_de_x0020_la_x0020_pe,
      };
      await ContratosSvc.update(NovedadSeleccionada.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
    } finally {
        setLoading(false);
      }
  };

  const searchWorker = async (query: string): Promise<Novedad[]> => {
    const resp = await ContratosSvc.getAll({
      filter: `fields/Numero_x0020_identificaci_x00f3_ eq '${query}'`, // si NumeroDoc es texto
      top: 200,
    });

    const workers: Novedad[] = resp.items ?? [];
    setWorkers(workers);

    const seen = new Set<string>();

    const next: rsOption[] = workers
      .map(item => ({
        value: item.Id!, // solo el Id
        label: `Nombre: ${item.NombreSeleccionado} - Promocion - Cargo: ${item.CARGO} - Fecha de ingreso: ${toISODateTimeFlex(item.FECHA_x0020_REQUERIDA_x0020_PARA0)}.`,
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
      const { items, nextLink } = await ContratosSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
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
  }, [ContratosSvc]);

  const handleCancelProcess = React.useCallback(async (documento: string, RazonCancelacion: string) => {
    if(!novedadCanceladaSvc) return

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
}, [ContratosSvc]);



  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, errors, sorts, state, workers, workersOptions,
    nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, setField, handleSubmit, handleEdit, searchWorker, loadToReport, cleanState, loadFirstPage, handleCancelProcess
  };
}

