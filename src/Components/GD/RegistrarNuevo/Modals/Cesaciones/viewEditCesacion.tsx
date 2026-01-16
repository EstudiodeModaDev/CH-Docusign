import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import {useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useEmpresasSelect, useNivelCargo, useTemporales, useTipoDocumentoSelect, useUnidadNegocio,} from "../../../../../Funcionalidades/Desplegables";
import { useAuth } from "../../../../../auth/authProvider";
import { useCesaciones } from "../../../../../Funcionalidades/GD/Cesaciones";
import { useDependencias } from "../../../../../Funcionalidades/Dependencias";
import { formatPesosEsCO, numeroATexto,  } from "../../../../../utils/Number";
import { useSalarios } from "../../../../../Funcionalidades/GD/Salario";
import type { Cesacion, DetallesPasos } from "../../../../../models/Cesaciones";
import { toISODateFlex } from "../../../../../utils/Date";
import { ProcessDetail } from "./procesoCesacion";
import { useDetallesPasosCesacion, usePasosCesacion } from "../../../../../Funcionalidades/GD/PasosCesacion";
import { useAutomaticCargo } from "../../../../../Funcionalidades/GD/Niveles";
import { CancelProcessModal } from "../../../View/CancelProcess/CancelProcess";

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
  selectedCesacion:  Cesacion
  tipo: string
};

