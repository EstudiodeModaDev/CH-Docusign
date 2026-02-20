import * as React from "react";
import "../AddContrato.css";
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import { formatPesosEsCO, numeroATexto, toNumberFromEsCO } from "../../../../../utils/Number";
import { useAuth } from "../../../../../auth/authProvider";
import { getTodayLocalISO } from "../../../../../utils/Date";
import { useDetallesPasosNovedades, usePasosNoveades } from "../../../../../Funcionalidades/GD/PasosNovedades";
import { useSalarios } from "../../../../../Funcionalidades/GD/Salario";
import { lookOtherInfo, } from "../../../../../utils/lookFor";
import { useHabeasData } from "../../../../../Funcionalidades/GD/HabeasData";
import { usePromocion } from "../../../../../Funcionalidades/GD/Promocion";
import { useCesaciones } from "../../../../../Funcionalidades/GD/Cesaciones";
import type { Novedad, NovedadErrors } from "../../../../../models/Novedades";
import { useAutomaticCargo } from "../../../../../Funcionalidades/GD/Niveles";
import { useRetail } from "../../../../../Funcionalidades/GD/Retail";
import { createBody, notifyTeam } from "../../../../../utils/mail";
import type { DetallesPasos } from "../../../../../models/Cesaciones";
import { ProcessDetail } from "../Cesaciones/procesoCesacion";
import { CancelProcessModal } from "../../../View/CancelProcess/CancelProcess";
import { safeLower } from "../../../../../utils/text";

/* ================== Option custom para react-select ================== */
export const Option = (props: OptionProps<desplegablesOption, false>) => {
  const { label } = props;

  return (
    <components.Option {...props}>
      <div className="rs-opt">
        <div className="rs-opt__text">
          <span className="rs-opt__title">{label}</span>
        </div>
      </div>
    </components.Option>
  );
};

export type SetField<T> = <K extends keyof T>(key: K, value: T[K]) => void;

type Props = {
  onClose: () => void;
  state: Novedad
  setField: SetField<Novedad>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Novedad) => void;
  errors: NovedadErrors
  searchRegister: (cedula: string) => Promise<Novedad | null>
  loadFirstPage: () => Promise<void>
  tipo: "new" | "edit" | "view"
  selectedNovedad?: Novedad
  setState: (n: Novedad) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivateProcessById: (id: string) => void
  title: string

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean
  cargoOptions: desplegablesOption[], 
  loadingCargo: boolean, 
  modalidadOptions: desplegablesOption[], 
  loadingModalidad: boolean,
  especificidadOptions: desplegablesOption[], 
  loadingEspecificdad: boolean, 
  etapasOptions: desplegablesOption[], 
  loadingEtapas: boolean, 
  nivelCargoOptions: desplegablesOption[], 
  loadinNivelCargo: boolean, 
  CentroCostosOptions: desplegablesOption[]
  loadingCC: boolean
  COOptions: desplegablesOption[]
  loadingCO: boolean, 
  UNOptions: desplegablesOption[]
  loadingUN: boolean,
  origenOptions: desplegablesOption[], 
  loadingOrigen: boolean
  tipoContratoOptions: desplegablesOption[], 
  loadingTipoContrato: boolean, 
  tipoVacanteOptions: desplegablesOption[], 
  loadingTipoVacante: boolean, 
  deptoOptions: desplegablesOption[], 
  loadingDepto: boolean, 
  dependenciaOptions: desplegablesOption[], 
  loadingDependencias: boolean
};

