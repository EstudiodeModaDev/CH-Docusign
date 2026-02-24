import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import { useAuth } from "../../../../../auth/authProvider";
import { formatPesosEsCO, numeroATexto, toNumberFromEsCO,  } from "../../../../../utils/Number";
import { useSalarios } from "../../../../../Funcionalidades/GD/Salario";
import { lookOtherInfo } from "../../../../../utils/lookFor";
import { usePromocion } from "../../../../../Funcionalidades/GD/Promocion";
import { useHabeasData } from "../../../../../Funcionalidades/GD/HabeasData";
import { useContratos } from "../../../../../Funcionalidades/GD/Contratos";
import { useAutomaticCargo } from "../../../../../Funcionalidades/GD/Niveles";
import type { SetField } from "../Contrato/addContrato";
import type { Retail, RetailErrors } from "../../../../../models/Retail";
import { useCesaciones } from "../../../../../Funcionalidades/GD/Cesaciones";
import { useDetallesPasosRetail, usePasosRetail } from "../../../../../Funcionalidades/GD/PasosRetail";
import { createBody, notifyTeam } from "../../../../../utils/mail";
import { safeLower } from "../../../../../utils/text";
import type { DetallesPasos } from "../../../../../models/Cesaciones";
import { ProcessDetail } from "../Cesaciones/procesoCesacion";
import { CancelProcessModal } from "../../../View/CancelProcess/CancelProcess";
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
  state: Retail
  setField: SetField<Retail>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Retail) => void;
  errors: RetailErrors
  searchRegister: (cedula: string) => Promise<Retail | null>
  loadFirstPage: () => Promise<void>
  tipo: "new" | "edit" | "view"
  selectedRetail?: Retail
  setState: (n: Retail) => void
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
  deptoOptions: desplegablesOption[], 
  loadingDepto: boolean, 
  dependenciaOptions: desplegablesOption[], 
  loadingDependencias: boolean
};


