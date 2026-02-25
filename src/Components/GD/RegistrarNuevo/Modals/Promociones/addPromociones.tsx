import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import {formatPesosEsCO, numeroATexto, toNumberFromEsCO,} from "../../../../../utils/Number";
import { useAuth } from "../../../../../auth/authProvider";
import { getTodayLocalISO, toISODateFlex } from "../../../../../utils/Date";
import { useDetallesPasosPromocion, usePasosPromocion } from "../../../../../Funcionalidades/GD/PasosPromocion";
import { useSalarios } from "../../../../../Funcionalidades/GD/Salario";
import { lookOtherInfo } from "../../../../../utils/lookFor";
import { useHabeasData } from "../../../../../Funcionalidades/GD/HabeasData";
import { useCesaciones } from "../../../../../Funcionalidades/GD/Cesaciones";
import { useContratos } from "../../../../../Funcionalidades/GD/Contratos";
import { useAutomaticCargo } from "../../../../../Funcionalidades/GD/Niveles";
import type { Promocion, PromocionErrors } from "../../../../../models/Promociones";
import type { SetField } from "../Contrato/addContrato";
import { useRetail } from "../../../../../Funcionalidades/GD/Retail";
import { createBody, notifyTeam } from "../../../../../utils/mail";
import { safeLower } from "../../../../../utils/text";
import type { DetallesPasos } from "../../../../../models/Cesaciones";
import { CancelProcessModal } from "../../../View/CancelProcess/CancelProcess";
import { ProcessDetail } from "../Cesaciones/procesoCesacion";

