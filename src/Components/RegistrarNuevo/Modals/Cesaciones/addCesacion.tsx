import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../models/Desplegables";
import {useCargo, useDeptosMunicipios, useEmpresasSelect, useNivelCargo, useTipoDocumentoSelect,} from "../../../../Funcionalidades/Desplegables";
import { useAuth } from "../../../../auth/authProvider";
import { useCesaciones } from "../../../../Funcionalidades/Cesaciones";
import { useDependencias } from "../../../../Funcionalidades/Dependencias";

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
  const { Maestro, Cesaciones, DeptosYMunicipios } = useGraphServices();
  const { state, setField, handleSubmit, errors, cleanState, loadFirstPage } = useCesaciones(Cesaciones);
  const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Maestro);
  const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
  const { options: tipoDocOptions, loading: loadingTipoDoc, reload: reloadTipoDoc} = useTipoDocumentoSelect(Maestro);
  const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
  const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo} = useNivelCargo(Maestro);
  const { options: dependenciaOptions, loading: loadingDependencias } = useDependencias();


  React.useEffect(() => {
      reloadEmpresas();
      reloadCargo();
      reloadTipoDoc();
      reloadDeptos()
      reloadNivelCargo()
  }, [reloadEmpresas, reloadCargo, reloadTipoDoc, reloadDeptos, reloadNivelCargo]);

  const selectedEmpresa = empresaOptions.find((o) => o.label === state.Empresaalaquepertenece) ?? null;
  const selectedCargo = cargoOptions.find((o) => o.label === state.Cargo) ?? null;
  const selectedTipoDocumento = tipoDocOptions.find((o) => o.label === state.TipoDoc) ?? null;
  const selectedNivelCargo = nivelCargoOptions.find((o) => o.label === state.Niveldecargo) ?? null;   
  const selectedDependencia = dependenciaOptions.find((o) => o.value === state.Dependencia) ?? null;


  /* ================== Display local para campos monetarios ================== */
  //const [conectividad, setConectividad] = React.useState<Number>(0);
  //const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");  
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");
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

  /*
  React.useEffect(() => {
    if (state.SALARIO != null && state.SALARIO !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.SALARIO)));
    } else {
      setDisplaySalario("");
    }
  }, [state.SALARIO]);*/

/*
  React.useEffect(() => {
    const dosSalarios = 2846000
    const valor = Number(state.SALARIO)
    if(valor <= dosSalarios){
      setConectividadTexto("Doscientos mil pesos");
      setConectividad(200000)
      
    } else if (valor > dosSalarios && planFinanciado){
      setConectividad(23095)
      setConectividadTexto("veintitrés mil noventa y cinco pesos")
    } else if(valor > dosSalarios || state.CARGO.toLocaleLowerCase().includes("aprendiz") || state.CARGO.toLocaleLowerCase().includes("practicante")){
      setConectividad(46150)
      setConectividadTexto("Cuarenta y seis mil ciento noventa pesos")
    }
    setField("auxconectividadtexto", conectividadTexto)
    setField("auxconectividadvalor", String(conectividad))
  }, [state.SALARIO, planFinanciado]);*/

  /*
  React.useEffect(() => {
    const salario = Number(state.SALARIO || 0);
    const porcentaje = Number(porcentajeValor || 0);

    const valor = Math.round(salario * (porcentaje / 100)); // redondeo para evitar decimales raros

    setValorGarantizado(valor);
    setField("VALOR_x0020_GARANTIZADO", String(valor));
    setField("Garantizado_x0020_en_x0020_letra", valor > 0 ? numeroATexto(valor) : "");
  }, [state.SALARIO, porcentajeValor, setField]);*/

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

            {/* Fecha salida cesacion */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="Fechaenlaquesereporta">Fecha en la que se reporta *</label>
            <input id="Fechaenlaquesereporta" name="Fechaenlaquesereporta" type="date" value={state.Fechaenlaquesereporta ?? ""} autoComplete="off" required aria-required="true"/>
          </div>


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
