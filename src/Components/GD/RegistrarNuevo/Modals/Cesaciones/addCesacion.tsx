import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import { useAuth } from "../../../../../auth/authProvider";
import { formatPesosEsCO, numeroATexto, toNumberFromEsCO,  } from "../../../../../utils/Number";
import { useSalarios } from "../../../../../Funcionalidades/GD/Salario";
import { useDetallesPasosCesacion, usePasosCesacion } from "../../../../../Funcionalidades/GD/PasosCesacion";
import { lookOtherInfo } from "../../../../../utils/lookFor";
import { usePromocion } from "../../../../../Funcionalidades/GD/Promocion";
import { useHabeasData } from "../../../../../Funcionalidades/GD/HabeasData";
import { useContratos } from "../../../../../Funcionalidades/GD/Contratos";
import type { Cesacion, CesacionErrors, DetallesPasos } from "../../../../../models/Cesaciones";
import type { SetField } from "../Contrato/addContrato";
import { useRetail } from "../../../../../Funcionalidades/GD/Retail";
import { createBody, notifyTeam } from "../../../../../utils/mail";
import { ProcessDetail } from "./procesoCesacion";
import { CancelProcessModal } from "../../../View/CancelProcess/CancelProcess";
import { useAutomaticCargo } from "../../../../../Funcionalidades/GD/Niveles";
import { safeLower } from "../../../../../utils/text";
import { toISODateFlex } from "../../../../../utils/Date";

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

type Props = {
  onClose: () => void;
  state: Cesacion
  setField: SetField<Cesacion>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Cesacion) => void;
  errors: CesacionErrors
  searchRegister: (cedula: string) => Promise<Cesacion | null>
  tipo: "new" | "edit" | "view"
  selectedCesacion?: Cesacion
  setState: (n: Cesacion) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivateProcessById: (id: string) => void
  title: string
  sending: boolean

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  cargoOptions: desplegablesOption[], 
  loadingCargo: boolean, 
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean
  nivelCargoOptions: desplegablesOption[], 
  loadinNivelCargo: boolean, 
  dependenciaOptions: desplegablesOption[], 
  loadingDependencias: boolean
  CentroCostosOptions: desplegablesOption[]
  loadingCC: boolean
  COOptions: desplegablesOption[]
  loadingCO: boolean, 
  UNOptions: desplegablesOption[]
  loadingUN: boolean,
  temporalOption: desplegablesOption[]
  temporalLoading: boolean
  deptoOptions: desplegablesOption[]
  loadingDeptos: boolean
};