/* ================== Option custom para react-select ================== */
const Option = (props: OptionProps<desplegablesOption, false>) => {
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

type Props = {
  onClose: () => void;
  state: Promocion
  setField: SetField<Promocion>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Promocion) => void;
  errors: PromocionErrors
  searchRegister: (cedula: string) => Promise<Promocion | null>
  loadFirstPage: () => Promise<void>
  tipo: "new" | "edit" | "view"
  selectedPromocion?: Promocion
  setState: (n: Promocion) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivateProcessById: (id: string) => void
  title: string
  submitting: boolean

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
export default function FormPromocion({submitting, handleReactivateProcessById, title, handleCancelProcessbyId, setState, selectedPromocion, handleEdit, tipo, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, cargoOptions, loadingCargo, modalidadOptions, loadingModalidad, especificidadOptions, loadingEspecificdad, nivelCargoOptions, loadinNivelCargo, CentroCostosOptions, loadingCC, COOptions, loadingCO, UNOptions, loadingUN, tipoVacanteOptions, loadingTipoVacante, deptoOptions, loadingDepto, dependenciaOptions, loadingDependencias, onClose, state, setField, handleSubmit, errors, searchRegister: searchPromocion, loadFirstPage }: Props) {
  const { Promociones, Contratos, DetallesPasosPromocion, salarios, HabeasData, Cesaciones, categorias, Retail, configuraciones, mail} = useGraphServices();
  const { searchRegister: searchHabeas} = useHabeasData(HabeasData);
  const { searchRegister: searchNovedad } = useContratos(Contratos);
  const { searchRegister: searchCesacion } = useCesaciones(Cesaciones);
  const { searchRegister: searchRetail } = useRetail(Retail);
  const { loadSpecificLevel } = useAutomaticCargo(categorias);
  const { loadSpecificSalary } = useSalarios(salarios);
  const { loadPasosPromocion, rows, loading: loadinPasosPromocion, error: errorPasosPromocion, byId, decisiones, setDecisiones, motivos, setMotivos, handleCompleteStep} = usePasosPromocion()
  const { handleCreateAllSteps, calcPorcentaje, rows: rowsDetalles, loading: loadingDetalles, error: errorDetalles, loadDetallesPromocion,} = useDetallesPasosPromocion(DetallesPasosPromocion, selectedPromocion?.Id)


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
    return Array.from(set).sort(); // array de deptos únicos
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

  // Opciones para el select de Municipio según el depto elegido
  const municipioSelectOptions = React.useMemo(
    () =>
      municipiosFiltrados.map((m) => ({
        value: String(m.value), // Municipio
        label: String(m.value),
      })),
    [municipiosFiltrados]
  );

  /* ================== Selected values ================== */
  const selectedEmpresa = empresaOptions.find((o) => safeLower(o.label) === safeLower(state.EmpresaSolicitante)) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => safeLower(o.label) === safeLower(state.TipoDoc)) ?? null;
  const selectedCargo = cargoOptions.find((o) => safeLower(o.label) === safeLower(state.Cargo)) ?? null;
  const selectedModalidad = modalidadOptions.find((o) => safeLower(o.label) === safeLower(state.ModalidadTeletrabajo)) ?? null;
  const selectedEspecificidad = especificidadOptions.find((o) => safeLower(o.label) === safeLower(state.EspecificidadCargo)) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => safeLower(o.label) === safeLower(state.NivelCargo)) ?? null;
  const selectedCentroCostos = CentroCostosOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoCentroCostos)) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => safeLower(o.value) === safeLower(state.IDUnidadNegocio)) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => safeLower(o.value) === safeLower(state.IDUnidadNegocio)) ?? null;
  const selectedTipoVacante = tipoVacanteOptions.find((o) => safeLower(o.label) === safeLower(state.TipoVacante)) ?? null;
  const selectedDependencia = dependenciaOptions.find((o) =>safeLower( o.label) === safeLower(state.Dependencia)) ?? null;
  const opcionesTipoNomina = [{ value: "Retail", label: "Retail" }, { value: "Administrativa", label: "Administrativa" },];

  /* ================== display salario ================== */
  React.useEffect(() => {
    if (state.Salario != null && state.Salario !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.Salario)));
    } else {
      setDisplaySalario("");
    }
  }, [state.Salario]);

  /* ================== display auxilio rodamiento ================== */
  React.useEffect(() => {
    if (
      state.AuxilioRodamiento != null && state.AuxilioRodamiento !== ""
    ) {
      setDisplayAuxilio(formatPesosEsCO(String(state.AuxilioRodamiento)));
    } else {
      setDisplayAuxilio("");
    }
  }, [state.AuxilioRodamiento]);

  /* ================== Conectividad ================== */
  React.useEffect(() => {
    const dosSalarios = minimo*2;
    const valor = Number(state.Salario || 0);
    const cargo = (state.Cargo || "").toLowerCase();

    let nextValor = 0;
    let nextTexto = "";

    if (valor <= dosSalarios) {
      nextValor = auxTransporte;
      nextTexto = numeroATexto(Number(auxTransporte)).toLocaleUpperCase();
    } else if (valor > dosSalarios || cargo.includes("aprendiz") || cargo.includes("practicante")) {
      nextValor = 46150;
      nextTexto = "Cuarenta y seis mil ciento noventa pesos";
    } else if(valor > dosSalarios || state.Cargo.toLocaleLowerCase().includes("aprendiz") || state.Cargo.toLocaleLowerCase().includes("practicante")){
      setConectividad(46150)
      setConectividadTexto("Cuarenta y seis mil ciento noventa pesos")
    }
 
    // Solo actualiza si cambia (evita loops)
    if (String(state.AuxilioValor ?? "") !== String(nextValor)) {
      setField("AuxilioValor", String(nextValor));
    }
    if (String(state.AuxilioValor ?? "") !== nextTexto) {
      setField("AuxilioValor", nextTexto.toUpperCase());
    } 

    // si igual quieres el display local:
    setConectividad(nextValor);
    setConectividadTexto(nextTexto);

    console.log(conectividad, conectividadTexto)
  }, [state.Salario, state.Cargo,]);

  /* ================== Garantizado ================== */
  React.useEffect(() => {
    const salario = Number(state.Salario || 0);
    const porcentaje = Number(porcentajeValor || 0);

    const valor = Math.round(salario * (porcentaje / 100)); 

    setValorGarantizado(valor);
    setField("ValorGarantizado", String(valor));
    setField("GarantizadoLetras", valor > 0 ? numeroATexto(valor) : "");
  }, [state.Salario, porcentajeValor, ]);

  /* ================== CVE  ================== */
  React.useEffect(() => {
    let promedio
    promedio = 
      (Number(state.Autonomia) * 0.2) + 
      (Number(state.ImpactoClienteExterno) * 0.2)+
      (Number(state.ContribucionaLaEstrategia) * 0.3) +
      (Number(state.PresupuestoVentasMagnitudEconomi) * 0.3)  
    setPromedio(promedio)
    const promedioRedondeado = Math.floor(promedio)
    switch(promedioRedondeado){
      case 1: {setGrupoCVE("Constructores");} break;
      case 2: setGrupoCVE("Desarrolladores"); break;
      case 3: setGrupoCVE("Imaginarios"); break;
      case 4: setGrupoCVE("Soñadores"); break;
      default: setGrupoCVE("")
    }
    setField("Promedio", String(promedio));
    setField("GrupoCVE", grupoCVE)

  }, [state.Autonomia, state.PresupuestoVentasMagnitudEconomi, state.ImpactoClienteExterno, state.ContribucionaLaEstrategia, grupoCVE]);

  /* ================== Salario recomendado por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificSalary(state.Cargo);

      if (!cancelled && salario !== null) {
        setField("Salario", salario.Salariorecomendado);
        setField("SalarioTexto", numeroATexto(Number(salario.Salariorecomendado)))
      }
    };

    if (state.Cargo) run();

    return () => {
      cancelled = true;
    };
  }, [state.Cargo,]);

  /* ================== Nivel por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificLevel(state.Cargo);

      if (cancelled) return;
      if (!salario) return;

      const recomendado = String(salario.Categoria ?? "");
      const actual = String(state.NivelCargo ?? "");

      // Si ya está igual, no vuelvas a setear (evita loops por "mismo valor")
      if (recomendado && recomendado !== actual) {
        setField("NivelCargo", recomendado as any);
      }
    };

    if (state.Cargo) run();

    return () => {
      cancelled = true;
    };
  }, [state.Cargo,]);

  /* ================== Usar Novedad ================== */
  React.useEffect(() => {
    if(selectedPromocion) setState(selectedPromocion)
  }, [selectedPromocion]);

  React.useEffect(() => {
    (async () => {
      const pct = await calcPorcentaje();
      setPorcetanjeCompletacion(pct);
    })();

  }, [selectedPromocion]);

  React.useEffect(() => {

    const run = async () => {
      const salario = (await configuraciones.get("1")).Valor
      const auxTransporte = await (await configuraciones.get("2")).Valor
      setMinimo(Number(salario))
      setAuxTransporte(Number(auxTransporte))
    };

    run();
  }, []);


  const handleCreatePromotion = async (e: React.FormEvent) => {
    if(tipo=== "new"){
      const created = await handleSubmit();

      if(created.ok){
        await loadPasosPromocion()
        await handleCreateAllSteps(rows, created.created ?? "")
        const body = createBody(account?.name ?? "", "Promociones", state.NombreSeleccionado, state.NumeroDoc, state.Cargo, state.FechaIngreso ?? "")
        await notifyTeam(mail, "Nuevo registro en Promociones - Gestor documental CH", body)
        await onClose()
        await loadFirstPage()
      }
    } else if(tipo=== "edit") {
      handleEdit(e, selectedPromocion!)
    }
  };

  const searchPeople = React.useCallback(async (cedula: string) => {
    const persona = await  lookOtherInfo(cedula, {searchPromocion, searchNovedad, searchCesacion, searchHabeas, searchRetail})
    if(persona){
      setField("NumeroDoc", persona.cedula)
      setField("NombreSeleccionado", persona.nombre)
      setField("TipoDoc", persona.tipoDoc)
      setField("EmpresaSolicitante", persona.empresa)
      setField("Correo", persona.correo)
      setField("Departamento", persona.departamento)
      setField("Ciudad", persona.ciudad)
    }
  }, []);

  const completeStep = React.useCallback( async (detalle: DetallesPasos, estado: string) => {
      await handleCompleteStep(detalle, estado);

      const porcentaje = await calcPorcentaje(); 

      if (Number(porcentaje) === 100) {
        const id = selectedPromocion?.Id;
        if (!id) return;

        await Promociones.update(id, { Estado: "Completado" });
      }
    },
    [handleCompleteStep, calcPorcentaje, selectedPromocion?.Id, Promociones]
  );

  const handleCancel = async (razon: string) => {
    await handleCancelProcessbyId(selectedPromocion!.Id ?? "", razon)
    setCancelProcess(false)
  };

  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        {flow ? <ProcessDetail 
                  titulo={"Detalles contratación  de: " + selectedPromocion!.NumeroDoc + " - " + selectedPromocion!.NombreSeleccionado}
                  selectedCesacion={selectedPromocion!}
                  onClose={() => setFlow(false)}
                  loadingPasos={loadinPasosPromocion}
                  errorPasos={errorPasosPromocion}
                  pasosById={byId}
                  decisiones={decisiones}
                  motivos={motivos}
                  setMotivos={setMotivos}
                  setDecisiones={setDecisiones}
                  handleCompleteStep={(detalle: DetallesPasos, estado: string) => completeStep(detalle, estado)}
                  detallesRows={rowsDetalles}
                  loadingDetalles={loadingDetalles}
                  errorDetalles={errorDetalles}
                  loadDetalles={() => loadDetallesPromocion()} 
                  proceso={"Nuevo"}/> :
        <>
          <h2 id="ft_title" className="ft-title">{title} {(tipo === "edit" || isView) ? ` - ${porcentajeCompletacion}` : null}</h2>

          <form className="ft-form" noValidate>
            {/* Número documento */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="numeroIdent">Número de identificación *</label>
              <input id="numeroIdent" name="Numero_x0020_identificaci_x00f3_" type="number" placeholder="Ingrese el número de documento" value={state.NumeroDoc ?? ""} onChange={(e) => setField("NumeroDoc", e.target.value)} onBlur={ (e) => searchPeople(e.target.value)}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.NumeroDoc}</small>
            </div>

            {/* ================= Tipo documento ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="tipoDocumento">Tipo de documento *</label>
              <Select<desplegablesOption, false>
                inputId="tipoDocumento"
                options={tipoDocOptions}
                placeholder={loadingTipo ? "Cargando opciones…" : "Buscar tipo de documento..."}
                value={selectedTipoDocumento}
                onChange={(opt) => {setField("AbreviacionTipoDoc", opt?.value ?? ""); setField("TipoDoc", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingTipo}
                isLoading={loadingTipo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.TipoDoc}</small>
            </div>

            {/* Abreviación tipo documento (solo lectura con la abreviación seleccionada) */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Abreviación tipo de documento *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.AbreviacionTipoDoc ?? ""} readOnly/>
            </div>

            {/* Nombre seleccionado */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="nombreSeleccionado"> Nombre del seleccionado *</label>
              <input id="nombreSeleccionado" name="NombreSeleccionado" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.NombreSeleccionado ?? ""} onChange={(e) => setField("NombreSeleccionado", e.target.value.toUpperCase())} autoComplete="off" required aria-required="true" maxLength={300}/>
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
                onChange={(opt) => setField("EmpresaSolicitante", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingEmp}
                isLoading={loadingEmp}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.EmpresaSolicitante}</small>
            </div>

            {/* Correo */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
              <input id="correo" name="CORREO_x0020_ELECTRONICO_x0020_" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.Correo ?? ""} onChange={(e) => setField("Correo", e.target.value)}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.Correo}</small>
            </div>

            {/* Fecha requerida para el ingreso */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaIngreso">Fecha requerida para la promoción *</label>
              <input id="fechaIngreso" name="FECHA_x0020_REQUERIDA_x0020_PARA0" type="date" value={toISODateFlex(state.FechaIngreso) ?? ""} onChange={(e) => setField("FechaIngreso", e.target.value)}
                autoComplete="off" required aria-required="true"/>
              <small>{errors.FechaIngreso}</small>
            </div>

            {/* ================= Cargo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="cargo">Nuevo Cargo * </label>
              <Select<desplegablesOption, false>
                inputId="cargo"
                options={cargoOptions}
                placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
                value={selectedCargo}
                onChange={(opt) => {setField("Cargo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingCargo}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Cargo}</small>
            </div>

            {/* ================= Departamento ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="departamento">Departamento *</label>
              <Select<desplegablesOption, false>
                inputId="departamento"
                options={deptoSelectOptions}
                placeholder={loadingDepto ? "Cargando opciones…" : "Buscar departamento..."}
                value={selectedDepto ? { value: selectedDepto, label: selectedDepto } : state.Departamento ? { value: state.Departamento, label: state.Departamento } : null}
                onChange={(opt) => {
                  const value = opt?.value ?? "";
                  setSelectedDepto(value);
                  setSelectedMunicipio("");           
                  setField("Departamento", value);  
                }}
                classNamePrefix="rs"
                isDisabled={loadingDepto}
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
                value={ selectedMunicipio ? { value: selectedMunicipio, label: selectedMunicipio } : state.Ciudad ? { value: state.Ciudad, label: state.Ciudad } : null}
                onChange={(opt) => { const value = opt?.value ?? ""; setSelectedMunicipio(value); setField("Ciudad", value);}}
                classNamePrefix="rs"
                isDisabled={!selectedDepto  || loadingCargo}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Ciudad}</small>
            </div>

            {/* ================= Modalidad trabajo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Modalidad de trabajo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={modalidadOptions}
                placeholder={loadingModalidad ? "Cargando opciones…" : "Buscar modalidad de trabajo..."}
                value={selectedModalidad}
                onChange={(opt) => {setField("ModalidadTeletrabajo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingModalidad}
                isLoading={loadingModalidad}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.ModalidadTeletrabajo}</small>
            </div>

            {/* ================= Salario ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="SALARIO">Nuevo Salario *</label>
              <input id="SALARIO" name="SALARIO" type="text" placeholder="Ingrese el salario del seleccionado" value={displaySalario} autoComplete="off" required aria-required="true" maxLength={300}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setDisplaySalario("");
                    setField("Salario", "" as any);
                    setField("SalarioTexto", "");
                    return;
                  }
                  const numeric = toNumberFromEsCO(raw); // 1500000
                  const formatted = formatPesosEsCO(String(numeric)); // 1.500.000
                  setDisplaySalario(formatted);
                  setField("Salario", numeric as any);
                  setField("SalarioTexto", numeroATexto(numeric));
                }}
              />
              <small>{errors.Salario}</small>
            </div>

            {/* Salario en letras */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="salariotexto">Nuevo salario en letras *</label>
              <input id="salariotexto" name="salariotexto" type="text" placeholder="Salario en letras"  value={state.SalarioTexto ?? ""}  readOnly/>
            </div>

            {/* ¿Se hace ajuste de salario? */}
            <div className="ft-field">
              <label className="ft-label">¿Se hace ajuste de salario? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="ajuste" value="Si" checked={state.AjusteSioNo === true} onChange={() => setField("AjusteSioNo", true)}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="ajuste" value="No" checked={state.AjusteSioNo === false} onChange={() => setField("AjusteSioNo", false)}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.AjusteSioNo && (
              <div className="ft-field">
                <label className="ft-label" htmlFor="SALARIO_x0020_AJUSTADO">Porcentaje de ajuste *</label>
                <input id="SALARIO_x0020_AJUSTADO" name="SALARIO_x0020_AJUSTADO" type="text" placeholder="Porcentaje de ajuste" value={state.SalarioAjustado ?? ""}
                  onChange={(e) => setField("SalarioAjustado", toNumberFromEsCO(e.target.value) as any)} autoComplete="off" required aria-required="true" maxLength={3}/>
                <small>{errors.SalarioAjustado}</small>
              </div>
            )}

            {/* ¿Lleva garantizado? */}
            <div className="ft-field">
              <label className="ft-label">¿Lleva garantizado? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="garantizado" value="Si" checked={state.Garantizado_x00bf_SiNo_x003f_ === "Si"} onChange={() => setField("Garantizado_x00bf_SiNo_x003f_", "Si")}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="garantizado" value="No" checked={state.Garantizado_x00bf_SiNo_x003f_ === "No"} onChange={() => setField("Garantizado_x00bf_SiNo_x003f_", "No")}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.Garantizado_x00bf_SiNo_x003f_?.toLocaleLowerCase() === "si" && (
              <div className="ft-field">
                <label className="ft-label" htmlFor="porcentajeValor">Porcentaje del garantizado *</label>
                <input id="porcentajeValor" name="porcentajeValor" type="text" placeholder="Porcentaje del garantizado" value={porcentajeValor} 
                    onChange={(e) => setPorcentajeValor(Number(e.target.value))} autoComplete="off" required aria-required="true" maxLength={3}/>
                <small>{errors.Garantizado_x00bf_SiNo_x003f_}</small>

                <input id="VALOR_x0020_GARANTIZADO" name="VALOR_x0020_GARANTIZADO" type="text" placeholder="Total Garantizado" value={garantizadoValor}  autoComplete="off" required aria-required="true" maxLength={3}/>
                
              </div>
            )}

            {/* ¿Tiene auxilio de rodamiento? */}
            <div className="ft-field">
              <label className="ft-label">¿Tiene auxilio de rodamiento? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="rodamiento" value="Si" checked={!!state.AuxilioRodamientoSioNo} onChange={() => setField("AuxilioRodamientoSioNo", true)}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="rodamiento" value="No" checked={!state.AuxilioRodamientoSioNo} onChange={() => setField("AuxilioRodamientoSioNo", false)}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.AuxilioRodamientoSioNo && (
              <>
                <div className="ft-field">
                  <label className="ft-label" htmlFor="Auxilio_x0020_de_x0020_rodamient">Auxilio de rodamiento *</label>
                  <input id="Auxilio_x0020_de_x0020_rodamient" name="Auxilio_x0020_de_x0020_rodamient" type="text" placeholder="Ingrese el auxilio de rodamiento del seleccionado" value={displayAuxilio} autoComplete="off"
                    required aria-required="true" maxLength={300} onChange={(e) => {
                                                                        const raw = e.target.value;
                                                                        if (raw === "") {
                                                                            setDisplayAuxilio("");
                                                                            setField("AuxilioRodamiento", "" as any);
                                                                            return;
                                                                        }
                                                                        const numeric = toNumberFromEsCO(raw);
                                                                        const formatted = formatPesosEsCO(String(numeric));
                                                                        setDisplayAuxilio(formatted);
                                                                        setField("AuxilioRodamiento", numeric as any);
                                                                        setField("AuxilioRodamientoLetras", numeroATexto(numeric));
                                                                        }}
                                                                    />
                <small>{errors.AuxilioRodamiento}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="Auxilio_x0020_de_x0020_rodamient0" > Auxilio de rodamiento en letras * </label>
                  <input id="Auxilio_x0020_de_x0020_rodamient0" name="Auxilio_x0020_de_x0020_rodamient0" type="text" placeholder="Auxilio de rodamiento en letras" value={state.AuxilioRodamientoLetras ?? ""} readOnly/>
                </div>
              </>
            )}

            <h3 className="full-fila">INFORMACIÓN ADICIONAL</h3>


            {/* ================= Especificidad de cargo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Especificidad de cargo</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={especificidadOptions}
                placeholder={loadingEspecificdad ? "Cargando opciones…" : "Buscar especificidad del cargo..."}
                value={selectedEspecificidad}
                onChange={(opt) => {setField("EspecificidadCargo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingEspecificdad}
                isLoading={loadingEspecificdad}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.EspecificidadCargo}</small>
            </div>

            {/* ================= Nivel de cargo ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Nivel de cargo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={nivelCargoOptions}
                placeholder={loadinNivelCargo ? "Cargando opciones…" : "Buscar nivel de cargo..."}
                value={selectedNivelCargo}
                onChange={(opt) => {setField("NivelCargo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadinNivelCargo}
                isLoading={loadinNivelCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.NivelCargo}</small>
            </div>

            {/* ¿Cargo critico? */}
            <div className="ft-field">
              <label className="ft-label"> ¿Cargo critico? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="critico" value="Si" checked={state.CargoCritico === "Si"} onChange={() => setField("CargoCritico", "Si")}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="critico" value="No" checked={state.CargoCritico === "No"} onChange={() => setField("CargoCritico", "No")}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* ================= Dependencia ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Dependencia *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={dependenciaOptions}
                placeholder={loadingDependencias ? "Cargando opciones…" : "Buscar depedencia..."}
                value={selectedDependencia}
                onChange={(opt) => {setField("Dependencia", opt?.value ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingDependencias}
                isLoading={loadingDependencias}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Dependencia}</small>
            </div>

            {/* ================= Centro de costos ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Centro de costos *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={CentroCostosOptions}
                placeholder={loadingCC ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedCentroCostos}
                onChange={(opt) => {setField("DescripcionCentroCostos", opt?.label ?? ""); setField("CodigoCentroCostos", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingCC}
                isLoading={loadingCC}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.DescripcionCentroCostos}</small>
            </div>
            
            {/* Codigo CC */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de costos *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.CodigoCentroCostos} readOnly/>
            </div>

            {/* ================= Centro Operativo ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion Centro Operativo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={COOptions}
                placeholder={loadingCO ? "Cargando opciones…" : "Buscar centro operativo..."}
                value={selectedCentroOperativo}
                onChange={(opt) => {setField("DescripcionCentroOperativo", opt?.label ?? ""); setField("CentroOperativo", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingCO}
                isLoading={loadingCO}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.DescripcionCentroOperativo}</small>
            </div>
            
            {/* Codigo CO */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CentroOperativo} readOnly/>
            </div>

            {/* ================= Unidad de negocio ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion unidad de negocio *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={UNOptions}
                placeholder={loadingUN ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedUnidadNegocio}
                onChange={(opt) => {setField("UnidadNegocio", opt?.label ?? ""); setField("IDUnidadNegocio", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingUN}
                isLoading={loadingUN}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.UnidadNegocio}</small>
            </div>
            
            {/* Codigo UN */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.IDUnidadNegocio} readOnly/>
            </div>

            {/* ¿Personas a cargo? */}
            <div className="ft-field">
              <label className="ft-label"> ¿Personas a cargo? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="personas" value="Si" checked={state.PersonasCargo === "Si"} onChange={() => setField("PersonasCargo", "Si")}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="personas" value="No" checked={state.PersonasCargo === "No"} onChange={() => setField("PersonasCargo", "No")}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* ================= Tipo de vacante ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Tipo de vacante *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={tipoVacanteOptions}
                placeholder={loadingTipoVacante ? "Cargando opciones…" : "Buscar tipo de vacante..."}
                value={selectedTipoVacante}
                onChange={(opt) => {setField("TipoVacante", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingTipoVacante}
                isLoading={loadingTipoVacante}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.TipoVacante}</small>
            </div>

            {/* ================= Herramientas que posee el colaborador ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Herramientas que posee el colaborador</label>
              <Select
                inputId="herramientas"
                isMulti
                options={opciones}
                classNamePrefix="rs"
                value={selecciones.map(s => ({ value: s, label: s }))}
                onChange={(opts) => {
                  const values = (opts ?? []).map(o => o.value);
                  setSelecciones(values);
                  setField("HerramientasColaborador", values.join("; "));
                }}
                placeholder="Selecciona herramientas..."
              />
            </div>

            {/* ================= Tipo de nómina ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="nomina">Tipo de nómina *</label>
              <Select inputId="nomina" options={opcionesTipoNomina} classNamePrefix="rs" placeholder="Selecciona tipo de nómina..."
                value={opcionesTipoNomina.find(o => o.value === state.TipoNomina) ?? null}
                onChange={(opt) => {setField("TipoNomina", opt?.value ?? ""); }}
                isClearable
              />
              <small>{errors.TipoNomina}</small>
            </div>

            {/* Fecha de ajuste academico */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaIngreso">Fecha de ajuste academico</label>
              <input id="fechaIngreso" name="FECHA_x0020_REQUERIDA_x0020_PARA0" type="date" value={state.FechaAjusteAcademico ? toISODateFlex(state.FechaAjusteAcademico) : ""} onChange={(e) => setField("FechaAjusteAcademico", e.target.value)}
                autoComplete="off" required aria-required="true"/>
            </div>

            {/* Fecha de entrega valoracion de potencial */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaIngreso">Fecha de entrega de la valoración de potencial</label>
              <input id="fechaIngreso" name="FECHA_x0020_DE_x0020_ENTREGA_x00" type="date" value={state.FechaValoracionPotencial ? toISODateFlex(state.FechaValoracionPotencial) : ""} onChange={(e) => setField("FechaValoracionPotencial", e.target.value)}
                autoComplete="off" required aria-required="true"/>
            </div>

            {/* ¿Pertenece al modelo? */}
            <div className="ft-field">
              <label className="ft-label"> ¿Pertenece al modelo? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="modelo" value="Si" checked={!!state.PerteneceModelo} onChange={() => setField("PerteneceModelo", true)}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="modelo" value="No" checked={!state.PerteneceModelo} onChange={() => setField("PerteneceModelo", false)}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {state.PerteneceModelo && (
              <>
                <div className="ft-field">
                  <label className="ft-label" htmlFor="Autonomia">Autonomía *</label>
                  <select name="Autonomia" onChange={(e) => setField("Autonomia", e.target.value)} value={String(state.Autonomia)}>
                    <option value="0" selected>0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.Autonomia}</small>
                </div>
                

                <div className="ft-field">
                  <label className="ft-label" htmlFor="presupuesto">Presupuesto ventas/magnitud económica *</label>
                  <select name="presupuesto" onChange={(e) => setField("PresupuestoVentasMagnitudEconomi", e.target.value)} value={String(state.PresupuestoVentasMagnitudEconomi)}>
                    <option value="0" selected>0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.PresupuestoVentasMagnitudEconomi}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="impacto">Impacto cliente externo *</label>
                  <select name="impacto" onChange={(e) => setField("ImpactoClienteExterno", e.target.value)}>
                    <option value="0" selected>0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.ImpactoClienteExterno}</small>
                </div>

                <div className="ft-field">
                  <label className="ft-label" htmlFor="contribucion">Contribución a la estrategia *</label>
                  <select name="contribucion" onChange={(e) => setField("ContribucionaLaEstrategia", e.target.value)} value={String(state.ContribucionaLaEstrategia)}>
                    <option value="0" selected>0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <small>{errors.ContribucionaLaEstrategia}</small>
                </div>

                {/* Promedio */}
                <div className="ft-field">
                  <label className="ft-label" htmlFor="cve"> Promedio *</label>
                  <input id="cve" name="cve" type="text" placeholder="Rellene los campos anteriores" value={promedio} readOnly/>
                </div>
              
                {/* Grupo de CVE */}
                <div className="ft-field">
                  <label className="ft-label" htmlFor="cve"> Grupo CVE *</label>
                  <input id="cve" name="cve" type="text" placeholder="Rellene los campos anteriores" value={grupoCVE} readOnly/>
                </div>
              </>
            )}

            {/* ¿Se debe hacer cargue de nuevo equipo de trabajo? */}
            <div className="ft-field">
              <label className="ft-label"> ¿Se debe hacer cargue de nuevo equipo de trabajo? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="nuevoequipo" value="Si" checked={state.CargueNuevoEquipoTrabajo === "Si"} onChange={() => setField("CargueNuevoEquipoTrabajo", "Si")}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="nuevoequipo" value="No" checked={state.CargueNuevoEquipoTrabajo === "No"} onChange={() => setField("CargueNuevoEquipoTrabajo", "No")}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* ¿Tendra plan financiado por EDM? */}
            <div className="ft-field">
              <label className="ft-label"> ¿Tendra plan financiado por EDM? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input type="radio" name="auxilioRodamiento" value="Si" checked={planFinanciado} onChange={() => 
                                                                                                    {
                                                                                                      setPlanfinanciado(true); 
                                                                                                      setField("AuxilioValor", String(conectividad));
                                                                                                      setField("AuxilioTexto", conectividadTexto)
                                                                                                    }
                                                                                                  }/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input type="radio" name="auxilioRodamiento" value="No" checked={!planFinanciado} onChange={() => {
                                                                                                                      setPlanfinanciado(false)
                                                                                                                      setField("AuxilioValor", String(conectividad));
                                                                                                                      setField("AuxilioTexto", conectividadTexto)}}
                                                                                                                    />
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>
            </div>

            {/* Fecha reporte ingreso */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="FechaReporte"> Fecha reporte ingreso *</label>
              <input id="FechaReporte" name="FechaReporte" type="date" value={today} readOnly/>
            </div>

            {/* Informacion enviada por */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="enviadaPor"> Información enviada por *</label>
              <input id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
            </div>
          </form>
        </>
      }

        {/* Acciones */}
        <div className="ft-actions">
            <button disabled={isView || selectedPromocion?.Estado === "Cancelado" || submitting} type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreatePromotion(e)}>
              {isView || selectedPromocion?.Estado === "Cancelado" ? "No se puede editar este registro ya que fue usado" : submitting ? "Guardando" : "Guardar"}
            </button> 
            { isView || tipo === "edit" ?
              <button type="submit" className="btn btn-xs" onClick={() => setFlow(true)}>Detalles</button> : null
            }
            { (isView || tipo === "edit") ?
              <button type="submit" className="btn btn-xs btn-danger" onClick={() => {
                                                                        selectedPromocion?.Estado === "Cancelado" ? 
                                                                          handleReactivateProcessById(selectedPromocion.Id ?? "") : 
                                                                          setCancelProcess(true)}}
                                                                        >
                {selectedPromocion?.Estado !== "Cancelado" ? "Cancelar proceso" : "Reactivar proceso"}
              </button> : null
            }
          <button type="button" className="btn btn-xs" onClick={onClose}>Cancelar</button>
        </div>
        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
      </section>
    </div>
  );
}
