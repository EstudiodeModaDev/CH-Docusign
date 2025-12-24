import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../models/Desplegables";
import {useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useEmpresasSelect, useNivelCargo, useTipoDocumentoSelect, useUnidadNegocio,} from "../../../../Funcionalidades/Desplegables";
import { useAuth } from "../../../../auth/authProvider";
import { useCesaciones } from "../../../../Funcionalidades/Cesaciones";
import { useDependencias } from "../../../../Funcionalidades/Dependencias";
import { formatPesosEsCO } from "../../../../utils/Number";
//import { useSalarios } from "../../../../Funcionalidades/Salario";

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
};

/* ================== Formulario ================== */
export default function FormCesacion({onClose}: Props){
  const { Maestro, Cesaciones, DeptosYMunicipios, /*salarios*/ } = useGraphServices();
  const { state, setField, handleSubmit, errors, cleanState, loadFirstPage } = useCesaciones(Cesaciones);
  //const { loadSpecificSalary } = useSalarios(salarios);
  const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Maestro);
  const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
  const { options: tipoDocOptions, loading: loadingTipoDoc, reload: reloadTipoDoc} = useTipoDocumentoSelect(Maestro);
  const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
  const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo} = useNivelCargo(Maestro);
  const { options: dependenciaOptions, loading: loadingDependencias } = useDependencias();  
  const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC} = useCentroCostos(Maestro);
  const { options: COOptions, loading: loadingCO, reload: reloadCO} = useCentroOperativo(Maestro);
  const { options: UNOptions, loading: loadingUN, reload: reloadUN} = useUnidadNegocio(Maestro);


  React.useEffect(() => {
      reloadEmpresas();
      reloadCargo();
      reloadTipoDoc();
      reloadDeptos()
      reloadNivelCargo();
      reloadCC();
      reloadCO();
      reloadUN();
  }, [reloadEmpresas, reloadCargo, reloadTipoDoc, reloadDeptos, reloadNivelCargo, reloadCC]);

  const selectedEmpresa = empresaOptions.find((o) => o.label === state.Empresaalaquepertenece) ?? null;
  const selectedCargo = cargoOptions.find((o) => o.label === state.Cargo) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => o.label === state.TipoDoc) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => o.label === state.Niveldecargo) ?? null;   
  const selectedDependencia = dependenciaOptions.find((o) => o.value === state.Dependencia) ?? null;  
  const selectedCentroCostos = CentroCostosOptions.find((o) => o.value === state.CodigoCC) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => o.value === state.CodigoCO) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => o.value === state.DescripcionUN) ?? null;


  /* ================== Display local para campos monetarios ================== */
  const [conectividad, setConectividad] = React.useState<Number>(0);
  const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [displaySalario, setDisplaySalario] = React.useState<string>("");
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");  
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
  const [promedio, setPromedio] = React.useState<number>(0);
  const [grupoCVE, setGrupoCVE] = React.useState<string>("");
  const {account} = useAuth()

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
    setPromedio(1),
    setGrupoCVE("")
  }, [state.Cargo]);

  React.useEffect(() => {
    if (state.Salario != null && state.Salario !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.Salario)));
    } else {
      setDisplaySalario("");
    }
  }, [state.Salario]);

  React.useEffect(() => {
    const dosSalarios = 2846000
    const valor = Number(state.Salario)
    if(valor <= dosSalarios){
      setConectividadTexto("Doscientos mil pesos");
      setConectividad(200000)
      
    } /*else if (valor > dosSalarios && planFinanciado){
      setConectividad(23095)
      setConectividadTexto("veintitrés mil noventa y cinco pesos")*/
    else if(valor > dosSalarios || state.Cargo.toLocaleLowerCase().includes("aprendiz") || state.Cargo.toLocaleLowerCase().includes("practicante")){
      setConectividad(46150)
      setConectividadTexto("Cuarenta y seis mil ciento noventa pesos")
    }
    setField("auxConectividadTexto", conectividadTexto)
    setField("auxConectividadValor", String(conectividad))
  }, [state.Salario]);

  const handleCreateNovedad = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await handleSubmit(); // <- haz que devuelva true/false
    if (!ok) return;

    await loadFirstPage();
    cleanState();
    onClose();
  };
  
  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
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
              isDisabled={loadingEmp}
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
              isDisabled={loadingTipoDoc}
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
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Title}</small>
          </div>

          {/* Nombre seleccionado */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Nombre"> Nombre del seleccionado *</label>
            <input id="Nombre" name="Nombre" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.Nombre ?? ""} onChange={(e) => setField("Nombre", e.target.value)} autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Nombre}</small>
          </div>

          {/* Correo */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
            <input id="correo" name="Correoelectronico" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.Correoelectronico ?? ""} onChange={(e) => setField("Correoelectronico", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Correoelectronico}</small>
          </div>

          {/* Celular */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Celular *</label>
            <input id="Title" name="Title" type="number" placeholder="Ingrese el numero de celular" value={state.Celular ?? ""} onChange={(e) => setField("Celular", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Title}</small>
          </div>

          {/* Fecha requerida para el ingreso */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="fechaIngreso">Fecha de ingreso *</label>
            <input id="FechaIngreso" name="FechaIngreso" type="date" value={state.FechaIngreso ?? ""} onChange={(e) => setField("FechaIngreso", e.target.value)}
              autoComplete="off" required aria-required="true"/>
            <small>{errors.FechaIngreso}</small>
          </div>

          {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaSalidaCesacion">Fecha salida cesación *</label>
            <input id="FechaSalidaCesacion" name="FechaSalidaCesacion" type="date" value={state.FechaSalidaCesacion ?? ""} onChange={(e) => setField("FechaSalidaCesacion", e.target.value)}
              autoComplete="off" required aria-required="true"/>
            <small>{errors.FechaIngreso}</small>
          </div>

          {/* Fecha ingreso cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaIngresoCesacion">Fecha de ingreso cesacion*</label>
            <input id="FechaIngresoCesacion" name="FechaIngresoCesacion" type="date" value={state.FechaIngresoCesacion ?? ""} onChange={(e) => setField("FechaIngresoCesacion", e.target.value)}
              autoComplete="off" required aria-required="true"/>
            <small>{errors.FechaIngreso}</small>
          </div>


            {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
            <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.Fechaenlaquesereporta ?? ""} autoComplete="off" required aria-required="true"/>
          </div>

          {/* Fecha limite documentos */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaLimiteDocumentos">Fecha limite documentos *</label>
            <input id="FechaLimiteDocumentos" name="FechaLimiteDocumentos" type="date" value={state.FechaLimiteDocumentos ?? ""} onChange={(e) => setField("FechaLimiteDocumentos", e.target.value)}
              autoComplete="off" required aria-required="true"/>
            <small>{errors.FechaIngreso}</small>
          </div>

          {/* ================= Cargo ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="cargo">Cargo * </label>
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

          {/* Salario */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Salario *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={displaySalario} readOnly/>
          </div>

          {/* Salario */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Salario en letras *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={displaySalario} readOnly/>
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
              isDisabled={loadinNivelCargo}
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
              isDisabled={loadingDependencias}
              isLoading={loadingDependencias}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
            />
            <small>{errors.Dependencia}</small>
          </div>

          {/* Jefe de zona */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Jefe de zona *</label>
            <input id="Title" name="Title" type="text" placeholder="Ingrese el jefe de zona" value={state.Jefedezona ?? ""} onChange={(e) => setField("Jefedezona", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Jefedezona}</small>
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
              placeholder={!selectedDepto ? "Selecciona primero un departamento..." : loadingDepto ? "Cargando municipios…" : "Selecciona un municipio..."}
              value={ selectedMunicipio ? { value: selectedMunicipio, label: selectedMunicipio } : state.Ciudad ? { value: state.Ciudad, label: state.Ciudad } : null}
              onChange={(opt) => {
                const value = opt?.value ?? "";
                setSelectedMunicipio(value);
                setField("Ciudad", value);          
              }}
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

          {/* Temporal */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Temporal *</label>
            <input id="Title" name="Title" type="text" placeholder="Ingrese la temporal" value={state.Temporal ?? ""} onChange={(e) => setField("Temporal", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Title}</small>
          </div>

          {/* Tienda */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Tienda *</label>
            <input id="Title" name="Title" type="text" placeholder="Ingrese la tienda" value={state.Tienda ?? ""} onChange={(e) => setField("Tienda", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300}/>
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
              isDisabled={loadingCC}
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
              isDisabled={loadingCO}
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
              isDisabled={loadingUN}
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
            <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CodigoUN} readOnly/>
          </div>

          {/* ¿Pertenece al modelo? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Pertenece al modelo? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input type="radio" name="modelo" value="Si" checked={!!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", true)}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input type="radio" name="modelo" value="No" checked={!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", false)}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.Pertenecealmodelo && (
            <>
              <div className="ft-field">
                <label className="ft-label" htmlFor="Autonomia">Autonomía *</label>
                <select name="Autonomia" onChange={(e) => setField("Autonomia", e.target.value)}>
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
                <select name="presupuesto" onChange={(e) => setField("PresupuestaVentas", e.target.value)}>
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
                <select name="impacto" onChange={(e) => setField("ImpactoCliente", e.target.value)}>
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
                <select name="contribucion" onChange={(e) => setField("contribucionEstrategia", e.target.value)}>
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
        </form>
        {/* Acciones */}
        <div className="ft-actions">
          <button type="submit" className="btn btn-primary btn-xs" onClick={(e) => {handleCreateNovedad(e);}}>Guardar Registro</button>
          <button type="button" className="btn btn-xs" onClick={() => onClose()}>Cancelar</button>
        </div>
      </section>
    </div>
  );
};