/* ================== Formulario ================== */
export default function FormCesacion({sending, temporalLoading, temporalOption, deptoOptions, loadingDeptos, handleReactivateProcessById, title, handleCancelProcessbyId, setState, selectedCesacion, handleEdit, tipo, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, cargoOptions, loadingCargo, nivelCargoOptions, loadinNivelCargo, CentroCostosOptions, loadingCC, COOptions, loadingCO, UNOptions, loadingUN, dependenciaOptions, loadingDependencias, onClose, state, setField, handleSubmit, errors, searchRegister: searchCesacion }: Props) {
  const { categorias, Cesaciones, Contratos, DetallesPasosCesacion, salarios, HabeasData, Promociones, Retail, configuraciones, mail} = useGraphServices();
  const { searchRegister: searchHabeas} = useHabeasData(HabeasData);
  const { searchRegister: searchNovedad } = useContratos(Contratos);
  const { searchRegister: searchPromocion } = usePromocion(Promociones);
  const { searchRegister: searchRetail } = useRetail(Retail);
  const { loadSpecificSalary } = useSalarios(salarios);
  const { loadSpecificLevel } = useAutomaticCargo(categorias);
  const { loadPasosCesacion, rows, handleCompleteStep, byId, decisiones, setDecisiones, motivos, setMotivos, loading: loadingPasos, error: errorPasos} = usePasosCesacion()
  const { loadDetallesCesacion, handleCreateAllSteps, calcPorcentaje, loading: loadingDetalles, rows: rowsDetalles, error: errorDetalles,} = useDetallesPasosCesacion(DetallesPasosCesacion, selectedCesacion?.Id)

  const showCargos = React.useMemo(() => new Set<string>(["31", "42", "9", "33"]), []);
  const filteredCargoOptions = React.useMemo(() => cargoOptions.filter(o => showCargos.has(String(o.value))), [cargoOptions, showCargos]);
  
  const isView = tipo === "view"

  const [porcentajeCompletacion, setPorcetanjeCompletacion] = React.useState<number>(0);
  const [cancelProcess, setCancelProcess] = React.useState<boolean>(false);
  const [flow, setFlow] = React.useState<boolean>(false)
  const [displaySalario, setDisplaySalario] = React.useState<string>("");
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");  
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [minimo, setMinimo] = React.useState<number>(0);
  const [auxTransporte, setAuxTransporte] = React.useState<number>(0);
  const [conectividad, setConectividad] = React.useState<number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");

  const { account } = useAuth();

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

  /* ================== Selected values ================== */
  const selectedEmpresa = empresaOptions.find((o) => safeLower(o.label) === safeLower(state.Empresaalaquepertenece)) ?? null;
  const selectedCargo = cargoOptions.find((o) => safeLower(o.label) === safeLower(state.Cargo)) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => safeLower(o.label) === safeLower(state.TipoDoc)) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => safeLower(o.label) === safeLower(state.Niveldecargo)) ?? null;   
  const selectedDependencia = dependenciaOptions.find((o) => safeLower(o.value) === safeLower(state.Dependencia)) ?? null;  
  const selectedCentroCostos = CentroCostosOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoCC)) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoCO)) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoUN)) ?? null;
  const selectedTemporal = temporalOption.find((o) => safeLower(o.label) === safeLower(state.Temporal)) ?? null;

  /* ================== display salario ================== */
  React.useEffect(() => {
    if (state.Salario != null && state.Salario !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.Salario)));
    } else {
      setDisplaySalario("");
    }
  }, [state.Salario]);

  /* ================== display auxilio transporte ================== */
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
    }

    // Solo actualiza si cambia (evita loops)
    if (String(state.auxConectividadValor ?? "") !== String(nextValor)) {
      setField("auxConectividadValor", String(nextValor));
    }
    if (String(state.auxConectividadTexto ?? "") !== nextTexto) {
      setField("auxConectividadTexto", nextTexto.toUpperCase());
    }

    // si igual quieres el display local:
    setConectividad(nextValor);
    setConectividadTexto(nextTexto);
  }, [state.Salario, state.Cargo, state.auxConectividadValor, state.auxConectividadTexto, setField]);

  /* ================== Salario recomendado por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificSalary(state.Cargo);

      if (!cancelled && salario !== null) {
        setField("Salario", salario.Salariorecomendado);
        setField("SalarioTexto", numeroATexto(Number(salario.Salariorecomendado)).toUpperCase())
      }
    };

    if (state.Cargo) run();

    return () => {
      cancelled = true;
    };
  }, [state.Cargo,]);

  React.useEffect(() => {

    const run = async () => {
      const salario = (await configuraciones.get("1")).Valor
      const auxTransporte = await (await configuraciones.get("2")).Valor
      setMinimo(Number(salario))
      setAuxTransporte(Number(auxTransporte))
    };

    run();
  }, []);

  /* ================== Nivel por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificLevel(state.Cargo);

      if (cancelled) return;
      if (!salario) return;

      const recomendado = String(salario.Categoria ?? "");
      const actual = String(state.Niveldecargo ?? "");

      // Si ya está igual, no vuelvas a setear (evita loops por "mismo valor")
      if (recomendado && recomendado !== actual) {
        setField("Niveldecargo", recomendado as any);
      }
    };

    if (state.Cargo) run();

    return () => {
      cancelled = true;
    };
  }, [state.Cargo,]);

  /* ================== Usar Novedad ================== */
  React.useEffect(() => {
    if(selectedCesacion) 
    setState({...selectedCesacion,})
  }, [selectedCesacion]);

  React.useEffect(() => {
    (async () => {
      const pct = await calcPorcentaje();
      setPorcetanjeCompletacion(pct);
    })();

  }, [selectedCesacion]);

  const handleCreateCesacion = async (e: React.FormEvent) => {
    if(tipo=== "new"){
      const created = await handleSubmit();
      if(created.ok){
        await loadPasosCesacion()
        await handleCreateAllSteps(rows, created.created ?? "")
        const body = createBody(account?.name ?? "", "Cesaciones", state.Nombre, state.Title, state.Cargo, state.FechaIngreso ?? "")
        await notifyTeam(mail, "Nuevo registro en cesaciones - Gestor documental CH", body)
        await onClose()
      }
    } else if(tipo=== "edit") {
      handleEdit(e, selectedCesacion!)
    }
  };

  const searchPeople = React.useCallback(async (cedula: string) => {
    const persona = await  lookOtherInfo(cedula, {searchPromocion, searchNovedad, searchCesacion, searchHabeas, searchRetail})
    if(persona){
      setField("Title", persona.cedula)
      setField("Nombre", persona.nombre)
      setField("TipoDoc", persona.tipoDoc)
      setField("Empresaalaquepertenece", persona.empresa)
      setField("Correoelectronico", persona.correo)
      setField("Departamento", persona.departamento)
      setField("Ciudad", persona.ciudad)
      setField("Celular", persona.celular)
    }
  }, []);

  const completeStep = React.useCallback( async (detalle: DetallesPasos, estado: string) => {
      await handleCompleteStep(detalle, estado);

      const porcentaje = await calcPorcentaje(); 

      if (Number(porcentaje) === 100) {
        const id = selectedCesacion?.Id;
        if (!id) return;

        await Cesaciones.update(id, { Estado: "Completado" });
      }
    },
    [handleCompleteStep, calcPorcentaje, selectedCesacion?.Id, Cesaciones])

  const handleCancel = async (razon: string) => {
    await handleCancelProcessbyId(selectedCesacion!.Id ?? "", razon)
    setCancelProcess(false)
  };


  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        {flow ? <ProcessDetail 
                    titulo={"Detalles cesacion de: " + selectedCesacion!.Title + " - " + selectedCesacion!.Nombre}
                    selectedCesacion={selectedCesacion!}
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
                    loadDetalles={() => loadDetallesCesacion()} 
                    proceso={"Cesacion"}/> :
        <>
          <h2 id="ft_title" className="ft-title">{title} {(tipo === "edit" || isView) ? ` - ${porcentajeCompletacion}` : null}</h2>

          <form className="ft-form" noValidate>

            {/* Número documento */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="numeroIdent">Número de identificación *</label>
              <input disabled={isView} id="Title" name="Title" type="number" placeholder="Ingrese el número de documento" value={state.Title ?? ""} onChange={(e) => setField("Title", e.target.value)} onBlur={ (e) => searchPeople(e.target.value)}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.Title}</small>
            </div>

            <div className="ft-field">
              <label className="ft-label" htmlFor="tipoDocumento">Tipo de documento *</label>
              <Select<desplegablesOption, false>
                inputId="tipoDocumento"
                options={tipoDocOptions}
                placeholder={loadingTipo ? "Cargando opciones…" : "Buscar tipo de documento..."}
                value={selectedTipoDocumento}
                onChange={(opt) => {setField("TipoDoc", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingTipo}
                isLoading={loadingTipo || isView}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.TipoDoc}</small>
            </div>

            {/* Nombre seleccionado */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="Nombre"> Nombre del seleccionado *</label>
              <input disabled={isView} id="Nombre" name="Nombre" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.Nombre ?? ""} onChange={(e) => setField("Nombre", e.target.value.toUpperCase())} autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.Nombre}</small>
            </div>

            {/* ================= Empresa ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="solicitante">Empresa a la que pertenece *</label>
              <Select<desplegablesOption, false>
                inputId="solicitante"
                options={empresaOptions}
                placeholder={loadingEmp ? "Cargando opciones…" : "Buscar empresa..."}
                value={selectedEmpresa}
                onChange={(opt) => setField("Empresaalaquepertenece", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingEmp || isView}
                isLoading={loadingEmp}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Empresaalaquepertenece}</small>
            </div>

            {/* Correo */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
              <input disabled={isView} id="correo" name="Correoelectronico" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.Correoelectronico ?? ""} onChange={(e) => setField("Correoelectronico", e.target.value.toLowerCase())}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.Correoelectronico}</small>
            </div>

            {/* Celular */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="numeroIdent">Celular</label>
              <input disabled={isView} id="Title" name="Title" type="number" placeholder="Ingrese el numero de celular" value={state.Celular ?? ""} onChange={(e) => setField("Celular", e.target.value)}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.Title}</small>
            </div>

            {/* Fecha requerida para el ingreso */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaIngreso">Fecha de ingreso *</label>
              <input disabled={isView} id="FechaIngreso" name="FechaIngreso" type="date" value={state.FechaIngreso ? toISODateFlex(state.FechaIngreso) : ""} onChange={(e) => setField("FechaIngreso", e.target.value)}
                autoComplete="off" required aria-required="true"/>
              <small>{errors.FechaIngreso}</small>
            </div>

            {/* Fecha salida cesacion */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="FechaSalidaCesacion">Fecha salida cesación *</label>
              <input disabled={isView} id="FechaSalidaCesacion" name="FechaSalidaCesacion" type="date" value={state.FechaSalidaCesacion ? toISODateFlex(state.FechaSalidaCesacion) : ""} onChange={(e) => setField("FechaSalidaCesacion", e.target.value)}
                autoComplete="off" required aria-required="true"/>
              <small>{errors.FechaSalidaCesacion}</small>
            </div>

            {/* Fecha limite documentos */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="FechaLimiteDocumentos">Fecha limite documentos *</label>
              <input disabled={isView} id="FechaLimiteDocumentos" name="FechaLimiteDocumentos" type="date" value={state.FechaLimiteDocumentos ? toISODateFlex(state.FechaLimiteDocumentos) : ""} onChange={(e) => setField("FechaLimiteDocumentos", e.target.value)}
                autoComplete="off" required aria-required="true"/>
              <small>{errors.FechaLimiteDocumentos}</small>
            </div>

            {/* ================= Cargo ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="cargo">Cargo * </label>
              <Select<desplegablesOption, false>
                inputId="cargo"
                options={filteredCargoOptions}
                placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
                value={selectedCargo}
                onChange={(opt) => {setField("Cargo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingCargo || isView}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Cargo}</small>
            </div>

            {/* ================= Nivel de cargo ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Nivel de cargo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={nivelCargoOptions}
                placeholder={loadinNivelCargo ? "Cargando opciones…" : "Buscar nivel de cargo..."}
                value={selectedNivelCargo}
                onChange={(opt) => {setField("Niveldecargo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadinNivelCargo || isView}
                isLoading={loadinNivelCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Niveldecargo}</small>
            </div>

            {/* ¿Cargo critico? */}
            <div className="ft-field">
              <label className="ft-label"> ¿Cargo critico? *</label>
              <div className="ft-radio-group">
                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="critico" value="Si" checked={state.CargoCritico === "Si"} onChange={() => setField("CargoCritico", "Si")}/>
                  <span className="circle"></span>
                  <span className="text">Si</span>
                </label>

                <label className="ft-radio-custom">
                  <input disabled={isView} type="radio" name="critico" value="No" checked={state.CargoCritico === "No"} onChange={() => setField("CargoCritico", "No")}/>
                  <span className="circle"></span>
                  <span className="text">No</span>
                </label>
              </div>

              <small>{errors.CargoCritico}</small>
            </div>

            {/* Salario */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Salario *</label>
              <input disabled={isView} id="SALARIO" name="SALARIO" type="text" placeholder="Ingrese el salario del seleccionado" value={displaySalario} required maxLength={300} onChange={(e) => {
                                                                                                                                                                  const raw = e.target.value;

                                                                                                                                                                  if (raw === "") {
                                                                                                                                                                    setDisplaySalario("");
                                                                                                                                                                    setField("Salario", "" as any);
                                                                                                                                                                    setField("SalarioTexto", "");
                                                                                                                                                                    return;
                                                                                                                                                                  }

                                                                                                                                                                  const numeric = toNumberFromEsCO(raw);
                                                                                                                                                                  const formatted = formatPesosEsCO(String(numeric));

                                                                                                                                                                  setDisplaySalario(formatted);
                                                                                                                                                                  setField("Salario", numeric as any);
                                                                                                                                                                  setField("SalarioTexto", numeroATexto(numeric).toUpperCase());
                                                                                                                                                                }}
                                                                                                                                                              />
              <small>{errors.Salario}</small>
            </div>

            {/* Salario */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Salario en letras *</label>
              <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={numeroATexto(Number(state.Salario)).toUpperCase()} readOnly/>
            </div>

            {/* Auxilio de conectividad */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Auxilio de tranporte y conectividad *</label>
              <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={formatPesosEsCO(String(conectividad))} readOnly/>
            </div>

            {/* Auxilio de conectividad texto */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Auxilio de tranporte y conectividad en letras *</label>
              <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={conectividadTexto} readOnly/>
            </div>

              {/* Dependencia */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Dependencia *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={dependenciaOptions}
                placeholder={loadingDependencias ? "Cargando opciones…" : "Buscar depedencia..."}
                value={selectedDependencia}
                onChange={(opt) => {setField("Dependencia", opt?.value ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingDependencias || isView}
                isLoading={loadingDependencias}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Dependencia}</small>
            </div>

              {/*Departamento */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="departamento">Departamento *</label>
              <Select<desplegablesOption, false>
                inputId="departamento"
                options={deptoSelectOptions}
                placeholder={loadingDeptos ? "Cargando opciones…" : "Buscar departamento..."}
                value={selectedDepto ? { value: selectedDepto, label: selectedDepto } : state.Departamento ? { value: state.Departamento, label: state.Departamento } : null}
                onChange={(opt) => {
                  const value = opt?.value ?? "";
                  setSelectedDepto(value);
                  setSelectedMunicipio("");           
                  setField("Departamento", value.toUpperCase());  
                }}
                classNamePrefix="rs"
                isDisabled={loadingDeptos || isView}
                isLoading={loadingDeptos}
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
                placeholder={!selectedDepto ? "Selecciona un departamento..." : loadingDeptos ? "Cargando municipios…" : "Selecciona un municipio..."}
                value={ selectedMunicipio ? { value: selectedMunicipio, label: selectedMunicipio } : state.Ciudad ? { value: state.Ciudad, label: state.Ciudad } : null}
                onChange={(opt) => {
                  const value = opt?.value ?? "";
                  setSelectedMunicipio(value);
                  setField("Ciudad", value.toUpperCase());          
                }}
                classNamePrefix="rs"
                isDisabled={!selectedDepto  || loadingCargo || isView}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Ciudad}</small>
            </div>

            {/* Temporal */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="numeroIdent">Temporal *</label>
              <Select<desplegablesOption, false>
                inputId="temporal"
                options={temporalOption}
                placeholder={temporalLoading ? "Cargando opciones…" : "Buscar temporal..."}
                value={selectedTemporal}
                onChange={(opt) => {setField("Temporal", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={temporalLoading}
                isLoading={temporalLoading}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Temporal}</small>
            </div>

            {/* ================= Centro de costos ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Centro de costos *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={CentroCostosOptions}
                placeholder={loadingCC ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedCentroCostos}
                onChange={(opt) => {setField("DescripcionCC", opt?.label ?? ""); setField("CodigoCC", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingCC || isView}
                isLoading={loadingCC}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CodigoCC}</small>
            </div>

            {/* Codigo CC */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de costos *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.CodigoCC} readOnly/>
            </div>

            {/* ================= Centro Operativo ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion Centro Operativo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={COOptions}
                placeholder={loadingCO ? "Cargando opciones…" : "Buscar centro operativo..."}
                value={selectedCentroOperativo}
                onChange={(opt) => {setField("DescripcionCO", opt?.label ?? ""); setField("CodigoCO", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingCO || isView}
                isLoading={loadingCO}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CodigoCO}</small>
            </div>
            
            {/* Codigo CO */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoCO} readOnly/>
            </div>

            {/* ================= Unidad de negocio ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion unidad de negocio *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={UNOptions}
                placeholder={loadingUN ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedUnidadNegocio}
                onChange={(opt) => {setField("DescripcionUN", opt?.label ?? ""); setField("CodigoUN", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingUN || isView}
                isLoading={loadingUN}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CodigoUN}</small>
            </div>
            
            {/* Codigo UN */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo unidad de negocio *</label>
              <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoUN} readOnly/>
            </div>

            {/* Direccion */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="Nombre"> Dirección de residencia *</label>
              <input disabled={isView} id="Nombre" name="Nombre" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.direccionResidencia ?? ""} onChange={(e) => setField("direccionResidencia", e.target.value.toUpperCase())} required/>
              <small>{errors.direccionResidencia}</small>
            </div>

            {/* Informacion enviada por */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="enviadaPor"> Información enviada por *</label>
              <input id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
            </div>

            {/* Fecha salida cesacion */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
              <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.Fechaenlaquesereporta ? toISODateFlex(state.Fechaenlaquesereporta) : ""} autoComplete="off" required aria-required="true" readOnly/>
            </div>
          </form>
        </>
      } 

        {/* Acciones */}
        <div className="ft-actions">
            <button disabled={isView || selectedCesacion?.Estado === "Cancelado" || sending} type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreateCesacion(e)}>
              {isView || selectedCesacion?.Estado === "Cancelado" ? "No se puede editar este registro ya que fue usado" : sending ? "Procesando..." : "Guardar"}
            </button> 
            { isView || tipo === "edit" ?
              <button type="submit" className="btn btn-xs" onClick={() => setFlow(true)}>Detalles</button> : null
            }
            { (isView || tipo === "edit") ?
              <button type="submit" className="btn btn-xs btn-danger" onClick={() => {
                                                                        selectedCesacion?.Estado === "Cancelado" ? 
                                                                          handleReactivateProcessById(selectedCesacion.Id ?? "") : 
                                                                          setCancelProcess(true)}}
                                                                        >
                {selectedCesacion?.Estado !== "Cancelado" ? "Cancelar proceso" : "Reactivar proceso"}
              </button> : null
            }
          <button type="button" className="btn btn-xs" onClick={onClose}>Cancelar</button>
        </div>
        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
      </section>
    </div>
  );
}
