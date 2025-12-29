import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../models/Desplegables";
import {useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useEmpresasSelect, useNivelCargo, useTipoDocumentoSelect, useUnidadNegocio,} from "../../../../Funcionalidades/Desplegables";
import { useAuth } from "../../../../auth/authProvider";
import { useCesaciones } from "../../../../Funcionalidades/Cesaciones";
import { useDependencias } from "../../../../Funcionalidades/Dependencias";
import { formatPesosEsCO, numeroATexto,  } from "../../../../utils/Number";
import { useSalarios } from "../../../../Funcionalidades/Salario";
import type { Cesacion } from "../../../../models/Cesaciones";
import { toISODateFlex } from "../../../../utils/Date";
import { CesacionSteps } from "./procesoCesacion";

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
    const { Maestro, Cesaciones, DeptosYMunicipios, salarios } = useGraphServices();
    const { state, setField, handleEdit, errors, } = useCesaciones(Cesaciones);
    const { loadSpecificSalary } = useSalarios(salarios);
    const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Maestro);
    const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
    const { options: tipoDocOptions, loading: loadingTipoDoc, reload: reloadTipoDoc} = useTipoDocumentoSelect(Maestro);
    const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
    const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo} = useNivelCargo(Maestro);
    const { options: dependenciaOptions, loading: loadingDependencias } = useDependencias();  
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
        setField("FechaIngresoCesacion", toISODateFlex(selectedCesacion.FechaIngresoCesacion) ?? null);
        setField("FechaLimiteDocumentos", toISODateFlex(selectedCesacion.FechaLimiteDocumentos) ?? null);
        setField("FechaSalidaCesacion", toISODateFlex(selectedCesacion.FechaSalidaCesacion) ?? null as any);
        setField("Fechaenlaquesereporta", toISODateFlex(selectedCesacion.Fechaenlaquesereporta) ?? "");
        setField("GrupoCVE", selectedCesacion.GrupoCVE ?? "");
        setField("ImpactoCliente", selectedCesacion.ImpactoCliente ?? "");
        setField("Jefedezona", selectedCesacion.Jefedezona ?? "");
        setField("Niveldecargo", selectedCesacion.Niveldecargo ?? "");
        setField("Nombre", selectedCesacion.Nombre ?? "");
        setField("Pertenecealmodelo", selectedCesacion.Pertenecealmodelo ?? "No");
        setField("PresupuestaVentas", selectedCesacion.PresupuestaVentas ?? "");
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
        setField("contribucionEstrategia", selectedCesacion.contribucionEstrategia ?? "");
    }, [selectedCesacion]);

  const selectedEmpresa = empresaOptions.find((o) => o.label === state.Empresaalaquepertenece) ?? null;
  const selectedCargo = cargoOptions.find((o) => o.label === state.Cargo) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => o.label === state.TipoDoc) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => o.label === state.Niveldecargo) ?? null;   
  const selectedDependencia = dependenciaOptions.find((o) => o.value === state.Dependencia) ?? null;  
  const selectedCentroCostos = CentroCostosOptions.find((o) => o.value === state.CodigoCC) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => o.value === state.CodigoCO) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => o.value === state.CodigoUN) ?? null;


  /* ================== Display local para campos monetarios ================== */
  const [conectividad, setConectividad] = React.useState<Number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [displaySalario, setDisplaySalario] = React.useState<string>("");
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");  
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [promedio, setPromedio] = React.useState<number>(0);
  const [grupoCVE, setGrupoCVE] = React.useState<string>("");
  const [modal, setModal] = React.useState<boolean>(false)
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
    const dosSalarios = 2846000;
    const valor = Number(state.Salario || 0);
    const cargo = (state.Cargo || "").toLowerCase();

    let nextValor = 0;
    let nextTexto = "";

    if (valor <= dosSalarios) {
      nextValor = 200000;
      nextTexto = "Doscientos mil pesos";
    } else if (valor > dosSalarios || cargo.includes("aprendiz") || cargo.includes("practicante")) {
      nextValor = 46150;
      nextTexto = "Cuarenta y seis mil ciento noventa pesos";
    }

    // Solo actualiza si cambia (evita loops)
    if (String(state.auxConectividadValor ?? "") !== String(nextValor)) {
      setField("auxConectividadValor", String(nextValor));
    }
    if (String(state.auxConectividadTexto ?? "") !== nextTexto) {
      setField("auxConectividadTexto", nextTexto);
    }

    // si igual quieres el display local:
    setConectividad(nextValor);
    setConectividadTexto(nextTexto);
  }, [state.Salario, state.Cargo, state.auxConectividadValor, state.auxConectividadTexto, setField]);

  React.useEffect(() => {
    const nextPromedio = (Number(state.Autonomia || 0) * 0.2) + (Number(state.ImpactoCliente || 0) * 0.2) + (Number(state.contribucionEstrategia || 0) * 0.3) + (Number(state.PresupuestaVentas || 0) * 0.3);
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
  }, [state.Autonomia, state.ImpactoCliente, state.contribucionEstrategia, state.PresupuestaVentas, state.Promedio, state.GrupoCVE, setField]);
  
  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        { modal ? <CesacionSteps titulo={"Detalles cesacion de: " + selectedCesacion.Title + " - " + selectedCesacion.Nombre} selectedCesacion={selectedCesacion} onClose={() => setModal(false)}/>
          : 
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

          {/* Fecha ingreso cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaIngresoCesacion">Fecha de ingreso cesacion*</label>
            <input id="FechaIngresoCesacion" name="FechaIngresoCesacion" type="date" value={state.FechaIngresoCesacion ?? ""} onChange={(e) => setField("FechaIngresoCesacion", e.target.value)}
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
              placeholder={!selectedDepto ? "Selecciona primero un departamento..." : loadingDepto ? "Cargando municipios…" : "Selecciona un municipio..."}
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
            <input id="Title" name="Title" type="text" placeholder="Ingrese la temporal" value={state.Temporal ?? ""} onChange={(e) => setField("Temporal", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Title}</small>
          </div>

          {/* Tienda */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Tienda *</label>
            <input id="Title" name="Title" type="text" placeholder="Ingrese la tienda" value={state.Tienda ?? ""} onChange={(e) => setField("Tienda", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Title}</small>
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

          {/* ¿Pertenece al modelo? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Pertenece al modelo? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input type="radio" name="modelo" value="Si" checked={!!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", true)} disabled={isView}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input type="radio" name="modelo" value="No" checked={!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", false)} disabled={isView}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.Pertenecealmodelo && (
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
                <select name="presupuesto" onChange={(e) => setField("PresupuestaVentas", e.target.value)} disabled={isView}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.PresupuestaVentas}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="impacto">Impacto cliente externo *</label>
                <select name="impacto" onChange={(e) => setField("ImpactoCliente", e.target.value)} disabled={isView}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.ImpactoCliente}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="contribucion">Contribución a la estrategia *</label>
                <select name="contribucion" onChange={(e) => setField("contribucionEstrategia", e.target.value)} disabled={isView}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.contribucionEstrategia}</small>
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
            <input id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
          </div>

          {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
            <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.Fechaenlaquesereporta ?? ""} autoComplete="off" required aria-required="true" readOnly/>
          </div>
        </form>
        {/* Acciones */}
        <div className="ft-actions">
          {!isView ? <button type="submit" className="btn btn-primary btn-xs" onClick={(e) => {handleEdit(e, selectedCesacion);}}>Guardar Registro</button> : <small>Este registro ya ha sido usado, no puede ser editado</small>}
          <button type="button" className="btn btn-xs" onClick={() => {setModal(true)}}>Detalles</button>
          <button type="button" className="btn btn-xs" onClick={() => onClose()}>Cancelar</button>
        </div>
        </>
        }
      </section>
    </div>)
};