/* ================== Formulario ================== */
export default function FormContratacion({handleReactivateProcessById, title, handleCancelProcessbyId, setState, selectedNovedad, handleEdit, tipo, tipoContratoOptions, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, cargoOptions, loadingCargo, modalidadOptions, loadingModalidad, especificidadOptions, loadingEspecificdad, etapasOptions, loadingEtapas, nivelCargoOptions, loadinNivelCargo, CentroCostosOptions, loadingCC, COOptions, loadingCO, UNOptions, loadingUN, origenOptions, loadingOrigen, loadingTipoContrato, tipoVacanteOptions, loadingTipoVacante, deptoOptions, loadingDepto, dependenciaOptions, loadingDependencias, onClose, state, setField, handleSubmit, errors, searchRegister: searchNovedad, loadFirstPage }: Props) {
  const { Contratos, DetallesPasosNovedades, salarios, HabeasData, Promociones, Cesaciones, categorias, Retail, configuraciones, mail} = useGraphServices();
  const { searchRegister: searchHabeas} = useHabeasData(HabeasData);
  const { searchRegister: searchPromocion } = usePromocion(Promociones);
  const { searchRegister: searchRetail } = useRetail(Retail);
  const { searchRegister: searchCesacion } = useCesaciones(Cesaciones);
  const { loadSpecificLevel } = useAutomaticCargo(categorias);
  const { loadSpecificSalary } = useSalarios(salarios);
  const { loadPasosNovedad, rows, handleCompleteStep,  loading: loadingPasos, error: errorPasos, byId, decisiones, setDecisiones, motivos, setMotivos, } = usePasosNoveades();
  const { handleCreateAllSteps, loading: loadingDetalles, error: errorDetalles, rows: rowsDetalles, loadDetallesNovedades, calcPorcentaje} = useDetallesPasosNovedades(DetallesPasosNovedades, selectedNovedad ? selectedNovedad.Id : "")

  const opciones = [
    { value: "Escritorio", label: "Escritorio" },
    { value: "Silla", label: "Silla" },
    { value: "Escritorio/Silla", label: "Escritorio/Silla" },
  ];

  const isView = tipo === "view"

  const [selectedDepto, setSelectedDepto] = React.useState<string>("");
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [displaySalario, setDisplaySalario] = React.useState("");
  const [displayAuxilio, setDisplayAuxilio] = React.useState("");
  const [fechaFinalizacion, setFechaFinalizacion] = React.useState<boolean>(false);
  const [selecciones, setSelecciones] = React.useState<string[]>([]);
  const [conectividad, setConectividad] = React.useState<number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [planFinanciado, setPlanfinanciado] = React.useState<boolean>(false);
  const [garantizadoValor, setValorGarantizado] = React.useState<number>(0);
  const [porcentajeValor, setPorcentajeValor] = React.useState<number>(0);
  const [promedio, setPromedio] = React.useState<number>(0);
  const [minimo, setMinimo] = React.useState<number>(0);
  const [auxTransporte, setAuxTransporte] = React.useState<number>(0);
  const [grupoCVE, setGrupoCVE] = React.useState<string>("");
  const [porcentajeCompletacion, setPorcetanjeCompletacion] = React.useState<number>(0);
  const [cancelProcess, setCancelProcess] = React.useState<boolean>(false);
  const [flow, setFlow] = React.useState<boolean>(false)

  const { account } = useAuth();
  const today = getTodayLocalISO();

  /* ================== Deptos/Municipios ================== */
  const deptos = React.useMemo(() => {
    const set = new Set<string>();
    deptoOptions.forEach((i) => set.add(i.label));
    return Array.from(set).sort();
  }, [deptoOptions]);

  const municipiosFiltrados = React.useMemo(
    () => deptoOptions.filter((i) => i.label === selectedDepto),
    [deptoOptions, selectedDepto]
  );

  const deptoSelectOptions = React.useMemo(
    () =>
      deptos.map((d) => ({
        value: d,
        label: d,
      })),
    [deptos]
  );

  const municipioSelectOptions = React.useMemo(
    () =>
      municipiosFiltrados.map((m) => ({
        value: String(m.value),
        label: String(m.value),
      })),
    [municipiosFiltrados]
  );

  const ciudadesAllOptions = React.useMemo(() => {
    const set = new Set<string>();

    deptoOptions.forEach((i) => {
      const city = String(i.value ?? "").trim();
      if (city) set.add(city);
    });

    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((c) => ({ value: c, label: c }));
  }, [deptoOptions]);

  /* ================== Selected values ================== */
  const selectedEmpresa = empresaOptions.find((o) => safeLower(o.label) === safeLower(state.Empresa_x0020_que_x0020_solicita)) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => safeLower(o.label) === safeLower(state.tipodoc)) ?? null;
  const selectedCargo = cargoOptions.find((o) => safeLower(o.label) === safeLower(state.CARGO)) ?? null;
  const selectedModalidad = modalidadOptions.find((o) => safeLower(o.label) === safeLower(state.MODALIDAD_x0020_TELETRABAJO)) ?? null;
  const selectedEspecificidad = especificidadOptions.find((o) => safeLower(o.label) === safeLower(state.ESPECIFICIDAD_x0020_DEL_x0020_CA)) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => safeLower(o.label) === safeLower(state.NIVEL_x0020_DE_x0020_CARGO)) ?? null;
  const selectedCentroCostos = CentroCostosOptions.find((o) => safeLower(o.value) === safeLower(state.CODIGO_x0020_CENTRO_x0020_DE_x00)) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => safeLower(o.value) === safeLower(state.CENTRO_x0020_OPERATIVO_x0020_)) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => safeLower(o.value) === safeLower(state.ID_x0020_UNIDAD_x0020_DE_x0020_N)) ?? null;
  const selectedOrigenSeleccion = origenOptions.find((o) => safeLower(o.label) === safeLower(state.ORIGEN_x0020_DE_x0020_LA_x0020_S)) ?? null;
  const selectedTipoContrato = tipoContratoOptions.find((o) => safeLower(o.label) === safeLower(state.TIPO_x0020_DE_x0020_CONTRATO)) ?? null;
  const selectedTipoVacante = tipoVacanteOptions.find((o) => safeLower(o.label) === safeLower(state.TIPO_x0020_DE_x0020_VACANTE_x002)) ?? null;
  const selectedDependencia = dependenciaOptions.find((o) =>safeLower( o.label) === safeLower(state.DEPENDENCIA_x0020_)) ?? null;
  const selectedEtapa = etapasOptions.find((o) => safeLower(o.label) === safeLower(state.Etapa)) ?? null;

  /* ================== display salario ================== */
  React.useEffect(() => {
    if (state.SALARIO != null && state.SALARIO !== "") {
      const next = formatPesosEsCO(String(state.SALARIO));
      setDisplaySalario((prev) => (prev === next ? prev : next));
    } else {
      setDisplaySalario((prev) => (prev === "" ? prev : ""));
    }
  }, [state.SALARIO]);

  /* ================== display auxilio rodamiento ================== */
  React.useEffect(() => {
    if (state.Auxilio_x0020_de_x0020_rodamient != null && state.Auxilio_x0020_de_x0020_rodamient !== "") {
      const next = formatPesosEsCO(String(state.Auxilio_x0020_de_x0020_rodamient));
      setDisplayAuxilio((prev) => (prev === next ? prev : next));
    } else {
      setDisplayAuxilio((prev) => (prev === "" ? prev : ""));
    }
  }, [state.Auxilio_x0020_de_x0020_rodamient]);

  /* ================== Conectividad ================== */
  React.useEffect(() => {
    const dosSalarios = minimo*2;
    const valor = Number(state.SALARIO || 0);
    const cargo = (state.CARGO || "").toLowerCase();

    let nextValor = 0;
    let nextTexto = "";

    if (valor <= dosSalarios) {
      nextValor = auxTransporte;
      nextTexto = numeroATexto(Number(auxTransporte)).toLocaleUpperCase();;
    } else if (valor > dosSalarios || cargo.includes("aprendiz") || cargo.includes("practicante")) {
      nextValor = 46150;
      nextTexto = "Cuarenta y seis mil ciento noventa pesos";
    } else if(valor > dosSalarios || state.CARGO.toLocaleLowerCase().includes("aprendiz") || state.CARGO.toLocaleLowerCase().includes("practicante")){
      setConectividad(46150)
      setConectividadTexto("Cuarenta y seis mil ciento noventa pesos")
    }
 
    // Solo actualiza si cambia (evita loops)
    if (String(state.auxconectividadvalor ?? "") !== String(nextValor)) {
      setField("auxconectividadvalor", String(nextValor));
    }
    if (String(state.auxconectividadtexto ?? "") !== nextTexto) {
      setField("auxconectividadtexto", nextTexto.toUpperCase());
    } 

    // si igual quieres el display local:
    setConectividad(nextValor);
    setConectividadTexto(nextTexto);

    console.log(conectividad, conectividadTexto)
  }, [state.SALARIO, state.CARGO, state.auxconectividadvalor, state.auxconectividadtexto, setField,]);

  /* ================== Garantizado ================== */
  React.useEffect(() => {
    const salario = Number(state.SALARIO || 0);
    const porcentaje = Number(porcentajeValor || 0);

    const valor = Math.round(salario * (porcentaje / 100));

    setValorGarantizado((prev) => (prev === valor ? prev : valor));
    setField("VALOR_x0020_GARANTIZADO", String(valor));
    setField("Garantizado_x0020_en_x0020_letra", valor > 0 ? numeroATexto(valor).toUpperCase() : "");
  }, [state.SALARIO, porcentajeValor]);

  /* ================== CVE  ================== */
  React.useEffect(() => {
    const p =
      Number(state.AUTONOM_x00cd_A_x0020_ || 0) * 0.2 +
      Number(state.IMPACTO_x0020_CLIENTE_x0020_EXTE || 0) * 0.2 +
      Number(state.CONTRIBUCION_x0020_A_x0020_LA_x0 || 0) * 0.3 +
      Number(state.PRESUPUESTO_x0020_VENTAS_x002f_M || 0) * 0.3;

    const pRed = Math.floor(p);

    const g =
      pRed === 1 ? "Constructores" :
      pRed === 2 ? "Desarrolladores" :
      pRed === 3 ? "Imaginarios" :
      pRed === 4 ? "Soñadores" : "";

    setPromedio((prev) => (prev === p ? prev : p));
    setGrupoCVE((prev) => (prev === g ? prev : g));

    setField("PROMEDIO_x0020_", String(p));
    setField("GRUPO_x0020_CVE_x0020_", g);
  }, [
    state.AUTONOM_x00cd_A_x0020_,
    state.PRESUPUESTO_x0020_VENTAS_x002f_M,
    state.IMPACTO_x0020_CLIENTE_x0020_EXTE,
    state.CONTRIBUCION_x0020_A_x0020_LA_x0,
    setField,
  ]);

  /* ================== Salario recomendado por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificSalary(state.CARGO);

      if (cancelled) return;
      if (!salario) return;

      const recomendado = String(salario.Salariorecomendado ?? "");
      const actual = String(state.SALARIO ?? "");

      // Si ya está igual, no vuelvas a setear (evita loops por "mismo valor")
      if (recomendado && recomendado !== actual) {
        setField("SALARIO", recomendado as any);
        setField("salariotexto", numeroATexto(Number(recomendado)).toUpperCase());
      }
    };

    if (state.CARGO) run();

    return () => {
      cancelled = true;
    };
  }, [state.CARGO]);

  /* ================== Nivel por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificLevel(state.CARGO);

      if (cancelled) return;
      if (!salario) return;

      const recomendado = String(salario.Categoria ?? "");
      const actual = String(state.NIVEL_x0020_DE_x0020_CARGO ?? "");

      // Si ya está igual, no vuelvas a setear (evita loops por "mismo valor")
      if (recomendado && recomendado !== actual) {
        setField("NIVEL_x0020_DE_x0020_CARGO", recomendado as any);
      }
    };

    if (state.CARGO) run();

    return () => {
      cancelled = true;
    };
  }, [state.CARGO,]);

  /* ================== Usar Novedad ================== */
  React.useEffect(() => {
    if(selectedNovedad) setState(selectedNovedad)
  }, [selectedNovedad]);

  React.useEffect(() => {
    (async () => {
      const pct = await calcPorcentaje();
      setPorcetanjeCompletacion(pct);
    })();

  }, [selectedNovedad]);

  React.useEffect(() => {

    const run = async () => {
      const salario = (await configuraciones.get("1")).Valor
      const auxTransporte = await (await configuraciones.get("2")).Valor
      setMinimo(Number(salario))
      setAuxTransporte(Number(auxTransporte))
    };

    run();
  }, []);

  const handleCreateNovedad = async (e: React.FormEvent) => {
    if(tipo=== "new"){
      const created = await handleSubmit();

      if (created.ok) {
        await loadPasosNovedad();
        await handleCreateAllSteps(rows, created.created ?? "");
        const body = createBody(account?.name ?? "", "Contratación", state.NombreSeleccionado, state.Numero_x0020_identificaci_x00f3_, state.CARGO, state.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? "",)
        await notifyTeam(mail, "Nuevo registro en contratación - Gestor documental CH", body)
        await loadFirstPage()
        await onClose();
      }
    } else if(tipo=== "edit") {
      handleEdit(e, state)
    }
  };

  const searchPeople = React.useCallback(async (cedula: string) => {
    const persona = await  lookOtherInfo(cedula, {searchPromocion, searchNovedad, searchCesacion, searchHabeas, searchRetail})
    if(persona){
      setField("Numero_x0020_identificaci_x00f3_", persona.cedula)
      setField("NombreSeleccionado", persona.nombre)
      setField("Tipo_x0020_de_x0020_documento_x0", persona.tipoDoc)
      setField("Empresa_x0020_que_x0020_solicita", persona.empresa)
      setField("CORREO_x0020_ELECTRONICO_x0020_", persona.correo)
      setField("Departamento", persona.departamento)
      setField("CIUDAD", persona.ciudad)
      setField("CELULAR_x0020_", persona.celular)
      setField("DIRECCION_x0020_DE_x0020_DOMICIL", persona.direccion)
      setField("BARRIO_x0020_", persona.barrio)
    }
  }, []);

  const completeStep = React.useCallback( async (detalle: DetallesPasos, estado: string) => {
      await handleCompleteStep(detalle, estado);

      const porcentaje = await calcPorcentaje(); 

      if (Number(porcentaje) === 100) {
        const id = selectedNovedad?.Id;
        if (!id) return;

        await Contratos.update(id, { Estado: "Completado" });
      }
    },
    [handleCompleteStep, calcPorcentaje, selectedNovedad?.Id, Contratos]
  );

  const handleCancel = async (razon: string) => {
    await handleCancelProcessbyId(selectedNovedad!.Id ?? "", razon)
    setCancelProcess(false)
  };


  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        {flow ? <ProcessDetail 
                  titulo={"Detalles contratación  de: " + selectedNovedad!.Numero_x0020_identificaci_x00f3_ + " - " + selectedNovedad!.NombreSeleccionado}
                  selectedCesacion={selectedNovedad!}
                  onClose={() => setFlow(false)}
                  loadingPasos={loadingPasos}
                  errorPasos={errorPasos}
                  pasosById={byId}
                  decisiones={decisiones}
                  motivos={motivos}
                  setMotivos={setMotivos}
                  setDecisiones={setDecisiones}
                  handleCompleteStep={(detalle: DetallesPasos, estado: string) => completeStep(detalle, estado)}
                  detallesRows={rowsDetalles}
                  loadingDetalles={loadingDetalles}
                  errorDetalles={errorDetalles}
                  loadDetalles={() => loadDetallesNovedades()} 
                  proceso={"Nuevo"}/> :
        <>
          <h2 id="ft_title" className="ft-title">{title} {(tipo === "edit" || isView) ? ` - ${porcentajeCompletacion}` : null}</h2>

          <form className="ft-form" noValidate>

            {/* Número documento */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="numeroIdent">Número de identificación *</label>
              <input disabled={isView} id="numeroIdent" name="Numero_x0020_identificaci_x00f3_" type="number" placeholder="Ingrese el número de documento" value={state.Numero_x0020_identificaci_x00f3_ ?? ""} onChange={(e) => setField("Numero_x0020_identificaci_x00f3_", e.target.value)} autoComplete="off" required aria-required="true" maxLength={300}  onBlur={ (e) => searchPeople(e.target.value)}/>
              <small>{errors.Numero_x0020_identificaci_x00f3_}</small>
            </div>

            {/* ================= Tipo documento ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="tipoDocumento">Tipo de documento *</label>
              <Select<desplegablesOption, false>
                inputId="tipoDocumento"
                options={tipoDocOptions}
                placeholder={loadingTipo ? "Cargando opciones…" : "Buscar tipo de documento..."}
                value={selectedTipoDocumento}
                onChange={(opt) => {
                  setField("tipodoc", opt?.label ?? "");
                  setField("Tipo_x0020_de_x0020_documento_x0", (opt?.value as any) ?? "");
                }}
                classNamePrefix="rs"
                isDisabled={loadingTipo || isView}
                isLoading={loadingTipo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.tipodoc}</small>
            </div>

            {/* Abreviación tipo documento */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc">Abreviación tipo de documento *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.tipodoc ?? ""} readOnly/>
            </div>

            {/* Nombre seleccionado */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="nombreSeleccionado">Nombre del seleccionado *</label>
              <input disabled={isView} id="nombreSeleccionado" name="NombreSeleccionado" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.NombreSeleccionado ?? ""} onChange={(e) => setField("NombreSeleccionado", e.target.value.toUpperCase())} autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.NombreSeleccionado}</small>
            </div>

            {/* ================= Empresa ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="solicitante">Empresa que solicita *</label>
              <Select<desplegablesOption, false>
                inputId="solicitante"
                options={empresaOptions}
                placeholder={loadingEmp ? "Cargando opciones…" : "Buscar empresa..."}
                value={selectedEmpresa}
                onChange={(opt) => setField("Empresa_x0020_que_x0020_solicita", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingEmp || isView}
                isLoading={loadingEmp}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Empresa_x0020_que_x0020_solicita}</small>
            </div>

            {/* Correo */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
              <input disabled={isView} id="correo" name="CORREO_x0020_ELECTRONICO_x0020_" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.CORREO_x0020_ELECTRONICO_x0020_ ?? ""} onChange={(e) => setField("CORREO_x0020_ELECTRONICO_x0020_", e.target.value.toLowerCase())} required  aria-required="true" maxLength={300}/>
              <small>{errors.CORREO_x0020_ELECTRONICO_x0020_}</small>
            </div>

            {/* Fecha requerida para el ingreso */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaIngreso">Fecha requerida para el ingreso *</label>
              <input disabled={isView} id="fechaIngreso" name="FECHA_x0020_REQUERIDA_x0020_PARA0" type="date" value={state.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? ""} onChange={(e) => setField("FECHA_x0020_REQUERIDA_x0020_PARA0", e.target.value)} required aria-required="true"/>
              <small>{errors.FECHA_x0020_REQUERIDA_x0020_PARA0}</small>
            </div>

            {/* ================= Cargo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="cargo">Cargo *</label>
              <Select<desplegablesOption, false>
                inputId="cargo"
                options={cargoOptions}
                placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
                value={selectedCargo}
                onChange={(opt) => setField("CARGO", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingCargo || isView}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CARGO}</small>
            </div>

            {/* ¿Es aprendiz? */}
            <div className="ft-field">
              <label className="ft-label">¿Es aprendiz? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="aprendiz" value="Si" checked={!!state.Aprendiz} onChange={() => { 
                                                                                                setField("Aprendiz", true as any);
                                                                                                setFechaFinalizacion(true);
                                                                                              }}
                                                                                            />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="aprendiz" value="No" checked={!state.Aprendiz} onChange={() => {setField("Aprendiz", false as any); setFechaFinalizacion(true)}}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            <div className="ft-field">
              <label className="ft-label">¿Es practicante? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="practicante" value="Si" checked={!!state.Practicante} onChange={() => { 
                                                                                                setField("Practicante", true as any);
                                                                                                setFechaFinalizacion(true);
                                                                                              }}
                                                                                            />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="practicante" value="No" checked={!state.Practicante} onChange={() => {setField("Practicante", false as any); setFechaFinalizacion(true)}}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {(state.Aprendiz || state.Practicante) && (
              <>
                <div className="ft-field">
                  <label className="ft-label" htmlFor="universidad">Nombre de la universidad *</label>
                  <input disabled={isView} id="universidad" name="universidad" type="text" placeholder="Ingrese el nombre de la universidad" value={state.Universidad ?? ""} autoComplete="off" required aria-required="true" maxLength={300} onChange={(e) => setField("Universidad", e.target.value.toUpperCase())}/>
                  <small>{errors.Universidad}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="Nituniversidad">NIT de la universidad *</label>
                  <input disabled={isView} id="Nituniversidad" name="Nituniversidad" type="text" placeholder="Ingrese el NIT de la universidad" value={state.NitUniversidad ?? ""} required aria-required="true" maxLength={300} onChange={(e) => setField("NitUniversidad", e.target.value.toUpperCase())}/>
                  <small>{errors.NitUniversidad}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="coordinador">Nombre del(a) coordinador(a) de practicas *</label>
                  <input disabled={isView} id="coordinador" name="coordinador" type="text" placeholder="Ingrese el nombre del(a) coordinador(a) de practicas" value={state.Coordinadordepracticas ?? ""} aria-required="true" maxLength={300} onChange={(e) => setField("Coordinadordepracticas", e.target.value.toUpperCase())}/>
                  <small>{errors.Coordinadordepracticas}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="especialidad">{state.Aprendiz ? "Especialidad *" : "Programa *"}</label>
                  <input disabled={isView} id="especialidad" name="especialidad" type="text" placeholder={state.Aprendiz ? "Ingrese la especialidad *" : "Ingrese el programa *"} value={state.Especialidad ?? ""}  required aria-required="true" maxLength={300} onChange={(e) => setField("Especialidad", e.target.value.toUpperCase())} />
                  <small>{errors.Especialidad}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="Etapa">Etapa</label>
                  <Select<desplegablesOption, false>
                    inputId="Etapa"
                    options={etapasOptions}
                    placeholder={loadingEtapas ? "Cargando opciones…" : "Buscar etapa..."}
                    value={selectedEtapa}
                    onChange={(opt) => setField("Etapa", opt?.label ?? "")}
                    classNamePrefix="rs"
                    isDisabled={loadingEtapas || isView}
                    isLoading={loadingEtapas}
                    getOptionValue={(o) => String(o.value)}
                    getOptionLabel={(o) => o.label}
                    components={{ Option }}
                    isClearable
                  />
                  <small>{errors.Etapa}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="FechaNac">Fecha de nacimiento *</label>
                  <input disabled={isView} id="FechaNac" name="FechaNac" type="date" value={state.FechaNac ?? ""} required aria-required="true" maxLength={300} onChange={(e) => setField("FechaNac", e.target.value)} />
                  <small>{errors.FechaNac}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="FechaInicioLectiva">Fecha de inicio de etapa lectiva</label>
                  <input disabled={isView} id="FechaInicioLectiva" name="FechaInicioLectiva" type="date" value={state.FechaInicioLectiva ?? ""} required aria-required="true" maxLength={300} onChange={(e) => setField("FechaInicioLectiva", e.target.value)}/>
                  <small>{errors.FechaInicioLectiva}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="FechaFinalLectiva">Fecha final de etapa lectiva</label>
                  <input disabled={isView} id="FechaFinalLectiva" name="FechaFinalLectiva" type="date" value={state.FechaFinalLectiva ?? ""} required aria-required="true" maxLength={300} onChange={(e) => setField("FechaFinalLectiva", e.target.value)}/>
                  <small>{errors.FechaFinalLectiva}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="FechaInicioProductiva">Fecha de inicio de etapa productiva</label>
                  <input disabled={isView} id="FechaInicioProductiva" name="FechaInicioProductiva" type="date" value={state.FechaInicioProductiva ?? ""} required maxLength={300} onChange={(e) => setField("FechaInicioProductiva", e.target.value)}/>
                  <small>{errors.FechaInicioProductiva}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="FechaFinalProductiva">Fecha final de etapa productiva</label>
                  <input disabled={isView} id="FechaFinalProductiva" name="FechaFinalProductiva" type="date" value={state.FechaFinalProductiva ?? ""}  maxLength={300} onChange={(e) => setField("FechaFinalProductiva", e.target.value)} />
                  <small>{errors.FechaFinalProductiva}</small>
                </div>

                {/* ================= Ciudad ================= */}
                <div className="ft-field">
                  <label className="ft-label" htmlFor="ciudad">Ciudad de expedición del documento*</label>
                  <Select<desplegablesOption, false>
                    inputId="ciudadExpedicion"
                    options={ciudadesAllOptions}
                    placeholder={loadingDepto ? "Cargando ciudades…" : "Buscar ciudad..."}
                    value={state.LugarExpedicion ? { value: state.LugarExpedicion, label: state.LugarExpedicion } : null}
                    onChange={(opt) => setField("LugarExpedicion", opt?.value ?? "")}
                    classNamePrefix="rs"
                    isDisabled={loadingDepto || isView}
                    isClearable/>
                  <small>{errors.LugarExpedicion}</small>
                </div>
              </>
            )}

            {/* ================= Departamento ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="departamento">Departamento *</label>
              <Select<desplegablesOption, false>
                inputId="departamento"
                options={deptoSelectOptions}
                placeholder={loadingDepto ? "Cargando opciones…" : "Buscar departamento..."}
                value={
                  selectedDepto
                    ? { value: selectedDepto, label: selectedDepto }
                    : state.Departamento
                    ? { value: state.Departamento, label: state.Departamento }
                    : null
                }
                onChange={(opt) => {
                  const value = opt?.value ?? "";
                  setSelectedDepto(value);
                  setSelectedMunicipio("");
                  setField("Departamento", value.toUpperCase());
                }}
                classNamePrefix="rs"
                isDisabled={loadingDepto || isView}
                isLoading={loadingDepto}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Departamento}</small>
            </div>

            {/* ================= Ciudad ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="ciudad">Ciudad *</label>
              <Select<desplegablesOption, false>
                inputId="ciudad"
                options={municipioSelectOptions}
                placeholder={!selectedDepto ? "Selecciona un departamento..." : loadingDepto ? "Cargando municipios…" : "Selecciona un municipio..."}
                value={
                  selectedMunicipio
                    ? { value: selectedMunicipio, label: selectedMunicipio }
                    : state.CIUDAD
                    ? { value: state.CIUDAD, label: state.CIUDAD }
                    : null
                }
                onChange={(opt) => {
                  const value = opt?.value ?? "";
                  setSelectedMunicipio(value);
                  setField("CIUDAD", value.toUpperCase());
                }}
                classNamePrefix="rs"
                isDisabled={!selectedDepto || loadingCargo || isView}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CIUDAD}</small>
            </div>

            {/* ================= Modalidad trabajo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Modalidad de trabajo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={modalidadOptions}
                placeholder={loadingModalidad ? "Cargando opciones…" : "Buscar modalidad de trabajo..."}
                value={selectedModalidad}
                onChange={(opt) => setField("MODALIDAD_x0020_TELETRABAJO", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingModalidad || isView}
                isLoading={loadingModalidad}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.MODALIDAD_x0020_TELETRABAJO}</small>
            </div>

            {/* ================= Salario ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="SALARIO">Salario *</label>
              <input disabled={isView} id="SALARIO" name="SALARIO" type="text" placeholder="Ingrese el salario del seleccionado" value={displaySalario} required maxLength={300} onChange={(e) => {
                                                                                                                                                                  const raw = e.target.value;

                                                                                                                                                                  if (raw === "") {
                                                                                                                                                                    setDisplaySalario("");
                                                                                                                                                                    setField("SALARIO", "" as any);
                                                                                                                                                                    setField("salariotexto", "");
                                                                                                                                                                    return;
                                                                                                                                                                  }

                                                                                                                                                                  const numeric = toNumberFromEsCO(raw);
                                                                                                                                                                  const formatted = formatPesosEsCO(String(numeric));

                                                                                                                                                                  setDisplaySalario(formatted);
                                                                                                                                                                  setField("SALARIO", numeric as any);
                                                                                                                                                                  setField("salariotexto", numeroATexto(numeric).toUpperCase());
                                                                                                                                                                }}
                                                                                                                                                              />
              <small>{errors.SALARIO}</small>
            </div>

            {/* Salario en letras */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="salariotexto">Salario en letras *</label>
              <input id="salariotexto" name="salariotexto" type="text" placeholder="Salario en letras" value={state.salariotexto ?? ""} readOnly/>
            </div>

            {/* ¿Se hace ajuste de salario? */}
            <div className="ft-field">
              <label className="ft-label">¿Se hace ajuste de salario? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="ajuste" value="Si" checked={state.Ajustesalario === true} onChange={() => setField("Ajustesalario", true as any)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="ajuste" value="No" checked={state.Ajustesalario === false} onChange={() => setField("Ajustesalario", false as any)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.Ajustesalario && (
              <div className="ft-field">
                <label className="ft-label" htmlFor="SALARIO_x0020_AJUSTADO">Porcentaje de ajuste *</label>
                <input disabled={isView} id="SALARIO_x0020_AJUSTADO" name="SALARIO_x0020_AJUSTADO" type="text" placeholder="Porcentaje de ajuste" value={state.SALARIO_x0020_AJUSTADO ?? ""} onChange={(e) => setField("SALARIO_x0020_AJUSTADO", toNumberFromEsCO(e.target.value) as any)} maxLength={3}/>
                <small>{errors.SALARIO_x0020_AJUSTADO}</small>
              </div>
            )}

            {/* ¿Lleva garantizado? */}
            <div className="ft-field">
              <label className="ft-label">¿Lleva garantizado? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="garantizado" value="Si" checked={state.GARANTIZADO_x0020__x0020__x00bf_ === "Si"} onChange={() => setField("GARANTIZADO_x0020__x0020__x00bf_", "Si" as any)}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="garantizado" value="No" checked={state.GARANTIZADO_x0020__x0020__x00bf_ === "No"} onChange={() => setField("GARANTIZADO_x0020__x0020__x00bf_", "No" as any)}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.GARANTIZADO_x0020__x0020__x00bf_?.toLocaleLowerCase() === "si" && (
              <div className="ft-field">
                <label className="ft-label" htmlFor="porcentajeValor">Porcentaje del garantizado *</label>
                <input disabled={isView} id="porcentajeValor" name="porcentajeValor" type="text" placeholder="Porcentaje del garantizado" value={porcentajeValor} onChange={(e) => setPorcentajeValor(Number(e.target.value))} maxLength={3}/>
                <small>{errors.VALOR_x0020_GARANTIZADO}</small>

                <input id="VALOR_x0020_GARANTIZADO" name="VALOR_x0020_GARANTIZADO" type="text" placeholder="Total Garantizado" value={garantizadoValor ? formatPesosEsCO(String(garantizadoValor)) : ""} autoComplete="off" readOnly/>
              </div>
            )}

            {/* ¿Tiene auxilio de rodamiento? */}
            <div className="ft-field">
              <label className="ft-label">¿Tiene auxilio de rodamiento? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="rodamiento" value="Si" checked={!!state.Auxilioderodamientosiono} onChange={() => setField("Auxilioderodamientosiono", true as any)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="rodamiento" value="No" checked={!state.Auxilioderodamientosiono} onChange={() => setField("Auxilioderodamientosiono", false as any)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.Auxilioderodamientosiono && (
              <>
                <div className="ft-field">
                  <label className="ft-label" htmlFor="Auxilio_x0020_de_x0020_rodamient">Auxilio de rodamiento *</label>
                  <input disabled={isView} id="Auxilio_x0020_de_x0020_rodamient" name="Auxilio_x0020_de_x0020_rodamient" type="text" placeholder="Ingrese el auxilio de rodamiento del seleccionado"  value={displayAuxilio} maxLength={300} onChange={(e) => {
                                                                                                                                                                                                                              const raw = e.target.value;
                                                                                                                                                                                                                              if (raw === "") {
                                                                                                                                                                                                                                setDisplayAuxilio("");
                                                                                                                                                                                                                                setField("Auxilio_x0020_de_x0020_rodamient", "" as any);
                                                                                                                                                                                                                                setField("Auxilio_x0020_de_x0020_rodamient0", "" as any);
                                                                                                                                                                                                                                return;
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                              const numeric = toNumberFromEsCO(raw);
                                                                                                                                                                                                                              const formatted = formatPesosEsCO(String(numeric));
                                                                                                                                                                                                                              setDisplayAuxilio(formatted);
                                                                                                                                                                                                                              setField("Auxilio_x0020_de_x0020_rodamient", numeric as any);
                                                                                                                                                                                                                              setField("Auxilio_x0020_de_x0020_rodamient0", numeroATexto(numeric).toUpperCase());
                                                                                                                                                                                                                            }}
                                                                                                                                                                                                                          />
                  <small>{errors.Auxilio_x0020_de_x0020_rodamient}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="Auxilio_x0020_de_x0020_rodamient0">Auxilio de rodamiento en letras *</label>
                  <input disabled={isView} id="Auxilio_x0020_de_x0020_rodamient0" name="Auxilio_x0020_de_x0020_rodamient0" type="text" placeholder="Auxilio de rodamiento en letras" value={state.Auxilio_x0020_de_x0020_rodamient0 ?? ""} readOnly/>
                </div>
              </>
            )}

            {/* ¿Tiene fecha de finalizacion? */}
            <div className="ft-field">
              <label className="ft-label">¿Tiene fecha de finalización? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="finalizacion" value="Si" checked={!!fechaFinalizacion} onChange={() => setFechaFinalizacion(true)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="finalizacion" value="No" checked={!fechaFinalizacion} onChange={() => setFechaFinalizacion(false)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {fechaFinalizacion && (
              <div className="ft-field">
                <label className="ft-label" htmlFor="FECHA_x0020_REQUERIDA_x0020_PARA">Fecha de finalización *</label>
                <input disabled={isView} id="FECHA_x0020_REQUERIDA_x0020_PARA" name="FECHA_x0020_REQUERIDA_x0020_PARA" type="date" value={state.FECHA_x0020_REQUERIDA_x0020_PARA ?? ""}  onChange={(e) => setField("FECHA_x0020_REQUERIDA_x0020_PARA", e.target.value)}/>
              </div>
            )}

            <h3 className="full-fila">INFORMACIÓN ADICIONAL</h3>

            {/* Celular */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="celular">Celular *</label>
              <input disabled={isView} id="celular" name="CELULAR_x0020_" type="text" placeholder="Ingrese el número de celular" value={state.CELULAR_x0020_ ?? ""} onChange={(e) => setField("CELULAR_x0020_", e.target.value)} maxLength={300}/>
              <small>{errors.CELULAR_x0020_}</small>
            </div>

            {/* Dirección */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="direccion">Dirección de domicilio *</label>
              <input disabled={isView} id="direccion" name="DIRECCION_x0020_DE_x0020_DOMICIL" type="text" placeholder="Ingrese la dirección" value={state.DIRECCION_x0020_DE_x0020_DOMICIL ?? ""} onChange={(e) => setField("DIRECCION_x0020_DE_x0020_DOMICIL", e.target.value.toUpperCase())} maxLength={300}/>
              <small>{errors.DIRECCION_x0020_DE_x0020_DOMICIL}</small>
            </div>

            {/* Barrio */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="barrio">Barrio *</label>
              <input disabled={isView} id="barrio" name="BARRIO_x0020_" type="text" placeholder="Ingrese el barrio" value={state.BARRIO_x0020_ ?? ""} onChange={(e) => setField("BARRIO_x0020_", e.target.value.toUpperCase())} maxLength={300}/>
              <small>{errors.BARRIO_x0020_}</small>
            </div>

            {/* ================= Especificidad de cargo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="especificidad">Especificidad de cargo</label>
              <Select<desplegablesOption, false>
                inputId="especificidad"
                options={especificidadOptions}
                placeholder={loadingEspecificdad ? "Cargando opciones…" : "Buscar especificidad del cargo..."}
                value={selectedEspecificidad}
                onChange={(opt) => setField("ESPECIFICIDAD_x0020_DEL_x0020_CA", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingEspecificdad || isView}
                isLoading={loadingEspecificdad}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.ESPECIFICIDAD_x0020_DEL_x0020_CA}</small>
            </div>

            {/* ================= Nivel de cargo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="nivelCargo">Nivel de cargo *</label>
              <Select<desplegablesOption, false>
                inputId="nivelCargo"
                options={nivelCargoOptions}
                placeholder={loadinNivelCargo ? "Cargando opciones…" : "Buscar nivel de cargo..."}
                value={selectedNivelCargo}
                onChange={(opt) => setField("NIVEL_x0020_DE_x0020_CARGO", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadinNivelCargo || isView}
                isLoading={loadinNivelCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.NIVEL_x0020_DE_x0020_CARGO}</small>
            </div>

            {/* ¿Cargo critico? */}
            <div className="ft-field">
              <label className="ft-label">¿Cargo critico? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="critico" value="Si" checked={state.CARGO_x0020_CRITICO === "Si"} onChange={() => setField("CARGO_x0020_CRITICO", "Si" as any)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="critico" value="No" checked={state.CARGO_x0020_CRITICO === "No"} onChange={() => setField("CARGO_x0020_CRITICO", "No" as any)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* ================= Dependencia ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="dependencia">Dependencia *</label>
              <Select<desplegablesOption, false>
                inputId="dependencia"
                options={dependenciaOptions}
                placeholder={loadingDependencias ? "Cargando opciones…" : "Buscar dependencia..."}
                value={selectedDependencia}
                onChange={(opt) => setField("DEPENDENCIA_x0020_", (opt?.value as any) ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingDependencias || isView}
                isLoading={loadingDependencias}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.DEPENDENCIA_x0020_}</small>
            </div>

            {/* ================= Centro de costos ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="cc">Centro de costos *</label>
              <Select<desplegablesOption, false>
                inputId="cc"
                options={CentroCostosOptions}
                placeholder={loadingCC ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedCentroCostos}
                onChange={(opt) => {
                  setField("DESCRIPCION_x0020_DE_x0020_CENTR", opt?.label ?? "");
                  setField("CODIGO_x0020_CENTRO_x0020_DE_x00", (opt?.value as any) ?? "");
                }}
                classNamePrefix="rs"
                isDisabled={loadingCC || isView}
                isLoading={loadingCC}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CODIGO_x0020_CENTRO_x0020_DE_x00}</small>
            </div>

            <div className="ft-field">
              <label className="ft-label" htmlFor="codigoCC">Codigo centro de costos *</label>
              <input id="codigoCC" name="codigoCC" type="text" value={state.CODIGO_x0020_CENTRO_x0020_DE_x00 ?? ""} readOnly />
            </div>

            {/* ================= Centro Operativo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="co">Descripcion Centro Operativo *</label>
              <Select<desplegablesOption, false>
                inputId="co"
                options={COOptions}
                placeholder={loadingCO ? "Cargando opciones…" : "Buscar centro operativo..."}
                value={selectedCentroOperativo}
                onChange={(opt) => {
                  setField("DESCRIPCION_x0020_CENTRO_x0020_O", opt?.label ?? "");
                  setField("CENTRO_x0020_OPERATIVO_x0020_", (opt?.value as any) ?? "");
                }}
                classNamePrefix="rs"
                isDisabled={loadingCO || isView}
                isLoading={loadingCO}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CENTRO_x0020_OPERATIVO_x0020_}</small>
            </div>

            <div className="ft-field">
              <label className="ft-label" htmlFor="codigoCO">Codigo centro operativo *</label>
              <input id="codigoCO" name="codigoCO" type="text" value={state.CENTRO_x0020_OPERATIVO_x0020_ ?? ""} readOnly />
            </div>

            {/* ================= Unidad de negocio ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="un">Descripcion unidad de negocio *</label>
              <Select<desplegablesOption, false>
                inputId="un"
                options={UNOptions}
                placeholder={loadingUN ? "Cargando opciones…" : "Buscar unidad de negocio..."}
                value={selectedUnidadNegocio}
                onChange={(opt) => {
                  setField("UNIDAD_x0020_DE_x0020_NEGOCIO_x0", opt?.label ?? "");
                  setField("ID_x0020_UNIDAD_x0020_DE_x0020_N", (opt?.value as any) ?? "");
                }}
                classNamePrefix="rs"
                isDisabled={loadingUN || isView}
                isLoading={loadingUN}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.UNIDAD_x0020_DE_x0020_NEGOCIO_x0}</small>
            </div>

            <div className="ft-field">
              <label className="ft-label" htmlFor="codigoUN">Codigo unidad de negocio *</label>
              <input id="codigoUN" name="codigoUN" type="text" value={state.ID_x0020_UNIDAD_x0020_DE_x0020_N ?? ""} readOnly />
            </div>

            {/* ¿Personas a cargo? */}
            <div className="ft-field">
              <label className="ft-label">¿Personas a cargo? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="personas" value="Si" checked={state.PERSONAS_x0020_A_x0020_CARGO === "Si"} onChange={() => setField("PERSONAS_x0020_A_x0020_CARGO", "Si" as any)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="personas" value="No" checked={state.PERSONAS_x0020_A_x0020_CARGO === "No"} onChange={() => setField("PERSONAS_x0020_A_x0020_CARGO", "No" as any)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>
            
            {/* ================= Origen Seleccion ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="origen">Origen de la selección *</label>
              <Select<desplegablesOption, false>
                inputId="origen"
                options={origenOptions}
                placeholder={loadingOrigen ? "Cargando opciones…" : "Buscar origen..."}
                value={selectedOrigenSeleccion}
                onChange={(opt) => setField("ORIGEN_x0020_DE_x0020_LA_x0020_S", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingOrigen || isView}
                isLoading={loadingOrigen}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.ORIGEN_x0020_DE_x0020_LA_x0020_S}</small>
            </div>

            {/* ================= Tipo de contrato ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="tipoContrato">Tipo de contrato *</label>
              <Select<desplegablesOption, false>
                inputId="tipoContrato"
                options={tipoContratoOptions}
                placeholder={loadingTipoContrato ? "Cargando opciones…" : "Buscar tipo de contrato..."}
                value={selectedTipoContrato}
                onChange={(opt) => setField("TIPO_x0020_DE_x0020_CONTRATO", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingTipoContrato || isView}
                isLoading={loadingTipoContrato}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.TIPO_x0020_DE_x0020_CONTRATO}</small>
            </div>

            {/* ================= Tipo de vacante ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="tipoVacante">Tipo de vacante *</label>
              <Select<desplegablesOption, false>
                inputId="tipoVacante"
                options={tipoVacanteOptions}
                placeholder={loadingTipoVacante ? "Cargando opciones…" : "Buscar tipo de vacante..."}
                value={selectedTipoVacante}
                onChange={(opt) => setField("TIPO_x0020_DE_x0020_VACANTE_x002", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingTipoVacante || isView}
                isLoading={loadingTipoVacante}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.TIPO_x0020_DE_x0020_VACANTE_x002}</small>
            </div>

            {/* ================= Herramientas ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="herramientas">Herramientas que posee el colaborador</label>
              <Select
                inputId="herramientas"
                isMulti
                options={opciones}
                classNamePrefix="rs"
                value={selecciones.map((s) => ({ value: s, label: s }))}
                onChange={(opts) => {
                  const values = (opts ?? []).map((o: any) => o.value);
                  setSelecciones(values);
                  setField("HERRAMIENTAS_x0020_QUE_x0020_POS", values.join("; "));
                }}
                placeholder="Selecciona herramientas..."
                isDisabled={isView}
              />
            </div>

            {/* Fecha ajuste academico */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaAjuste">Fecha de ajuste academico</label>
              <input disabled={isView} id="fechaAjuste" name="FECHA_x0020_DE_x0020_AJUSTE_x002" type="date" value={state.FECHA_x0020_DE_x0020_AJUSTE_x002 ?? ""} onChange={(e) => setField("FECHA_x0020_DE_x0020_AJUSTE_x002", e.target.value)} autoComplete="off"/>
            </div>

            {/* Fecha entrega valoración */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaEntrega">Fecha de entrega de la valoración de potencial</label>
              <input disabled={isView} id="fechaEntrega" name="FECHA_x0020_DE_x0020_ENTREGA_x00" type="date" value={state.FECHA_x0020_DE_x0020_ENTREGA_x00 ?? ""} onChange={(e) => setField("FECHA_x0020_DE_x0020_ENTREGA_x00", e.target.value)} autoComplete="off"/>
            </div>

            {/* ¿Pertenece al modelo? */}
            <div className="ft-field">
              <label className="ft-label">¿Pertenece al modelo? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="modelo" value="Si" checked={!!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", true as any)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="modelo" value="No" checked={!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", false as any)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.Pertenecealmodelo && (
              <>
                <div className="ft-field">
                  <label className="ft-label" htmlFor="Autonomia">Autonomía *</label>
                  <select disabled={isView} name="Autonomia" value={String(state.AUTONOM_x00cd_A_x0020_ ?? "0")} onChange={(e) => setField("AUTONOM_x00cd_A_x0020_", e.target.value as any)}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.AUTONOM_x00cd_A_x0020_}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="presupuesto">Presupuesto ventas/magnitud económica *</label>
                  <select disabled={isView} name="presupuesto"value={String(state.PRESUPUESTO_x0020_VENTAS_x002f_M ?? "0")} onChange={(e) => setField("PRESUPUESTO_x0020_VENTAS_x002f_M", e.target.value as any)}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.PRESUPUESTO_x0020_VENTAS_x002f_M}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="impacto">Impacto cliente externo *</label>
                  <select disabled={isView} name="impacto" value={String(state.IMPACTO_x0020_CLIENTE_x0020_EXTE ?? "0")} onChange={(e) => setField("IMPACTO_x0020_CLIENTE_x0020_EXTE", e.target.value as any)}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.IMPACTO_x0020_CLIENTE_x0020_EXTE}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="contribucion">Contribución a la estrategia *</label>
                  <select disabled={isView} name="contribucion" value={String(state.CONTRIBUCION_x0020_A_x0020_LA_x0 ?? "0")} onChange={(e) => setField("CONTRIBUCION_x0020_A_x0020_LA_x0", e.target.value as any)}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.CONTRIBUCION_x0020_A_x0020_LA_x0}</small>
                </div>

                {/* Promedio */}
                <div className="ft-field">
                  <label className="ft-label" htmlFor="cve">Promedio *</label>
                  <input id="cve" name="cve" type="text" placeholder="Rellene los campos anteriores" value={promedio} readOnly />
                </div>

                {/* Grupo CVE */}
                <div className="ft-field">
                  <label className="ft-label" htmlFor="grupoCve">Grupo CVE *</label>
                  <input id="grupoCve" name="grupoCve" type="text" placeholder="Rellene los campos anteriores" value={grupoCVE} readOnly />
                </div>
              </>
            )}

            {/* ¿Nuevo equipo? */}
            <div className="ft-field">
              <label className="ft-label">¿Se debe hacer cargue de nuevo equipo de trabajo? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="nuevoequipo" value="Si" checked={state.SE_x0020_DEBE_x0020_HACER_x0020_ === "Si"} onChange={() => setField("SE_x0020_DEBE_x0020_HACER_x0020_", "Si" as any)} />
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="nuevoequipo" value="No" checked={state.SE_x0020_DEBE_x0020_HACER_x0020_ === "No"} onChange={() => setField("SE_x0020_DEBE_x0020_HACER_x0020_", "No" as any)} />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* Plan financiado */}
            <div className="ft-field">
              <label className="ft-label">¿Tendra plan financiado por EDM? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="plan" value="Si" checked={planFinanciado} onChange={() => setPlanfinanciado(true)}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="plan"  value="No" checked={!planFinanciado} onChange={() => setPlanfinanciado(false)}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* Fecha reporte ingreso */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="FechaReporte">Fecha reporte ingreso *</label>
              <input id="FechaReporte" name="FechaReporte" type="date" value={today} readOnly />
            </div>

            {/* Información enviada por */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="enviadaPor">Información enviada por *</label>
              <input id="enviadaPor" name="enviadaPor" type="text" value={account?.name ?? ""} readOnly />
            </div>
          </form>
        </>
      }

        {/* Acciones */}
        <div className="ft-actions">
            <button disabled={isView || selectedNovedad?.Estado === "Cancelado"} type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreateNovedad(e)}>
              {isView || selectedNovedad?.Estado === "Cancelado" ? "No se puede editar este registro ya que fue usado" : "Guardar"}
            </button> 
            { isView || tipo === "edit" ?
              <button type="submit" className="btn btn-xs" onClick={() => setFlow(true)}>Detalles</button> : null
            }
            { (isView || tipo === "edit") ?
              <button type="submit" className="btn btn-xs btn-danger" onClick={() => {
                                                                        selectedNovedad?.Estado === "Cancelado" ? 
                                                                          handleReactivateProcessById(selectedNovedad.Id ?? "") : 
                                                                          setCancelProcess(true)}}
                                                                        >
                {selectedNovedad?.Estado !== "Cancelado" ? "Cancelar proceso" : "Reactivar proceso"}
              </button> : null
            }
          <button type="button" className="btn btn-xs" onClick={onClose}>Cancelar</button>
        </div>
        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
      </section>
    </div>
  );
}