/* ================== Formulario ================== */
export default function EditCesacion({onClose, selectedCesacion, tipo}: Props){
    const { Maestro, Cesaciones, DeptosYMunicipios, salarios, DetallesPasosCesacion, categorias, CesacionCancelada, configuraciones } = useGraphServices();
    const { state, setField, handleEdit, errors, handleCancelProcessbyId} = useCesaciones(Cesaciones, CesacionCancelada);
    const { byId, decisiones, setDecisiones, motivos, setMotivos, handleCompleteStep, error: errorPasos, loading: loadingPasos, } = usePasosCesacion()
    const { loading: loadingDetalles, rows: rowsDetalles, error: errorDetalles, loadDetallesCesacion, calcPorcentaje} = useDetallesPasosCesacion(DetallesPasosCesacion, selectedCesacion.Id ?? "")
    const { loadSpecificSalary } = useSalarios(salarios);
    const { loadSpecificLevel } = useAutomaticCargo(categorias);
    const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Maestro);
    const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
    const { options: tipoDocOptions, loading: loadingTipoDoc, reload: reloadTipoDoc} = useTipoDocumentoSelect(Maestro);
    const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
    const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo} = useNivelCargo(Maestro);
    const { options: dependenciaOptions, loading: loadingDependencias } = useDependencias();  
    const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC} = useCentroCostos(Maestro);
    const { options: COOptions, loading: loadingCO, reload: reloadCO} = useCentroOperativo(Maestro);
    const { options: UNOptions, loading: loadingUN, reload: reloadUN} = useUnidadNegocio(Maestro);
    const { options: tiemposOptions, loading: loadingTiempos, reload: reloadTiempos} = useTemporales(Maestro);

    const showCargos = React.useMemo(() => new Set<string>(["31", "42", "9", "33"]), []);
        const filteredCargoOptions = React.useMemo(
        () => cargoOptions.filter(o => showCargos.has(String(o.value))),
        [cargoOptions, showCargos]
    );

    React.useEffect(() => {
        reloadEmpresas();
        reloadCargo();
        reloadTipoDoc();
        reloadDeptos()
        reloadNivelCargo();
        reloadCC();
        reloadCO();
        reloadUN();
        reloadTiempos()
    }, []);

    React.useEffect(() => {
        if (!selectedCesacion) return;
        setField("Id", selectedCesacion?.Id ?? "");
        setField("Autonomia", selectedCesacion?.Autonomia ?? "");
        setField("Cargo", selectedCesacion.Cargo ?? "");
        setField("CargoCritico", selectedCesacion.CargoCritico ?? "");
        setField("Celular", selectedCesacion.Celular ?? "");
        setField("Ciudad", selectedCesacion.Ciudad ?? "");
        setField("CodigoCC", selectedCesacion.CodigoCC ?? "");
        setField("CodigoCO", selectedCesacion.CodigoCO ?? "");
        setField("CodigoUN", selectedCesacion.CodigoUN ?? "");
        setField("Departamento", selectedCesacion.Departamento ?? "");
        setField("Correoelectronico", selectedCesacion.Correoelectronico ?? "");
        setField("Dependencia", selectedCesacion.Dependencia ?? "");
        setField("DescripcionCC", selectedCesacion.DescripcionCC ?? "" as any);
        setField("DescripcionCO", selectedCesacion.DescripcionCO ?? "");
        setField("DescripcionUN", selectedCesacion.DescripcionUN ?? false);
        setField("Empresaalaquepertenece", selectedCesacion.Empresaalaquepertenece ?? "" as any);
        setField("FechaIngreso", toISODateFlex(selectedCesacion.FechaIngreso) ?? null);
        setField("FechaLimiteDocumentos", toISODateFlex(selectedCesacion.FechaLimiteDocumentos) ?? null);
        setField("FechaSalidaCesacion", toISODateFlex(selectedCesacion.FechaSalidaCesacion) ?? null as any);
        setField("Fechaenlaquesereporta", toISODateFlex(selectedCesacion.Fechaenlaquesereporta) ?? "");
        setField("ImpactoCliente", selectedCesacion.ImpactoCliente ?? "");
        setField("Jefedezona", selectedCesacion.Jefedezona ?? "");
        setField("Niveldecargo", selectedCesacion.Niveldecargo ?? "");
        setField("Nombre", selectedCesacion.Nombre ?? "");
        setField("Promedio", selectedCesacion.Promedio ?? "");
        setField("Reportadopor", selectedCesacion.Reportadopor ?? "");
        setField("Salario", selectedCesacion.Salario ?? "");
        setField("SalarioTexto", selectedCesacion.SalarioTexto ?? "");
        setField("Temporal", selectedCesacion.Temporal ?? "");
        setField("Tienda", selectedCesacion.Tienda ?? "");
        setField("TipoDoc", selectedCesacion.TipoDoc ?? "No");
        setField("Title", selectedCesacion.Title ?? "No");
        setField("auxConectividadTexto", selectedCesacion.auxConectividadTexto ?? "");
        setField("auxConectividadValor", selectedCesacion.auxConectividadValor ?? "");
    }, [selectedCesacion]);

  const selectedEmpresa = empresaOptions.find((o) => o.label === state.Empresaalaquepertenece) ?? null;
  const selectedCargo = cargoOptions.find((o) => o.label.toLocaleLowerCase() === state.Cargo.toLocaleLowerCase()) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => o.label === state.TipoDoc) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => o.label === state.Niveldecargo) ?? null;   
  const selectedDependencia = dependenciaOptions.find((o) => o.value === state.Dependencia) ?? null;  
  const selectedCentroCostos = CentroCostosOptions.find((o) => o.value === state.CodigoCC) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => o.value === state.CodigoCO) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => o.value === state.CodigoUN) ?? null;
  const selectedTemporal = tiemposOptions.find((o) => o.label.toLocaleLowerCase() === state.Temporal.toLocaleLowerCase()) ?? null;


  /* ================== Display local para campos monetarios ================== */
  const [conectividad, setConectividad] = React.useState<Number>(0);
  const [minimo, setMinimo] = React.useState<Number>(0);
  const [auxTransporte, setAuxTransporte] = React.useState<Number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [displaySalario, setDisplaySalario] = React.useState<string>("");
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");  
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [modal, setModal] = React.useState<boolean>(false)
  const [cancelProcess, setCancelProcess] = React.useState(false)
  const {account} = useAuth()
  const isView = tipo === "view"

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

  React.useEffect(() => {
    if (state.Salario != null && state.Salario !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.Salario)));
    } else {
      setDisplaySalario("");
    }
  }, [state.Salario]);

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

  React.useEffect(() => {

    const run = async () => {
      const salario = (await configuraciones.get("1")).Valor
      const auxTransporte = await (await configuraciones.get("2")).Valor
      setMinimo(Number(salario))
      setAuxTransporte(Number(auxTransporte))
    };

    run();
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
    await handleCancelProcessbyId(selectedCesacion.Id ?? "", razon)
    setCancelProcess(false)
  };
  
  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        { modal ? <ProcessDetail 
                    titulo={"Detalles cesacion de: " + selectedCesacion.Title + " - " + selectedCesacion.Nombre}
                    selectedCesacion={selectedCesacion}
                    onClose={() => setModal(false)}
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
                    proceso={"Cesacion"}/>: 
        <>
        <h2 id="ft_title" className="ft-title">Nueva Cesación</h2>

        <form className="ft-form" noValidate>
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

          <div className="ft-field">
            <label className="ft-label" htmlFor="tipoDocumento">Tipo de documento *</label>
            <Select<desplegablesOption, false>
              inputId="tipoDocumento"
              options={tipoDocOptions}
              placeholder={loadingTipoDoc ? "Cargando opciones…" : "Buscar tipo de documento..."}
              value={selectedTipoDocumento}
              onChange={(opt) => {setField("TipoDoc", opt?.label ?? "");}}
              classNamePrefix="rs"
              isDisabled={loadingTipoDoc || isView}
              isLoading={loadingTipoDoc}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
            />
            <small>{errors.TipoDoc}</small>
          </div>

          {/* Número documento */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Número de identificación *</label>
            <input id="Title" name="Title" type="number" placeholder="Ingrese el número de documento" value={state.Title ?? ""} onChange={(e) => setField("Title", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Title}</small>
          </div>

          {/* Nombre seleccionado */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Nombre"> Nombre del seleccionado *</label>
            <input id="Nombre" name="Nombre" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.Nombre ?? ""} onChange={(e) => setField("Nombre", e.target.value)} autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Nombre}</small>
          </div>

          {/* Correo */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
            <input id="correo" name="Correoelectronico" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.Correoelectronico ?? ""} onChange={(e) => setField("Correoelectronico", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Correoelectronico}</small>
          </div>

          {/* Celular */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Celular</label>
            <input id="Title" name="Title" type="number" placeholder="Ingrese el numero de celular" value={state.Celular ?? ""} onChange={(e) => setField("Celular", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Title}</small>
          </div>

          {/* Fecha requerida para el ingreso */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="fechaIngreso">Fecha de ingreso *</label>
            <input id="FechaIngreso" name="FechaIngreso" type="date" value={state.FechaIngreso ?? ""} onChange={(e) => setField("FechaIngreso", e.target.value)}
              autoComplete="off" required aria-required="true" disabled={isView}/>
            <small>{errors.FechaIngreso}</small>
          </div>

          {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaSalidaCesacion">Fecha salida cesación *</label>
            <input id="FechaSalidaCesacion" name="FechaSalidaCesacion" type="date" value={state.FechaSalidaCesacion ?? ""} onChange={(e) => setField("FechaSalidaCesacion", e.target.value)}
              autoComplete="off" required aria-required="true" disabled={isView}/>
            <small>{errors.FechaIngreso}</small>
          </div>

          {/* Fecha limite documentos */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaLimiteDocumentos">Fecha limite documentos *</label>
            <input id="FechaLimiteDocumentos" name="FechaLimiteDocumentos" type="date" value={state.FechaLimiteDocumentos ?? ""} onChange={(e) => setField("FechaLimiteDocumentos", e.target.value)}
              autoComplete="off" required aria-required="true" disabled={isView}/>
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
                <input type="radio" name="critico" value="Si" checked={state.CargoCritico === "Si"} onChange={() => setField("CargoCritico", "Si")} disabled={isView}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input type="radio" name="critico" value="No" checked={state.CargoCritico === "No"} onChange={() => setField("CargoCritico", "No")} disabled={isView}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {/* Salario */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Salario *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" disabled={isView} value={displaySalario} onChange={(e) => setField("Salario", e.target.value)}/>
          </div>

          {/* Salario */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Salario en letras *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={numeroATexto(Number(state.Salario))} readOnly/>
          </div>

          {/* Auxilio de conectividad */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Auxilio de tranporte y conectividad *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={formatPesosEsCO(String(conectividad))} readOnly/>
          </div>

          {/* Auxilio de conectividad texto */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Auxilio de tranporte y conectividad en letras *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={conectividadTexto} readOnly/>
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
              placeholder={loadingDepto ? "Cargando opciones…" : "Buscar departamento..."}
              value={selectedDepto ? { value: selectedDepto, label: selectedDepto } : state.Departamento ? { value: state.Departamento, label: state.Departamento } : null}
              onChange={(opt) => {
                const value = opt?.value ?? "";
                setSelectedDepto(value);
                setSelectedMunicipio("");           
                setField("Departamento", value);  
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
                setField("Ciudad", value);          
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
              options={tiemposOptions}
              placeholder={loadingTiempos ? "Cargando opciones…" : "Buscar temporal..."}
              value={selectedTemporal}
              onChange={(opt) => {setField("Temporal", opt?.label ?? "");}}
              classNamePrefix="rs"
              isDisabled={loadingTiempos}
              isLoading={loadingTiempos}
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

          {/* Informacion enviada por */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="enviadaPor"> Información enviada por *</label>
            <input id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
          </div>

          {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
            <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.Fechaenlaquesereporta ?? ""} autoComplete="off" required aria-required="true" readOnly/>
          </div>
        </form>
        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
        {/* Acciones */}
        <div className="ft-actions">
          {!isView ? <button type="submit" className="btn btn-primary btn-xs" onClick={(e) => {handleEdit(e, selectedCesacion);}}>Guardar Registro</button> : <small>Este registro ya ha sido usado, no puede ser editado</small>}
          <button type="button" className="btn btn-xs" onClick={() => {setModal(true)}}>Detalles</button>
          <button type="submit" className="btn btn-xs btn-danger" onClick={() => setCancelProcess(true)}>Cancelar Proceso</button>
          <button type="button" className="btn btn-xs" onClick={() => onClose()}>Cancelar</button>
          
        </div>
        </>
        }
      </section>
    </div>)
};
