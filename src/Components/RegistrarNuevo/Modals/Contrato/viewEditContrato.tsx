import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../models/Desplegables";
import {useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useEmpresasSelect, useEspecificidadCargo, useModalidadTrabajo, useNivelCargo, useOrigenSeleccion, useTipoContrato, useTipoDocumentoSelect, useTipoVacante, useUnidadNegocio,} from "../../../../Funcionalidades/Desplegables";
import { useContratos } from "../../../../Funcionalidades/Contratos";
import {formatPesosEsCO, numeroATexto, toNumberFromEsCO,} from "../../../../utils/Number";
import { useAuth } from "../../../../auth/authProvider";
import { getTodayLocalISO, toISODateFlex } from "../../../../utils/Date";
import { useDependencias } from "../../../../Funcionalidades/Dependencias";
import type { Novedad } from "../../../../models/Novedades";

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
  selectedNovedad:  Novedad
  tipo: string
};

/* ================== Formulario ================== */
export default function FormContratacion({onClose, selectedNovedad, tipo}: Props){
    const { Empresa, tipoDocumento, Contratos, cargo, modalidadTrabajo, especificidadCargo, NivelCargo, CentroCostos, CentroOperativo, UnidadNegocio, OrigenSeleccion, 
    TipoContrato, TipoVacante, DeptosYMunicipios} = useGraphServices();
    const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Empresa);
    const {options: tipoDocOptions, loading: loadingTipo, reload: reloadTipoDoc} = useTipoDocumentoSelect(tipoDocumento);
    const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(cargo);
    const { options: modalidadOptions, loading: loadingModalidad, reload: reloadModalidadTrabajo} = useModalidadTrabajo(modalidadTrabajo);
    const { options: especificidadOptions, loading: loadingEspecificdad, reload: reloadEspecidadCargo} = useEspecificidadCargo(especificidadCargo);
    const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo} = useNivelCargo(NivelCargo);
    const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC} = useCentroCostos(CentroCostos);
    const { options: COOptions, loading: loadingCO, reload: reloadCO} = useCentroOperativo(CentroOperativo);
    const { options: UNOptions, loading: loadingUN, reload: reloadUN} = useUnidadNegocio(UnidadNegocio);
    const { options: origenOptions, loading: loadingOrigen, reload: reloadOrigenSeleccion} = useOrigenSeleccion(OrigenSeleccion);
    const { options: tipoContratoOptions, loading: loadingTipoContrato, reload: reloadTipoContrato} = useTipoContrato(TipoContrato);
    const { options: tipoVacanteOptions, loading: loadingTipoVacante, reload: reloadTipoVacante} = useTipoVacante(TipoVacante);
    const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
    const { options: dependenciaOptions, loading: loadingDependencias } = useDependencias();
    const [selectedDepto, setSelectedDepto] = React.useState<string>("");
    const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");

      React.useEffect(() => {
          reloadEmpresas();
          reloadTipoDoc();
          reloadCargo();
          reloadModalidadTrabajo();
          reloadEspecidadCargo();
          reloadNivelCargo(),
          reloadCC(),
          reloadCO(),
          reloadDeptos(),
          reloadUN(),
          reloadOrigenSeleccion(),
          reloadTipoContrato(),
          reloadTipoContrato(),
          reloadTipoVacante()
      }, [reloadEmpresas, reloadTipoDoc, reloadCargo, reloadModalidadTrabajo, reloadEspecidadCargo]);

    React.useEffect(() => {
      if (!selectedNovedad) return;
      setField("Id", selectedNovedad?.Id ?? "");
      setField("Empresa_x0020_que_x0020_solicita", selectedNovedad?.Empresa_x0020_que_x0020_solicita ?? "");
      setField("tipodoc", selectedNovedad.tipodoc ?? "");
      setField("Tipo_x0020_de_x0020_documento_x0", selectedNovedad.Tipo_x0020_de_x0020_documento_x0 ?? "");
      setField("Numero_x0020_identificaci_x00f3_", selectedNovedad.Numero_x0020_identificaci_x00f3_ ?? "");
      setField("NombreSeleccionado", selectedNovedad.NombreSeleccionado ?? "");
      setField("CORREO_x0020_ELECTRONICO_x0020_", selectedNovedad.CORREO_x0020_ELECTRONICO_x0020_ ?? "");
      setField("FECHA_x0020_REQUERIDA_x0020_PARA0", selectedNovedad.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? "");
      setField("CARGO", selectedNovedad.CARGO ?? "");
      setField("Departamento", selectedNovedad.Departamento ?? "");
      setField("CIUDAD", selectedNovedad.CIUDAD ?? "");
      setField("MODALIDAD_x0020_TELETRABAJO", selectedNovedad.MODALIDAD_x0020_TELETRABAJO ?? "");
      setField("SALARIO", selectedNovedad.SALARIO ?? "" as any);
      setField("salariotexto", selectedNovedad.salariotexto ?? "");
      setField("Ajustesalario", selectedNovedad.Ajustesalario ?? false);
      setField("SALARIO_x0020_AJUSTADO", selectedNovedad.SALARIO_x0020_AJUSTADO ?? "" as any);
      setField("GARANTIZADO_x0020__x0020__x00bf_", selectedNovedad.GARANTIZADO_x0020__x0020__x00bf_ ?? "No");
      setField("VALOR_x0020_GARANTIZADO", selectedNovedad.VALOR_x0020_GARANTIZADO ?? "");
      setField("Auxilioderodamientosiono", selectedNovedad.Auxilioderodamientosiono ?? false);
      setField("Auxilio_x0020_de_x0020_rodamient", selectedNovedad.Auxilio_x0020_de_x0020_rodamient ?? "" as any);
      setField("Auxilio_x0020_de_x0020_rodamient0", selectedNovedad.Auxilio_x0020_de_x0020_rodamient0 ?? "");
      setField("CELULAR_x0020_", selectedNovedad.CELULAR_x0020_ ?? "");
      setField("DIRECCION_x0020_DE_x0020_DOMICIL", selectedNovedad.DIRECCION_x0020_DE_x0020_DOMICIL ?? "");
      setField("BARRIO_x0020_", selectedNovedad.BARRIO_x0020_ ?? "");
      setField("ESPECIFICIDAD_x0020_DEL_x0020_CA", selectedNovedad.ESPECIFICIDAD_x0020_DEL_x0020_CA ?? "");
      setField("NIVEL_x0020_DE_x0020_CARGO", selectedNovedad.NIVEL_x0020_DE_x0020_CARGO ?? "");
      setField("CARGO_x0020_CRITICO", selectedNovedad.CARGO_x0020_CRITICO ?? "No");
      setField("DEPENDENCIA_x0020_", selectedNovedad.DEPENDENCIA_x0020_ ?? "");
      setField("CODIGO_x0020_CENTRO_x0020_DE_x00", selectedNovedad.CODIGO_x0020_CENTRO_x0020_DE_x00 ?? "");
      setField("DESCRIPCION_x0020_DE_x0020_CENTR", selectedNovedad.DESCRIPCION_x0020_DE_x0020_CENTR ?? "");
      setField("CENTRO_x0020_OPERATIVO_x0020_", selectedNovedad.CENTRO_x0020_OPERATIVO_x0020_ ?? "");
      setField("DESCRIPCION_x0020_CENTRO_x0020_O", selectedNovedad.DESCRIPCION_x0020_CENTRO_x0020_O ?? "");
      setField("ID_x0020_UNIDAD_x0020_DE_x0020_N", selectedNovedad.ID_x0020_UNIDAD_x0020_DE_x0020_N ?? "");
      setField("UNIDAD_x0020_DE_x0020_NEGOCIO_x0", selectedNovedad.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 ?? "");
      setField("PERSONAS_x0020_A_x0020_CARGO", selectedNovedad.PERSONAS_x0020_A_x0020_CARGO ?? "No");
      setField("TEMPORAL", selectedNovedad.TEMPORAL ?? "No");
      setField("ORIGEN_x0020_DE_x0020_LA_x0020_S", selectedNovedad.ORIGEN_x0020_DE_x0020_LA_x0020_S ?? "");
      setField("TIPO_x0020_DE_x0020_CONTRATO", selectedNovedad.TIPO_x0020_DE_x0020_CONTRATO ?? "");
      setField("TIPO_x0020_DE_x0020_VACANTE_x002", selectedNovedad.TIPO_x0020_DE_x0020_VACANTE_x002 ?? "");
      setField("HERRAMIENTAS_x0020_QUE_x0020_POS", selectedNovedad.HERRAMIENTAS_x0020_QUE_x0020_POS ?? "");
      setField("FECHA_x0020_DE_x0020_AJUSTE_x002", selectedNovedad.FECHA_x0020_DE_x0020_AJUSTE_x002 ?? null);
      setField("FECHA_x0020_DE_x0020_ENTREGA_x00", selectedNovedad.FECHA_x0020_DE_x0020_ENTREGA_x00 ?? null);
      setField("Pertenecealmodelo", selectedNovedad.Pertenecealmodelo ?? false);
      setField("AUTONOM_x00cd_A_x0020_", selectedNovedad.AUTONOM_x00cd_A_x0020_ ?? "");
      setField("PRESUPUESTO_x0020_VENTAS_x002f_M", selectedNovedad.PRESUPUESTO_x0020_VENTAS_x002f_M ?? "");
      setField("IMPACTO_x0020_CLIENTE_x0020_EXTE", selectedNovedad.IMPACTO_x0020_CLIENTE_x0020_EXTE ?? "");
      setField("CONTRIBUCION_x0020_A_x0020_LA_x0", selectedNovedad.CONTRIBUCION_x0020_A_x0020_LA_x0 ?? "");
      setField("PROMEDIO_x0020_", selectedNovedad.PROMEDIO_x0020_ ?? "");
      setField("GRUPO_x0020_CVE_x0020_", selectedNovedad.GRUPO_x0020_CVE_x0020_ ?? "");
      setField("SE_x0020_DEBE_x0020_HACER_x0020_", selectedNovedad.SE_x0020_DEBE_x0020_HACER_x0020_ ?? "");
      setField("auxconectividadtexto", selectedNovedad.auxconectividadtexto ?? "");
      setField("auxconectividadvalor", selectedNovedad.auxconectividadvalor ?? "");
      setField("Title", selectedNovedad.Title ?? "");
      setField("FechaReporte", selectedNovedad.FechaReporte ?? "");
      setField("Informaci_x00f3_n_x0020_enviada_", selectedNovedad.Informaci_x00f3_n_x0020_enviada_)
      setField("STATUS_x0020_DE_x0020_INGRESO_x0", selectedNovedad.STATUS_x0020_DE_x0020_INGRESO_x0)
      setField("FECHA_x0020_HASTA_x0020_PARA_x00", selectedNovedad.FECHA_x0020_HASTA_x0020_PARA_x00)
      setField("Garantizado_x0020_en_x0020_letra", selectedNovedad.Garantizado_x0020_en_x0020_letra)
    }, [selectedNovedad]);

    React.useEffect(() => {
        if (!selectedNovedad.HERRAMIENTAS_x0020_QUE_x0020_POS) {
        setSelecciones([]);
        return;
        }
        const arr = selectedNovedad.HERRAMIENTAS_x0020_QUE_x0020_POS
        .split(";")
        .map(s => s.trim())
        .filter(Boolean);
        setSelecciones(arr);
    }, [selectedNovedad]);
  
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
  
    const { state, setField, errors, handleEdit } = useContratos(Contratos);
    const selectedEmpresa = empresaOptions.find((o) => o.label.toLocaleLowerCase() === state.Empresa_x0020_que_x0020_solicita.toLocaleLowerCase()) ?? null;
    const selectedTipoDocumento = tipoDocOptions.find((o) => o.label === state.tipodoc.trim()) ?? null; 
    const selectedCargo = cargoOptions.find((o) => o.label === state.CARGO) ?? null;
    const selectedModalidad = modalidadOptions.find((o) => o.label === state.MODALIDAD_x0020_TELETRABAJO) ?? null;
    const selectedEspecificidad = especificidadOptions.find((o) => o.label === state.ESPECIFICIDAD_x0020_DEL_x0020_CA) ?? null;
    const selectedNivelCargo = nivelCargoOptions.find((o) => o.label === state.NIVEL_x0020_DE_x0020_CARGO) ?? null;
    const selectedCentroCostos = CentroCostosOptions.find((o) => o.value === state.CODIGO_x0020_CENTRO_x0020_DE_x00) ?? null;
    const selectedCentroOperativo = COOptions.find((o) => o.value === state.CENTRO_x0020_OPERATIVO_x0020_) ?? null;
    const selectedUnidadNegocio = UNOptions.find((o) => o.value === state.ID_x0020_UNIDAD_x0020_DE_x0020_N) ?? null;
    const selectedOrigenSeleccion = origenOptions.find((o) => o.label === state.ORIGEN_x0020_DE_x0020_LA_x0020_S) ?? null;
    const selectedTipoContrato = tipoContratoOptions.find((o) => o.label === state.TIPO_x0020_DE_x0020_CONTRATO) ?? null;
    const selectedTipoVacante = tipoVacanteOptions.find((o) => o.label === state.TIPO_x0020_DE_x0020_VACANTE_x002) ?? null;
    const selectedDependencia = dependenciaOptions.find((o) => o.value === state.DEPENDENCIA_x0020_) ?? null;
    const opciones = [{ value: "Escritorio", label: "Escritorio" }, { value: "Silla", label: "Silla" }, { value: "Escritorio/Silla", label: "Escritorio/Silla" }];
    const isView = tipo === "view"
    /* ================== Display local para campos monetarios ================== */
    const [displaySalario, setDisplaySalario] = React.useState("");
    const [displayAuxilio, setDisplayAuxilio] = React.useState("");
    const [fechaFinalizacion, setFechaFinalizacion] = React.useState<boolean>(false);
    const [selecciones, setSelecciones] = React.useState<string[]>([]);
    const [conectividad, setConectividad] = React.useState<Number>(0);
    const [conectividadTexto, setConectividadTexto] = React.useState<string>("");
    const [planFinanciado, setPlanfinanciado] = React.useState<boolean>(false)
    const [garantizadoValor, setValorGarantizado] = React.useState<number>(0)
    const [porcentajeValor, setPorcentajeValor] = React.useState<number>(0)
    const [promedio, setPromedio] = React.useState<number>(0);
    const [grupoCVE, setGrupoCVE] = React.useState<string>("");
    const {account} = useAuth()
    const today = getTodayLocalISO()

  React.useEffect(() => {
    if (state.SALARIO != null && state.SALARIO !== "") {
      setDisplaySalario(formatPesosEsCO(String(state.SALARIO)));
    } else {
      setDisplaySalario("");
    }
  }, [state.SALARIO]);

  React.useEffect(() => {
    if (
      state.Auxilio_x0020_de_x0020_rodamient != null && state.Auxilio_x0020_de_x0020_rodamient !== ""
    ) {
      setDisplayAuxilio(formatPesosEsCO(String(state.Auxilio_x0020_de_x0020_rodamient)));
    } else {
      setDisplayAuxilio("");
    }
  }, [state.Auxilio_x0020_de_x0020_rodamient]);

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
  }, [state.SALARIO, planFinanciado]);

  React.useEffect(() => {
    let Valor
    Valor = Number(state.SALARIO) * (porcentajeValor/100)
    setValorGarantizado(Valor)
  }, [porcentajeValor]);

  React.useEffect(() => {
    let promedio
    promedio = 
      (Number(state.AUTONOM_x00cd_A_x0020_) * 0.2) + 
      (Number(state.IMPACTO_x0020_CLIENTE_x0020_EXTE) * 0.2)+
      (Number(state.CONTRIBUCION_x0020_A_x0020_LA_x0) * 0.3) +
      (Number(state.PRESUPUESTO_x0020_VENTAS_x002f_M) * 0.3)  
    setPromedio(promedio)
    const promedioRedondeado = Math.floor(promedio)
    switch(promedioRedondeado){
      case 1: {setGrupoCVE("Constructores");} break;
      case 2: setGrupoCVE("Desarrolladores"); break;
      case 3: setGrupoCVE("Imaginarios"); break;
      case 4: setGrupoCVE("Soñadores"); break;
      default: setGrupoCVE("")
    }
    setField("PROMEDIO_x0020_", String(promedio));
    setField("GRUPO_x0020_CVE_x0020_", grupoCVE)

  }, [state.AUTONOM_x00cd_A_x0020_, state.PRESUPUESTO_x0020_VENTAS_x002f_M, state.IMPACTO_x0020_CLIENTE_x0020_EXTE, state.CONTRIBUCION_x0020_A_x0020_LA_x0, promedio, grupoCVE]);

  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        <h2 id="ft_title" className="ft-title">Contratación {selectedNovedad.NombreSeleccionado}</h2>

        <form className="ft-form" noValidate>
          {/* ================= Empresa ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="solicitante">Empresa que solicita *</label>
            <Select<desplegablesOption, false>
              inputId="solicitante"
              options={empresaOptions}
              placeholder={loadingEmp ? "Cargando opciones…" : "Buscar empresa..."}
              value={selectedEmpresa}
              onChange={(opt) => setField("Empresa_x0020_que_x0020_solicita", opt?.value ?? "")}
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

          {/* ================= Tipo documento ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="tipoDocumento">Tipo de documento *</label>
            <Select<desplegablesOption, false>
              inputId="tipoDocumento"
              options={tipoDocOptions}
              placeholder={loadingTipo ? "Cargando opciones…" : "Buscar tipo de documento..."}
              value={selectedTipoDocumento}
              onChange={(opt) => {setField("tipodoc", opt?.label ?? ""); setField("Tipo_x0020_de_x0020_documento_x0", opt?.value ?? "");}}
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

          {/* Abreviación tipo documento (solo lectura con la abreviación seleccionada) */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Abreviación tipo de documento *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.Tipo_x0020_de_x0020_documento_x0 ?? ""} readOnly disabled={isView}/>
          </div>

          {/* Número documento */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Número de identificación *</label>
            <input id="numeroIdent" name="Numero_x0020_identificaci_x00f3_" type="number" placeholder="Ingrese el número de documento" value={state.Numero_x0020_identificaci_x00f3_ ?? ""} onChange={(e) => setField("Numero_x0020_identificaci_x00f3_", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.Numero_x0020_identificaci_x00f3_}</small>
          </div>

          {/* Nombre seleccionado */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="nombreSeleccionado"> Nombre del seleccionado *</label>
            <input id="nombreSeleccionado" name="NombreSeleccionado" type="text" disabled={isView} placeholder="Ingrese el nombre del seleccionado" value={state.NombreSeleccionado ?? ""} onChange={(e) => setField("NombreSeleccionado", e.target.value)} autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.NombreSeleccionado}</small>
          </div>

          {/* Correo */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
            <input id="correo" name="CORREO_x0020_ELECTRONICO_x0020_" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.CORREO_x0020_ELECTRONICO_x0020_ ?? ""} onChange={(e) => setField("CORREO_x0020_ELECTRONICO_x0020_", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.CORREO_x0020_ELECTRONICO_x0020_}</small>
          </div>

          {/* Fecha requerida para el ingreso */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="fechaIngreso">Fecha requerida para el ingreso *</label>
            <input id="fechaIngreso" name="FECHA_x0020_REQUERIDA_x0020_PARA0" type="date" value={toISODateFlex(state.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? ""} onChange={(e) => setField("FECHA_x0020_REQUERIDA_x0020_PARA0", e.target.value)}
              autoComplete="off" required aria-required="true" disabled={isView}/>
            <small>{errors.FECHA_x0020_REQUERIDA_x0020_PARA0}</small>
          </div>

          {/* ================= Cargo ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="cargo">Cargo * </label>
            <Select<desplegablesOption, false>
              inputId="cargo"
              options={cargoOptions}
              placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
              value={selectedCargo}
              onChange={(opt) => {setField("CARGO", opt?.label ?? "");}}
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
              value={ selectedMunicipio ? { value: selectedMunicipio, label: selectedMunicipio } : state.CIUDAD ? { value: state.CIUDAD, label: state.CIUDAD } : null}
              onChange={(opt) => {
                const value = opt?.value ?? "";
                setSelectedMunicipio(value);
                setField("CIUDAD", value);          
              }}
              classNamePrefix="rs"
              isDisabled={!selectedDepto  || loadingDepto || isView}
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
              onChange={(opt) => {setField("MODALIDAD_x0020_TELETRABAJO", opt?.label ?? "");}}
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
            <input id="SALARIO" name="SALARIO" type="text" placeholder="Ingrese el salario del seleccionado" value={displaySalario} autoComplete="off" required aria-required="true" maxLength={300}
            disabled={isView}  onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setDisplaySalario("");
                  setField("SALARIO", "" as any);
                  setField("salariotexto", "");
                  return;
                }

                const numeric = toNumberFromEsCO(raw); // 1500000
                const formatted = formatPesosEsCO(String(numeric)); // 1.500.000

                setDisplaySalario(formatted);
                setField("SALARIO", numeric as any);
                setField("salariotexto", numeroATexto(numeric));
              }}
            />
            <small>{errors.SALARIO}</small>
          </div>

          {/* Salario en letras */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="salariotexto">Salario en letras *</label>
            <input id="salariotexto" name="salariotexto" type="text" placeholder="Salario en letras"  value={state.salariotexto ?? ""}  readOnly/>
          </div>

          {/* ¿Se hace ajuste de salario? */}
          <div className="ft-field">
            <label className="ft-label">¿Se hace ajuste de salario? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="ajuste" value="Si" checked={state.Ajustesalario === true} onChange={() => setField("Ajustesalario", true)}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="ajuste" value="No" checked={state.Ajustesalario === false} onChange={() => setField("Ajustesalario", false)}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.Ajustesalario && (
            <div className="ft-field">
              <label className="ft-label" htmlFor="SALARIO_x0020_AJUSTADO">Porcentaje de ajuste *</label>
              <input id="SALARIO_x0020_AJUSTADO" name="SALARIO_x0020_AJUSTADO" type="text" placeholder="Porcentaje de ajuste" value={state.SALARIO_x0020_AJUSTADO ?? ""}
                onChange={(e) => setField("SALARIO_x0020_AJUSTADO", toNumberFromEsCO(e.target.value) as any)} autoComplete="off" required aria-required="true" maxLength={3} disabled={isView}/>
              <small>{errors.SALARIO_x0020_AJUSTADO}</small>
              
            </div>
          )}

          {/* ¿Lleva garantizado? */}
          <div className="ft-field">
            <label className="ft-label">¿Lleva garantizado? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="garantizado" value="Si" checked={state.GARANTIZADO_x0020__x0020__x00bf_ === "Si"} onChange={() => setField("GARANTIZADO_x0020__x0020__x00bf_", "Si")}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="garantizado" value="No" checked={state.GARANTIZADO_x0020__x0020__x00bf_ === "No"} onChange={() => setField("GARANTIZADO_x0020__x0020__x00bf_", "No")}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.GARANTIZADO_x0020__x0020__x00bf_?.toLocaleLowerCase() === "si" && (
            <div className="ft-field">
              <label className="ft-label" htmlFor="porcentajeValor">Porcentaje del garantizado *</label>
              <input id="porcentajeValor" name="porcentajeValor" type="text" placeholder="Porcentaje del garantizado" value={porcentajeValor} 
                  onChange={(e) => setPorcentajeValor(Number(e.target.value))} autoComplete="off" required aria-required="true" maxLength={3}/>
              <small>{errors.VALOR_x0020_GARANTIZADO}</small>

              <input id="VALOR_x0020_GARANTIZADO" name="VALOR_x0020_GARANTIZADO" type="text" placeholder="Total Garantizado" value={garantizadoValor}  autoComplete="off" required aria-required="true" maxLength={3}/>
              
            </div>
          )}

          {/* ¿Tiene auxilio de rodamiento? */}
          <div className="ft-field">
            <label className="ft-label">¿Tiene auxilio de rodamiento? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="rodamiento" value="Si" checked={!!state.Auxilioderodamientosiono} onChange={() => setField("Auxilioderodamientosiono", true)}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="rodamiento" value="No" checked={!state.Auxilioderodamientosiono} onChange={() => setField("Auxilioderodamientosiono", false)}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.Auxilioderodamientosiono && (
            <>
              <div className="ft-field">
                <label className="ft-label" htmlFor="Auxilio_x0020_de_x0020_rodamient">Auxilio de rodamiento *</label>
                <input id="Auxilio_x0020_de_x0020_rodamient" name="Auxilio_x0020_de_x0020_rodamient" type="text" placeholder="Ingrese el auxilio de rodamiento del seleccionado" value={displayAuxilio} autoComplete="off"
                 disabled={isView} required aria-required="true" maxLength={300} onChange={(e) => {
                                                                      const raw = e.target.value;
                                                                      if (raw === "") {
                                                                          setDisplayAuxilio("");
                                                                          setField("Auxilio_x0020_de_x0020_rodamient", "" as any);
                                                                          return;
                                                                      }
                                                                      const numeric = toNumberFromEsCO(raw);
                                                                      const formatted = formatPesosEsCO(String(numeric));
                                                                      setDisplayAuxilio(formatted);
                                                                      setField("Auxilio_x0020_de_x0020_rodamient", numeric as any);
                                                                      setField("Auxilio_x0020_de_x0020_rodamient0", numeroATexto(numeric));
                                                                      }}
                                                                  />
              <small>{errors.Auxilio_x0020_de_x0020_rodamient}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="Auxilio_x0020_de_x0020_rodamient0" > Auxilio de rodamiento en letras * </label>
                <input disabled={isView} id="Auxilio_x0020_de_x0020_rodamient0" name="Auxilio_x0020_de_x0020_rodamient0" type="text" placeholder="Auxilio de rodamiento en letras" value={state.Auxilio_x0020_de_x0020_rodamient0 ?? ""} readOnly/>
              </div>
            </>
          )}

          {/* ¿Tiene fecha de finalizacion? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Tiene fecha de finalización? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="finalizacion" value="Si" checked={!!fechaFinalizacion} onChange={() => setFechaFinalizacion(true)}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="finalizacion" value="No" checked={!fechaFinalizacion} onChange={() => setFechaFinalizacion(false)}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>
          

          {fechaFinalizacion && (
            <>
              <div className="ft-field">
                <label className="ft-label" htmlFor="FECHA_x0020_REQUERIDA_x0020_PARA">Fecha de finalización *</label>
                <input id="FECHA_x0020_REQUERIDA_x0020_PARA" name="FECHA_x0020_REQUERIDA_x0020_PARA" type="date" value={toISODateFlex(state.FECHA_x0020_REQUERIDA_x0020_PARA) ?? ""} autoComplete="off"
                 disabled={isView} required aria-required="true" maxLength={300} onChange={(e) => {setField("FECHA_x0020_REQUERIDA_x0020_PARA", e.target.value)}}/>
              </div>
            </>
          )}

          <h3 className="full-fila">INFORMACIÓN ADICIONAL</h3>

          {/* Número documento */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Celular *</label>
            <input id="numeroIdent" name="CELULAR_x0020_" type="text" placeholder="Ingrese el número de celular" value={state.CELULAR_x0020_ ?? ""} onChange={(e) => setField("CELULAR_x0020_", e.target.value)}
             disabled={isView} autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.CELULAR_x0020_}</small>
          </div>

          {/* Dirección de domicilio */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="DIRECCION_x0020_DE_x0020_DOMICIL">Dirección de domicilio *</label>
            <input id="DIRECCION_x0020_DE_x0020_DOMICIL" name="DIRECCION_x0020_DE_x0020_DOMICIL" type="text" placeholder="Ingrese la dirección" value={state.DIRECCION_x0020_DE_x0020_DOMICIL ?? ""} onChange={(e) => setField("DIRECCION_x0020_DE_x0020_DOMICIL", e.target.value)}
              disabled={isView} autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.DIRECCION_x0020_DE_x0020_DOMICIL}</small>
          </div>

          {/* Barrio */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="BARRIO_x0020_">Barrio *</label>
            <input id="BARRIO_x0020_" name="BARRIO_x0020_" type="text" placeholder="Ingrese el barrio" value={state.BARRIO_x0020_ ?? ""} onChange={(e) => setField("BARRIO_x0020_", e.target.value)}
             disabled={isView} autoComplete="off" required aria-required="true" maxLength={300}/>
              <small>{errors.BARRIO_x0020_}</small>
          </div>

          {/* ================= Especificidad de cargo ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Especificidad de cargo *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={especificidadOptions}
              placeholder={loadingEspecificdad ? "Cargando opciones…" : "Buscar especificidad del cargo..."}
              value={selectedEspecificidad}
              onChange={(opt) => {setField("ESPECIFICIDAD_x0020_DEL_x0020_CA", opt?.label ?? "");}}
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

          {/* ================= Nivel de cargo ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Nivel de cargo *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={nivelCargoOptions}
              placeholder={loadinNivelCargo ? "Cargando opciones…" : "Buscar nivel de cargo..."}
              value={selectedNivelCargo}
              onChange={(opt) => {setField("NIVEL_x0020_DE_x0020_CARGO", opt?.value ?? "");}}
              classNamePrefix="rs"
              isDisabled={loadinNivelCargo || isView}
              isLoading={loadinNivelCargo}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
            />
            <small>{errors.ESPECIFICIDAD_x0020_DEL_x0020_CA}</small>
          </div>

          {/* ¿Cargo critico? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Cargo critico? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="critico" value="Si" checked={state.CARGO_x0020_CRITICO === "Si"} onChange={() => setField("CARGO_x0020_CRITICO", "Si")}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="critico" value="No" checked={state.CARGO_x0020_CRITICO === "No"} onChange={() => setField("CARGO_x0020_CRITICO", "No")}/>
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
              onChange={(opt) => {setField("DEPENDENCIA_x0020_", opt?.value ?? "");}}
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

          {/* ================= Centro de costos ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Centro de costos *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={CentroCostosOptions}
              placeholder={loadingCC ? "Cargando opciones…" : "Buscar centro de costos..."}
              value={selectedCentroCostos}
              onChange={(opt) => {setField("DESCRIPCION_x0020_DE_x0020_CENTR", opt?.label ?? ""); setField("CODIGO_x0020_CENTRO_x0020_DE_x00", opt?.value ?? "")}}
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
          
          {/* Codigo CC */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de costos *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.CODIGO_x0020_CENTRO_x0020_DE_x00} readOnly/>
          </div>

          {/* ================= Centro Operativo ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion Centro Operativo *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={COOptions}
              placeholder={loadingCO ? "Cargando opciones…" : "Buscar centro operativo..."}
              value={selectedCentroOperativo}
              onChange={(opt) => {setField("DESCRIPCION_x0020_CENTRO_x0020_O", opt?.label ?? ""); setField("CENTRO_x0020_OPERATIVO_x0020_", opt?.value ?? "")}}
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
          
          {/* Codigo CO */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.CENTRO_x0020_OPERATIVO_x0020_} readOnly/>
          </div>

          {/* ================= Unidad de negocio ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Descripcion unidad de negocio *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={UNOptions}
              placeholder={loadingUN ? "Cargando opciones…" : "Buscar centro de costos..."}
              value={selectedUnidadNegocio}
              onChange={(opt) => {setField("UNIDAD_x0020_DE_x0020_NEGOCIO_x0", opt?.label ?? ""); setField("ID_x0020_UNIDAD_x0020_DE_x0020_N", opt?.value ?? "")}}
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
          
          {/* Codigo UN */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Codigo centro de operativo *</label>
            <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo CO" value={state.ID_x0020_UNIDAD_x0020_DE_x0020_N} readOnly/>
          </div>

          {/* ¿Personas a cargo? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Personas a cargo? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="personas" value="Si" checked={state.PERSONAS_x0020_A_x0020_CARGO === "Si"} onChange={() => setField("PERSONAS_x0020_A_x0020_CARGO", "Si")}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="personas" value="No" checked={state.PERSONAS_x0020_A_x0020_CARGO === "No"} onChange={() => setField("PERSONAS_x0020_A_x0020_CARGO", "No")}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {/* Temporal */}
          <div className="ft-field">
            <label className="ft-label"> Temporal *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="temporal" value="Si" checked={state.TEMPORAL === "Si"} onChange={() => setField("TEMPORAL", "Si")}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="temporal" value="No" checked={state.TEMPORAL === "No"} onChange={() => setField("TEMPORAL", "No")}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {/* ================= Origen Seleccion ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Origen de la selección *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={origenOptions}
              placeholder={loadingOrigen ? "Cargando opciones…" : "Buscar centro de costos..."}
              value={selectedOrigenSeleccion}
              onChange={(opt) => {setField("ORIGEN_x0020_DE_x0020_LA_x0020_S", opt?.label ?? ""); setField("ORIGEN_x0020_DE_x0020_LA_x0020_S", opt?.value ?? "")}}
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

          {/* ================= Tipo de contrato ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Tipo de contrato *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={tipoContratoOptions}
              placeholder={loadingTipoContrato ? "Cargando opciones…" : "Buscar centro de costos..."}
              value={selectedTipoContrato}
              onChange={(opt) => {setField("TIPO_x0020_DE_x0020_CONTRATO", opt?.label ?? "");}}
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

          {/* ================= Tipo de vacante ================= */ }
          <div className="ft-field">
            <label className="ft-label" htmlFor="modalidadTrabajo">Tipo de vacante *</label>
            <Select<desplegablesOption, false>
              inputId="modalidadTrabajo"
              options={tipoVacanteOptions}
              placeholder={loadingTipoVacante ? "Cargando opciones…" : "Buscar tipo de vacante..."}
              value={selectedTipoVacante}
              onChange={(opt) => {setField("TIPO_x0020_DE_x0020_VACANTE_x002", opt?.label ?? "");}}
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
                setField("HERRAMIENTAS_x0020_QUE_x0020_POS", values.join("; "));
              }}
              placeholder="Selecciona herramientas..."
              isDisabled={isView}
            />
          </div>

          {/* Fecha de ajuste academico */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="fechaIngreso">Fecha de ajuste academico</label>
            <input id="fechaIngreso" name="FECHA_x0020_REQUERIDA_x0020_PARA0" type="date" value={toISODateFlex(state.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? ""} onChange={(e) => setField("FECHA_x0020_DE_x0020_AJUSTE_x002", e.target.value)}
             disabled={isView} autoComplete="off" required aria-required="true"/>
          </div>

          {/* Fecha de entrega valoracion de potencial */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="fechaIngreso">Fecha de entrega de la valoración de potencial</label>
            <input id="fechaIngreso" name="FECHA_x0020_DE_x0020_ENTREGA_x00" type="date" value={toISODateFlex(state.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? ""} onChange={(e) => setField("FECHA_x0020_DE_x0020_ENTREGA_x00", e.target.value)}
             disabled={isView} autoComplete="off" required aria-required="true"/>
          </div>

          {/* ¿Pertenece al modelo? */}
          <div className="ft-field">
            <label className="ft-label"> ¿Pertenece al modelo? *</label>
            <div className="ft-radio-group">
              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="modelo" value="Si" checked={!!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", true)}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="modelo" value="No" checked={!state.Pertenecealmodelo} onChange={() => setField("Pertenecealmodelo", false)}/>
                <span className="circle"></span>
                <span className="text">No</span>
              </label>
            </div>
          </div>

          {state.Pertenecealmodelo && (
            <>
              <div className="ft-field">
                <label className="ft-label" htmlFor="Autonomia">Autonomía *</label>
                <select disabled={isView} name="Autonomia" onChange={(e) => setField("AUTONOM_x00cd_A_x0020_", e.target.value)}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.AUTONOM_x00cd_A_x0020_}</small>
              </div>
            
              <div className="ft-field">
                <label className="ft-label" htmlFor="presupuesto">Presupuesto ventas/magnitud económica *</label>
                <select disabled={isView} name="presupuesto" onChange={(e) => setField("PRESUPUESTO_x0020_VENTAS_x002f_M", e.target.value)}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.PRESUPUESTO_x0020_VENTAS_x002f_M}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="impacto">Impacto cliente externo *</label>
                <select disabled={isView} name="impacto" onChange={(e) => setField("IMPACTO_x0020_CLIENTE_x0020_EXTE", e.target.value)}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.IMPACTO_x0020_CLIENTE_x0020_EXTE}</small>
              </div>

              <div className="ft-field">
                <label className="ft-label" htmlFor="contribucion">Contribución a la estrategia *</label>
                <select disabled={isView} name="contribucion" onChange={(e) => setField("CONTRIBUCION_x0020_A_x0020_LA_x0", e.target.value)}>
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <small>{errors.CONTRIBUCION_x0020_A_x0020_LA_x0}</small>
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
                <input disabled={isView} type="radio" name="nuevoequipo" value="Si" checked={state.SE_x0020_DEBE_x0020_HACER_x0020_ === "Si"} onChange={() => setField("SE_x0020_DEBE_x0020_HACER_x0020_", "Si")}/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input disabled={isView} type="radio" name="nuevoequipo" value="No" checked={state.SE_x0020_DEBE_x0020_HACER_x0020_ === "No"} onChange={() => setField("SE_x0020_DEBE_x0020_HACER_x0020_", "No")}/>
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
                <input type="radio" name="auxilioRodamiento" disabled={isView} value="Si" checked={planFinanciado} onChange={() => 
                                                                                                  {
                                                                                                    setPlanfinanciado(true); 
                                                                                                    setField("auxconectividadvalor", String(conectividad));
                                                                                                    setField("auxconectividadtexto", conectividadTexto)
                                                                                                  }
                                                                                                }/>
                <span className="circle"></span>
                <span className="text">Si</span>
              </label>

              <label className="ft-radio-custom">
                <input type="radio" disabled={isView} name="auxilioRodamiento" value="No" checked={!planFinanciado} onChange={() => {
                                                                                                                    setPlanfinanciado(false)
                                                                                                                    setField("auxconectividadvalor", String(conectividad));
                                                                                                                    setField("auxconectividadtexto", conectividadTexto)}}
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
        {/* Acciones */}
        <div className="ft-actions">
          {!isView ? <button type="submit" className="btn btn-primary btn-xs" onClick={(e) => {handleEdit(e, selectedNovedad);}}>Guardar Registro</button> : <small>Este registro ya ha sido usado, no puede ser editado</small>}
          <button type="submit" className="btn btn-xs" onClick={() => onClose()}>Cancelar</button>
        </div>
      </section>
    </div>
  );
};
