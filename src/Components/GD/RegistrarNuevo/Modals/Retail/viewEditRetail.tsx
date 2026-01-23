import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import {useCargo, useCentroCostos, useCentroOperativo, useDependenciasMixtas, useDeptosMunicipios, useEmpresasSelect, useNivelCargo, useTipoDocumentoSelect, useUnidadNegocio,} from "../../../../../Funcionalidades/Desplegables";
import { formatPesosEsCO, numeroATexto,  } from "../../../../../utils/Number";
import { useSalarios } from "../../../../../Funcionalidades/GD/Salario";
import type { DetallesPasos } from "../../../../../models/Cesaciones";
import { toISODateFlex } from "../../../../../utils/Date";
import { useAutomaticCargo } from "../../../../../Funcionalidades/GD/Niveles";
import type { Retail } from "../../../../../models/Retail";
import { useRetail } from "../../../../../Funcionalidades/GD/Retail";
import { ProcessDetail } from "../Cesaciones/procesoCesacion";
import { useDetallesPasosRetail, usePasosRetail } from "../../../../../Funcionalidades/GD/PasosRetail";
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
  selectedRetail:  Retail
  tipo: string
};

/* ================== Formulario ================== */
export default function EditRetail({onClose, selectedRetail, tipo}: Props){
    const { Maestro, Retail, DeptosYMunicipios, salarios, detallesPasosRetail, categorias, retailCancelados, configuraciones } = useGraphServices();
    const { state, setField, handleEdit, errors, handleCancelProcessbyId} = useRetail(Retail, retailCancelados);
    const { byId, decisiones, setDecisiones, motivos, setMotivos, handleCompleteStep, error: errorPasos, loading: loadingPasos} = usePasosRetail()
    const { loading: loadingDetalles, rows: rowsDetalles, error: errorDetalles, loadDetallesPromocion, calcPorcentaje} = useDetallesPasosRetail(detallesPasosRetail, selectedRetail.Id ?? "")
    const { loadSpecificSalary } = useSalarios(salarios);
    const { loadSpecificLevel } = useAutomaticCargo(categorias);
    const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Maestro);
    const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
    const { options: tipoDocOptions, loading: loadingTipoDoc, reload: reloadTipoDoc} = useTipoDocumentoSelect(Maestro);
    const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
    const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo} = useNivelCargo(Maestro);
    const { options: dependenciaOptions, loading: loadingDependencias } = useDependenciasMixtas(Maestro);
    const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC} = useCentroCostos(Maestro);
    const { options: COOptions, loading: loadingCO, reload: reloadCO} = useCentroOperativo(Maestro);
    const { options: UNOptions, loading: loadingUN, reload: reloadUN} = useUnidadNegocio(Maestro);

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
    }, []);

    React.useEffect(() => {
        if (!selectedRetail) return;
        setField("Id", selectedRetail?.Id ?? "");
        setField("Autonomia", selectedRetail?.Autonomia ?? "");
        setField("Cargo", selectedRetail.Cargo ?? "");
        setField("Auxiliodetransporte", selectedRetail.Auxiliodetransporte ?? "");
        setField("Celular", selectedRetail.Celular ?? "");
        setField("Ciudad", selectedRetail.Ciudad ?? "");
        setField("CodigoCentroOperativo", selectedRetail.CodigoCentroOperativo ?? "");
        setField("CodigoCentroCostos", selectedRetail.CodigoCentroCostos ?? "");
        setField("CodigoUnidadNegocio", selectedRetail.CodigoUnidadNegocio ?? "");
        setField("Departamento", selectedRetail.Departamento ?? "");
        setField("CorreoElectronico", selectedRetail.CorreoElectronico ?? "");
        setField("Depedencia", selectedRetail.Depedencia ?? "");
        setField("CentroCostos", selectedRetail.CentroCostos ?? "" as any);
        setField("CentroOperativo", selectedRetail.CentroOperativo ?? "");
        setField("UnidadNegocio", selectedRetail.UnidadNegocio ?? false);
        setField("Empresaalaquepertenece", selectedRetail.Empresaalaquepertenece ?? "" as any);
        setField("FechaIngreso", toISODateFlex(selectedRetail.FechaIngreso) ?? null);
        setField("FechaReporte", toISODateFlex(selectedRetail.FechaReporte) ?? "");
        setField("GrupoCVE", selectedRetail.GrupoCVE ?? "");
        setField("Impacto", selectedRetail.Impacto ?? "");
        setField("NivelCargo", selectedRetail.NivelCargo ?? "");
        setField("Nombre", selectedRetail.Nombre ?? "");
        setField("PerteneceModelo", selectedRetail.PerteneceModelo ?? false);
        setField("Presupuesto", selectedRetail.Presupuesto ?? "");
        setField("Promedio", selectedRetail.Promedio ?? "");
        setField("InformacionEnviadaPor", selectedRetail.InformacionEnviadaPor ?? "");
        setField("Salario", selectedRetail.Salario ?? "");
        setField("SalarioLetras", selectedRetail.SalarioLetras ?? "");
        setField("Temporal", selectedRetail.Temporal ?? "");
        setField("TipoDoc", selectedRetail.TipoDoc ?? "No");
        setField("Title", selectedRetail.Title ?? "No");
        setField("Auxiliodetransporte", selectedRetail.Auxiliodetransporte ?? "");
        setField("Auxiliotransporteletras", selectedRetail.Auxiliotransporteletras ?? "");
        setField("Contribucion", selectedRetail.Contribucion ?? "");
    }, [selectedRetail]);

  const selectedEmpresa = empresaOptions.find((o) => o.label === state.Empresaalaquepertenece) ?? null;
  const selectedCargo = cargoOptions.find((o) => o.label.toLocaleLowerCase() === state.Cargo.toLocaleLowerCase()) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => o.label.toLocaleLowerCase() === state.TipoDoc.toLocaleLowerCase()) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => o.label.toLocaleLowerCase() === state.NivelCargo.toLocaleLowerCase()) ?? null;   
  const selectedDependencia = dependenciaOptions.find((o) => o.label.toLocaleLowerCase() === state.Depedencia.toLocaleLowerCase()) ?? null;  
  const selectedCentroCostos = CentroCostosOptions.find((o) => o.value.toLocaleLowerCase() === state.CodigoCentroCostos.toLocaleLowerCase()) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => o.value.toLocaleLowerCase() === state.CodigoCentroOperativo.toLocaleLowerCase()) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => o.value.toLocaleLowerCase() === state.CodigoUnidadNegocio.toLocaleLowerCase()) ?? null;

  /* ================== Display local para campos monetarios ================== */
  const [conectividad, setConectividad] = React.useState<Number>(0);
  const [minimo, setMinimo] = React.useState<Number>(0);
  const [auxTransporte, setAuxTransporte] = React.useState<Number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [displaySalario, setDisplaySalario] = React.useState<string>("");
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");  
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [promedio, setPromedio] = React.useState<number>(0);
  const [grupoCVE, setGrupoCVE] = React.useState<string>("");
  const [modal, setModal] = React.useState<boolean>(false)
  const [cancelProcess, setCancelProcess] = React.useState(false)
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
        setField("SalarioLetras", numeroATexto(Number(salario.Salariorecomendado.toUpperCase())))
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
  }, [state.Salario, state.Cargo, state.Auxiliodetransporte, state.Auxiliotransporteletras, setField,]);

  React.useEffect(() => {
    const nextPromedio = (Number(state.Autonomia || 0) * 0.2) + (Number(state.Impacto || 0) * 0.2) + (Number(state.Contribucion || 0) * 0.3) + (Number(state.Presupuesto || 0) * 0.3);
    const red = Math.floor(nextPromedio);

    let nextGrupo = "";
    if (red === 1) nextGrupo = "Constructores";
    else if (red === 2) nextGrupo = "Desarrolladores";
    else if (red === 3) nextGrupo = "Imaginarios";
    else if (red === 4) nextGrupo = "Soñadores";

    setPromedio(nextPromedio);
    setGrupoCVE(nextGrupo);

    if (String(state.Promedio ?? "") !== String(nextPromedio)) {
      setField("Promedio", String(nextPromedio));
    }
    if (String(state.GrupoCVE ?? "") !== nextGrupo) {
      setField("GrupoCVE", nextGrupo);
    }
  }, [state.Autonomia, state.Impacto, state.Contribucion, state.Presupuesto, state.Promedio, state.GrupoCVE, setField]);

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

  React.useEffect(() => {

    const run = async () => {
      const salario = (await configuraciones.get("1")).Valor
      const auxTransporte = await (await configuraciones.get("2")).Valor
      setMinimo(Number(salario))
      setAuxTransporte(Number(auxTransporte))
    };

    run();
  }, []);

  const completeStep = React.useCallback( async (detalle: DetallesPasos, ) => {
      await handleCompleteStep(detalle);

      const porcentaje = await calcPorcentaje();

      if (Number(porcentaje) === 100) {
        const id = selectedRetail?.Id;
        if (!id) return;

        await Retail.update(id, { Estado: "Completado" });
      }
    },
    [handleCompleteStep, calcPorcentaje, selectedRetail?.Id, Retail]
  );

  const handleCancel = async (razon: string) => {
    await handleCancelProcessbyId(selectedRetail.Id ?? "", razon)
    setCancelProcess(false)
  };
  
  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        { modal ? <ProcessDetail 
                    titulo={"Detalles contratación de: " + selectedRetail.Title + " - " + selectedRetail.Nombre}
                    selectedCesacion={selectedRetail}
                    onClose={() => setModal(false)}
                    loadingPasos={loadingPasos}
                    errorPasos={errorPasos}
                    pasosById={byId}
                    decisiones={decisiones}
                    motivos={motivos}
                    setMotivos={setMotivos}
                    setDecisiones={setDecisiones}
                    handleCompleteStep={(detalle: DetallesPasos) => completeStep(detalle)}
                    detallesRows={rowsDetalles}
                    loadingDetalles={loadingDetalles}
                    errorDetalles={errorDetalles}
                    loadDetalles={() => loadDetallesPromocion()} 
                    proceso={"Cesacion"}/>: 
        <>
        <h2 id="ft_title" className="ft-title">Novedad Retail</h2>

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
            <input id="correo" name="CorreoElectronico" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.CorreoElectronico ?? ""} onChange={(e) => setField("CorreoElectronico", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.CorreoElectronico}</small>
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
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoCentroOperativo} readOnly/>
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
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoUnidadNegocio} readOnly/>
          </div>

          {/* ¿Pertenece al modelo? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Pertenece al modelo? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input type="radio" name="modelo" value="Si" checked={!!state.PerteneceModelo} onChange={() => setField("PerteneceModelo", true)} disabled={isView}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input type="radio" name="modelo" value="No" checked={!state.PerteneceModelo} onChange={() => setField("PerteneceModelo", false)} disabled={isView}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.PerteneceModelo && (
            <>
              <div className="ft-field">
                <label className="ft-label" htmlFor="Autonomia">Autonomía *</label>
                <select name="Autonomia" onChange={(e) => setField("Autonomia", e.target.value)} disabled={isView}>
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
                <select name="presupuesto" onChange={(e) => setField("Presupuesto", e.target.value)} disabled={isView}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.Presupuesto}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="impacto">Impacto cliente externo *</label>
                <select name="impacto" onChange={(e) => setField("Impacto", e.target.value)} disabled={isView}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.Impacto}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="contribucion">Contribución a la estrategia *</label>
                <select name="contribucion" onChange={(e) => setField("Contribucion", e.target.value)} disabled={isView}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.Contribucion}</small>
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



          {/* Informacion enviada por */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="enviadaPor"> Información enviada por *</label>
            <input id="enviadaPor" name="enviadaPor" type="text" value={state.InformacionEnviadaPor} readOnly/>
          </div>

          {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
            <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.FechaReporte ?? ""} autoComplete="off" required aria-required="true" readOnly/>
          </div>
        </form>

        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
        {/* Acciones */}
        <div className="ft-actions">
          {!isView ? <button type="submit" className="btn btn-primary btn-xs" onClick={(e) => {handleEdit(e, selectedRetail);}}>Guardar Registro</button> : <small>Este registro ya ha sido usado, no puede ser editado</small>}
          <button type="button" className="btn btn-xs" onClick={() => {setModal(true)}}>Detalles</button>
          <button type="submit" className="btn btn-xs btn-danger" onClick={() => setCancelProcess(true)}>Cancelar Proceso</button>
          <button type="button" className="btn btn-xs" onClick={() => onClose()}>Cerrar</button>
        </div>
        </>
        }
      </section>
    </div>)
};