/* ================== Formulario ================== */
export default function FormRetail({
  origenOptions, loadingOrigen, submitting, title, selectedRetail, tipo, empresaOptions, loadingEmp, tipoDocOptions, deptoOptions, loadingDepto, dependenciaOptions, loadingDependencias, loadingTipo, cargoOptions, loadingCargo, nivelCargoOptions, loadinNivelCargo, CentroCostosOptions, loadingCC, COOptions, loadingCO, UNOptions, loadingUN, 
  handleReactivateProcessById, handleCancelProcessbyId, setState, handleEdit, onClose, state, setField, handleSubmit, errors, searchRegister: searchRetail, }: Props) {
  const { Promociones, Contratos, detallesPasosRetail, salarios, HabeasData, Cesaciones, categorias, configuraciones, mail,} = useGraphServices();
  const { searchRegister: searchHabeas} = useHabeasData(HabeasData);
  const { searchRegister: searchNovedad } = useContratos(Contratos);
  const { searchRegister: searchPromocion } = usePromocion(Promociones);
  const { searchRegister: searchCesacion } = useCesaciones(Cesaciones);
  const { loadSpecificLevel } = useAutomaticCargo(categorias);
  const { loadSpecificSalary } = useSalarios(salarios);
  const { loadPasosPromocion, rows, loading: loadinPasosPromocion, error: errorPasosPromocion, byId, decisiones, setDecisiones, motivos, setMotivos, handleCompleteStep} = usePasosRetail()
  const { handleCreateAllSteps, calcPorcentaje, rows: rowsDetalles, loading: loadingDetalles, error: errorDetalles, loadDetallesPromocion,} = useDetallesPasosRetail(detallesPasosRetail, selectedRetail?.Id)

  const isView = tipo === "view"

  const [selectedDepto, setSelectedDepto] = React.useState<string>("");
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [displaySalario, setDisplaySalario] = React.useState("");
  const [conectividad, setConectividad] = React.useState<number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [minimo, setMinimo] = React.useState<number>(0);
  const [auxTransporte, setAuxTransporte] = React.useState<number>(0);
  const [porcentajeCompletacion, setPorcetanjeCompletacion] = React.useState<number>(0);
  const [cancelProcess, setCancelProcess] = React.useState<boolean>(false);
  const [flow, setFlow] = React.useState<boolean>(false)
  const { account } = useAuth();

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

  const municipioSelectOptions = React.useMemo(
    () =>
      municipiosFiltrados.map((m) => ({
        value: String(m.value), // Municipio
        label: String(m.value),
      })),
    [municipiosFiltrados]
  );

  const showCargos = React.useMemo(() => new Set<string>(["31", "42", "9", "33"]), []);
  const filteredCargoOptions = React.useMemo(() => cargoOptions.filter(o => showCargos.has(String(o.value))), [cargoOptions, showCargos]);

  /* ================== Selected values ================== */
  const selectedEmpresa = empresaOptions.find((o) => safeLower(o.label) === safeLower(state.Empresaalaquepertenece)) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => safeLower(o.label) === safeLower(state.TipoDoc)) ?? null;
  const selectedCargo = cargoOptions.find((o) => safeLower(o.label) === safeLower(state.Cargo)) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => safeLower(o.label) === safeLower(state.NivelCargo)) ?? null;
  const selectedCentroCostos = CentroCostosOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoCentroCostos)) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoCentroOperativo)) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => safeLower(o.value) === safeLower(state.CodigoUnidadNegocio)) ?? null;
  const selectedDependencia = dependenciaOptions.find((o) =>safeLower( o.label) === safeLower(state.Depedencia)) ?? null;
  const selectedOrigenSeleccion = origenOptions.find((o) => o.label.toLocaleLowerCase() === state.OrigenSeleccion.toLocaleLowerCase()) ?? null;


  /* ================== display salario ================== */
  React.useEffect(() => {
    if (state.Salario != null && state.Salario !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.Salario)));
    } else {
      setDisplaySalario("");
    }
  }, [state.Salario]);

  /* ================== Salario recomendado por cargo ================== */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const salario = await loadSpecificSalary(state.Cargo);

      if (!cancelled && salario !== null) {
        setField("Salario", salario.Salariorecomendado);
        setField("SalarioLetras", numeroATexto(Number(salario.Salariorecomendado)).toUpperCase())
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
    if(selectedRetail) setState(selectedRetail)
  }, [selectedRetail]);

  React.useEffect(() => {
    (async () => {
      const pct = await calcPorcentaje();
      setPorcetanjeCompletacion(pct);
    })();

  }, [selectedRetail]);

  React.useEffect(() => {

    const run = async () => {
      const salario = (await configuraciones.get("1")).Valor
      const auxTransporte = await (await configuraciones.get("2")).Valor
      setMinimo(Number(salario))
      setAuxTransporte(Number(auxTransporte))
    };

    run();
  }, []);

  React.useEffect(() => {
    const dosSalarios = Number(minimo)*2;
    const valor = Number(state.Salario || 0);
    const cargo = (state.Cargo || "").toLowerCase();

    let nextValor = 0;
    let nextTexto = "";

    if (valor <= dosSalarios) {
      nextValor = Number(auxTransporte);
      nextTexto = numeroATexto(Number(auxTransporte)).toLocaleUpperCase();
    } else if (valor > dosSalarios || cargo.includes("aprendiz") || cargo.includes("practicante")) {
      nextValor = 46150;
      nextTexto = "Cuarenta y seis mil ciento noventa pesos";
    } else if(valor > dosSalarios || state.Cargo.toLocaleLowerCase().includes("aprendiz") || state.Cargo.toLocaleLowerCase().includes("practicante")){
      setConectividad(46150)
      setConectividadTexto("Cuarenta y seis mil ciento noventa pesos")
    }
 
    // Solo actualiza si cambia (evita loops)
    if (String(state.Auxiliodetransporte ?? "") !== String(nextValor)) {
      setField("Auxiliodetransporte", String(nextValor));
    }
    if (String(state.Auxiliotransporteletras ?? "") !== nextTexto) {
      setField("Auxiliotransporteletras", nextTexto.toUpperCase());
    } 

    // si igual quieres el display local:
    setConectividad(nextValor);
    setConectividadTexto(nextTexto);

    console.log(conectividad, conectividadTexto)
  }, [state.Salario, state.Cargo, ]);


  const handleCreateRetail = async (e: React.FormEvent) => {
    if(tipo=== "new"){
      const created = await handleSubmit();

      if(created.ok){
        await loadPasosPromocion()
        await handleCreateAllSteps(rows, created.created ?? "")
        const body = createBody(account?.name ?? "", "Retail", state.Nombre, state.Title, state.Cargo, state.FechaIngreso ?? "")
        await notifyTeam(mail, "Nuevo registro en el modulo de Retail - Gestor documental CH", body)
        await onClose()
      }
    } else if(tipo=== "edit") {
      handleEdit(e, selectedRetail!)
    }
  };

  const searchPeople = React.useCallback(async (cedula: string) => {
    const persona = await  lookOtherInfo(cedula, {searchPromocion, searchNovedad, searchCesacion, searchHabeas, searchRetail})
    if(persona){
      setField("Title", persona.cedula)
      setField("Nombre", persona.nombre)
      setField("TipoDoc", persona.tipoDoc)
      setField("Empresaalaquepertenece", persona.empresa)
      setField("CorreoElectronico", persona.correo)
      setField("Departamento", persona.departamento)
      setField("Ciudad", persona.ciudad)
    }
  }, []);

  const completeStep = React.useCallback( async (detalle: DetallesPasos, estado: string) => {
      await handleCompleteStep(detalle, estado);

      const porcentaje = await calcPorcentaje(); 

      if (Number(porcentaje) === 100) {
        const id = selectedRetail?.Id;
        if (!id) return;

        await Cesaciones.update(id, { Estado: "Completado" });
      }
    },
    [handleCompleteStep, calcPorcentaje, selectedRetail?.Id, Cesaciones])


  const handleCancel = async (razon: string) => {
    await handleCancelProcessbyId(selectedRetail!.Id ?? "", razon)
    setCancelProcess(false)
  };

  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        {flow ? <ProcessDetail 
                  titulo={"Detalles contratación  de: " + selectedRetail!.Title + " - " + selectedRetail!.Nombre}
                  selectedCesacion={selectedRetail!}
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
                isDisabled={loadingTipo || isView}
                isLoading={loadingTipo}
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
              <input disabled={isView} id="correo" name="Correoelectronico" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.CorreoElectronico ?? ""} onChange={(e) => setField("CorreoElectronico", e.target.value.toLowerCase())}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.CorreoElectronico}</small>
            </div>

            {/* Celular */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="numeroIdent">Celular</label>
              <input disabled={isView} id="Title" name="Title" type="number" placeholder="Ingrese el numero de celular" value={state.Celular ?? ""} onChange={(e) => setField("Celular", e.target.value)}
                autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.Celular}</small>
            </div>

            {/* Fecha requerida para el ingreso */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="fechaIngreso">Fecha de ingreso *</label>
              <input disabled={isView} id="FechaIngreso" name="FechaIngreso" type="date" value={state.FechaIngreso ? toISODateFlex(state.FechaIngreso) : ""} onChange={(e) => setField("FechaIngreso", e.target.value)}
                autoComplete="off" required aria-required="true"/>
              <small>{errors.FechaIngreso}</small>
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
                onChange={(opt) => {setField("NivelCargo", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadinNivelCargo || isView}
                isLoading={loadinNivelCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.NivelCargo}</small>
            </div>

            {/* Salario */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Salario *</label>
              <input disabled={isView} id="SALARIO" name="SALARIO" type="text" placeholder="Ingrese el salario del seleccionado" value={displaySalario} required maxLength={300} onChange={(e) => {
                                                                                                                                                                const raw = e.target.value;
              
                                                                                                                                                                if (raw === "") {
                                                                                                                                                                  setDisplaySalario("");
                                                                                                                                                                  setField("Salario", "" as any);
                                                                                                                                                                  setField("SalarioLetras", "");
                                                                                                                                                                  return;
                                                                                                                                                                }

                                                                                                                                                                const numeric = toNumberFromEsCO(raw);
                                                                                                                                                                const formatted = formatPesosEsCO(String(numeric));

                                                                                                                                                                setDisplaySalario(formatted);
                                                                                                                                                                setField("Salario", numeric as any);
                                                                                                                                                                setField("SalarioLetras", numeroATexto(numeric).toUpperCase());
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
                onChange={(opt) => {setField("Depedencia", opt?.value ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingDependencias || isView}
                isLoading={loadingDependencias}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.Depedencia}</small>
            </div>

              {/*Departamento */}
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

            {/* ================= Centro de costos ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Centro de costos *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={CentroCostosOptions}
                placeholder={loadingCC ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedCentroCostos}
                onChange={(opt) => {setField("CentroCostos", opt?.label ?? ""); setField("CodigoCentroCostos", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingCC || isView}
                isLoading={loadingCC}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CentroCostos}</small>
            </div>

            {/* Codigo CC */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de costos *</label>
              <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.CodigoCentroCostos} readOnly/>
            </div>

            {/* ================= Centro Operativo ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion Centro Operativo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={COOptions}
                placeholder={loadingCO ? "Cargando opciones…" : "Buscar centro operativo..."}
                value={selectedCentroOperativo}
                onChange={(opt) => {setField("CentroOperativo", opt?.label ?? ""); setField("CodigoCentroOperativo", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingCO || isView}
                isLoading={loadingCO}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.CentroOperativo}</small>
            </div>
            
            {/* Codigo CO */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
              <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoCentroOperativo} readOnly/>
            </div>

            {/* ================= Unidad de negocio ================= */ }
            <div className="ft-field">
              <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion unidad de negocio *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTrabajo"
                options={UNOptions}
                placeholder={loadingUN ? "Cargando opciones…" : "Buscar centro de costos..."}
                value={selectedUnidadNegocio}
                onChange={(opt) => {setField("UnidadNegocio", opt?.label ?? ""); setField("CodigoUnidadNegocio", opt?.value ?? "")}}
                classNamePrefix="rs"
                isDisabled={loadingUN || isView}
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
              <label className="ft-label" htmlFor="abreviacionDoc"> Codigo unidad de negocio *</label>
              <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoUnidadNegocio} readOnly/>
            </div>

            {/* ================= Origen Seleccion ================= */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="origen">Origen de la selección *</label>
              <Select<desplegablesOption, false>
                inputId="origen"
                options={origenOptions}
                placeholder={loadingOrigen ? "Cargando opciones…" : "Buscar origen..."}
                value={selectedOrigenSeleccion}
                onChange={(opt) => setField("OrigenSeleccion", opt?.label ?? "")}
                classNamePrefix="rs"
                isDisabled={loadingOrigen || isView}
                isLoading={loadingOrigen}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
              <small>{errors.OrigenSeleccion}</small>
            </div>

            {/* Informacion enviada por */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="enviadaPor"> Información enviada por *</label>
              <input disabled={isView}id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
            </div>

            {/* Fecha salida cesacion */}
            <div className="ft-field">
              <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
              <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.FechaReporte ?? ""} autoComplete="off" required aria-required="true" readOnly/>
            </div>
          </form>
        </>
      }

        {/* Acciones */}
        <div className="ft-actions">
            <button disabled={isView || selectedRetail?.Estado === "Cancelado" || submitting} type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreateRetail(e)}>
              {isView || selectedRetail?.Estado === "Cancelado" ? "No se puede editar este registro ya que fue usado" : submitting ? "Guardando" : "Guardar"}
            </button> 
            { isView || tipo === "edit" ?
              <button type="submit" className="btn btn-xs" onClick={() => setFlow(true)}>Detalles</button> : null
            }
            { (isView || tipo === "edit") ?
              <button type="submit" className="btn btn-xs btn-danger" onClick={() => {
                                                                        selectedRetail?.Estado === "Cancelado" ? 
                                                                          handleReactivateProcessById(selectedRetail.Id ?? "") : 
                                                                          setCancelProcess(true)}}
                                                                        >
                {selectedRetail?.Estado !== "Cancelado" ? "Cancelar proceso" : "Reactivar proceso"}
              </button> : null
            }
          <button type="button" className="btn btn-xs" onClick={onClose}>Cancelar</button>
        </div>
        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
      </section>
    </div>
  );
}
