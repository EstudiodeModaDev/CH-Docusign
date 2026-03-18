import "../NuevaRequisicion/NuevaRequisicion.css"
import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../models/Desplegables";
import { formatPesosEsCO, toNumberFromEsCO } from "../../../utils/Number";
import type { requisiciones, RequisicionesErrors } from "../../../models/requisiciones";
import { useWorkers } from "../../../Funcionalidades/PazSalvos/Workers";
import { toISODateFlex, } from "../../../utils/Date";
import React from "react";
import { PostergarModal } from "./postergarModal";
import { useMoverANS } from "../../../Funcionalidades/Requisiciones/moverANS";
import { useGraphServices } from "../../../graph/graphContext";
import { NovedadesModal } from "../logRequisiciones/logRequisiciones";
import { Talent360Setup } from "../talent365/talent360";

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
  state: requisiciones;
  errors: RequisicionesErrors;

  direccionOptions: desplegablesOption[];
  loadingDireccion: boolean;

  COOptions: desplegablesOption[];
  loadingCO: boolean;

  empresaOptions: desplegablesOption[];
  loadingEmpresas: boolean;

  cargoOptions: desplegablesOption[];
  loadingCargo: boolean;

  ciudadOptions: desplegablesOption[];
  loadingCiudad: boolean;

  CentroCostosOptions: desplegablesOption[];
  loadingCC: boolean;

  UNOptions: desplegablesOption[];
  loadingUN: boolean;

  generoOptions: desplegablesOption[];
  loadingGenero: boolean;

  motivoOptions: desplegablesOption[];
  loadingMotivo: boolean;

  nivelesOption: desplegablesOption[];
  loadingNiveles: boolean;

  tipoConvocatoriaOptions: desplegablesOption[];
  loadingTipoConvocatoria: boolean;

  cve: boolean;
  cveOptions: desplegablesOption[];
  loadingCVE: boolean;

  displaySalario: string;
  setDisplaySalario: (v: string) => void;

  displayComisiones: string;
  setDisplayComisiones: (v: string) => void;
  
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
  onClose: () => void
  onEdit: (r: requisiciones) => Promise<void>
  onCancel: (r: requisiciones) => Promise<boolean>
  
  selectedCiudad: desplegablesOption | null
  selectedCargo: desplegablesOption | null
  selectedDireccion: desplegablesOption | null
  selectedCentroCostos: desplegablesOption | null
  selectedCentroOperativo: desplegablesOption | null
  selectedUnidadNegocio: desplegablesOption | null
  selectedGenero: desplegablesOption | null
  selectedMotivo: desplegablesOption | null
  selectedCVE: desplegablesOption | null
  selectedTipoConvocatoria: desplegablesOption | null
  selectedEmpresa: desplegablesOption | null
};

export function EditRequisiciones({onCancel, nivelesOption, loadingNiveles, selectedCiudad, selectedCargo, selectedDireccion, selectedCentroCostos, selectedUnidadNegocio, selectedEmpresa, selectedGenero, selectedMotivo, selectedTipoConvocatoria, selectedCVE, selectedCentroOperativo,  onEdit, onClose, empresaOptions, loadingEmpresas, ciudadOptions, loadingCiudad, cargoOptions, loadingCargo, state, errors, direccionOptions, loadingDireccion, COOptions, loadingCO, CentroCostosOptions, loadingCC, UNOptions, loadingUN, generoOptions, loadingGenero, motivoOptions, loadingMotivo, tipoConvocatoriaOptions, loadingTipoConvocatoria, cve, cveOptions, loadingCVE, displaySalario, setDisplaySalario, displayComisiones, setDisplayComisiones, setField,}: Props) {
    const { workersOptions, loadingWorkers, } = useWorkers({ onlyEnabled: true });
    const {moverANS} = useGraphServices()
    const {rows,} = useMoverANS(moverANS, state);
    const selectedAnalista = workersOptions.find((o) => String(o.value ?? "").trim().toLowerCase() === String(state?.correoProfesional ?? "").trim().toLowerCase()) ?? null;
    const canEdit = state.Estado === "Activo"
    const [postergar, setPostergar] = React.useState<boolean>(false)
    const [log, setLog] = React.useState<boolean>(false)
    const [cancel, setCancel] = React.useState<boolean>(false)
    const [evaluación, setEvaluacion] = React.useState<boolean>(false)

    async function edit(r: requisiciones): Promise<void> {
        await onEdit(r)
        onClose()
    }

    async function onSubmit(r: requisiciones) {
        if(cancel){
            if(!state.motivoNoCumplimiento){
                alert("Debe indicar el motivo de cancelación")
                return
            } 
            await onCancel(r)
            onClose()
            return
        }

        await edit(r)
        onClose()
    }


    if(evaluación){
        return <Talent360Setup colaborador={state.cedulaEmpleadoVinculado ?? ""} perfilesOption={nivelesOption} loadingPerfiles={loadingNiveles} open={evaluación} onClose={() => setEvaluacion(false)}/>
    }

    return (
        <div className="ft-modal-backdrop" role="dialog" aria-modal="true">
            <section className="ft-scope ft-card">
                <header className="ft-head">
                    <div className="ft-head__left">
                        <button type="button" className="btn btn-xs btn-transparent-final" disabled={!canEdit} onClick={() => setPostergar(true)}>
                            Postergar fecha de ingreso
                        </button>

                        <button type="button" className="ft-action btn-danger btn-xs" disabled={!canEdit} onClick={() => setCancel((prev) => !prev)}>
                            {cancel ? "No cancelar" :  "Cancelar requisición"}
                        </button>
                    </div>

                    <button type="button" className="ft-close" onClick={onClose} aria-label="Cerrar">
                        ✕
                    </button>
                </header>


                <form className="ft-form">
                    <div className="ft-field">
                        <label className="ft-label">ID</label>
                        <input type="text" value={state.Id} readOnly />
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Analista</label>
                        <Select<desplegablesOption, false>
                        inputId="analista"
                        options={workersOptions}
                        placeholder={loadingWorkers ? "Cargando opciones…" : "Buscar analista..."}
                        value={selectedAnalista}
                        onChange={(opt) => {setField("correoProfesional", opt?.label ?? ""); setField("nombreProfesional", opt?.label ?? "")}}
                        classNamePrefix="rs"
                        isDisabled={loadingWorkers || !canEdit || cancel}
                        isLoading={loadingWorkers}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.nombreProfesional}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Cargo</label>
                        <Select<desplegablesOption, false>
                        inputId="cargo"
                        options={cargoOptions}
                        placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
                        value={selectedCargo}
                        onChange={(opt) => setField("Title", opt?.label ?? "")}
                        classNamePrefix="rs"
                        isDisabled={loadingCargo || !canEdit || cancel}
                        isLoading={loadingCargo}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.Title}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Ciudad</label>
                        <Select<desplegablesOption, false>
                        inputId="ciudad"
                        options={ciudadOptions}
                        placeholder={loadingCiudad ? "Cargando opciones…" : "Buscar cargo..."}
                        value={selectedCiudad}
                        onChange={(opt) => setField("Ciudad", opt?.label ?? "")}
                        classNamePrefix="rs"
                        isDisabled={loadingCiudad || !canEdit || cancel}
                        isLoading={loadingCiudad}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.Ciudad}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Dirección</label>
                        <Select<desplegablesOption, false>
                        inputId="direccion"
                        options={direccionOptions}
                        placeholder={loadingDireccion ? "Cargando opciones…" : "Buscar dirección..."}
                        value={selectedDireccion}
                        onChange={(opt) => setField("direccion", opt?.label ?? "")}
                        classNamePrefix="rs"
                        isDisabled={loadingDireccion || !canEdit || cancel}
                        isLoading={loadingDireccion}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.direccion}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Área</label>
                        <input type="text" placeholder="Ej: Capital Humano" value={state.Area} disabled={!canEdit || cancel} onChange={(e) => setField("Area", e.target.value.toUpperCase())}/>
                        {errors.Area && <small>{errors.Area}</small>}
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Centro Operativo</label>
                        <Select<desplegablesOption, false>
                        inputId="centroOperativo"
                        options={COOptions}
                        placeholder={loadingCO ? "Cargando opciones…" : "Buscar centro operativo..."}
                        value={selectedCentroOperativo}
                        onChange={(opt) => {
                            setField("codigoCentroOperativo", opt?.value?.toString().toUpperCase() ?? "");
                            setField("descripcionCentroOperativo", opt?.label?.toString().toUpperCase() ?? "");
                        }}
                        classNamePrefix="rs"
                        isDisabled={loadingCO || !canEdit || cancel}
                        isLoading={loadingCO}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.codigoCentroOperativo}</small>
                        <small>{errors.descripcionCentroOperativo}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Código centro operativo</label>
                        <input type="text" value={state.codigoCentroOperativo} readOnly />
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Centro de costos</label>
                        <Select<desplegablesOption, false>
                        inputId="centroCostos"
                        options={CentroCostosOptions}
                        placeholder={loadingCC ? "Cargando opciones…" : "Buscar centro de costos..."}
                        value={selectedCentroCostos}
                        onChange={(opt) => {
                            setField("codigoCentroCosto", opt?.value?.toString().toUpperCase() ?? "");
                            setField("descripcionCentroCosto", opt?.label?.toString().toUpperCase() ?? "");
                        }}
                        classNamePrefix="rs"
                        isDisabled={loadingCC || !canEdit || cancel}
                        isLoading={loadingCC}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.codigoCentroCosto}</small>
                        <small>{errors.descripcionCentroCosto}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Código centro de costos</label>
                        <input type="text" value={state.codigoCentroCosto} readOnly />
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Unidad de negocio</label>
                        <Select<desplegablesOption, false>
                        inputId="unidadNegocio"
                        options={UNOptions}
                        placeholder={loadingUN ? "Cargando opciones…" : "Buscar unidad de negocio..."}
                        value={selectedUnidadNegocio}
                        onChange={(opt) => {
                            setField("codigoUnidadNegocio", opt?.value?.toString().toUpperCase() ?? "");
                            setField("descripcionUnidadNegocio", opt?.label?.toString().toUpperCase() ?? "");
                        }}
                        classNamePrefix="rs"
                        isDisabled={loadingUN || !canEdit || cancel}
                        isLoading={loadingUN}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.codigoUnidadNegocio}</small>
                        <small>{errors.descripcionUnidadNegocio}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Código unidad de negocio</label>
                        <input type="text" value={state.codigoUnidadNegocio} readOnly />
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Género</label>
                        <Select<desplegablesOption, false>
                        inputId="genero"
                        options={generoOptions}
                        placeholder={loadingGenero ? "Cargando opciones…" : "Buscar género..."}
                        value={selectedGenero}
                        onChange={(opt) => setField("genero", opt?.label?.toString().toUpperCase() ?? "")}
                        classNamePrefix="rs"
                        isDisabled={loadingGenero || !canEdit || cancel}
                        isLoading={loadingGenero}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.genero}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Motivo de la solicitud</label>
                        <Select<desplegablesOption, false>
                        inputId="motivo"
                        options={motivoOptions}
                        placeholder={loadingMotivo ? "Cargando opciones…" : "Buscar motivo..."}
                        value={selectedMotivo}
                        onChange={(opt) => setField("motivo", opt?.label?.toString().toUpperCase() ?? "")}
                        classNamePrefix="rs"
                        isDisabled={loadingMotivo || !canEdit || cancel}
                        isLoading={loadingMotivo}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.motivo}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">{selectedMotivo?.value ?? "Razón"}</label>
                        <input type="text" value={state.razon} disabled={!canEdit || cancel} onChange={(e) => setField("razon", e.target.value.toUpperCase())} />
                        <small>{errors.razon}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Tipo de convocatoria</label>
                        <Select<desplegablesOption, false>
                        inputId="tipoConvocatoria"
                        options={tipoConvocatoriaOptions}
                        placeholder={loadingTipoConvocatoria ? "Cargando opciones…" : "Buscar tipo de convocatoria..."}
                        value={selectedTipoConvocatoria}
                        onChange={(opt) => setField("tipoConvocatoria", opt?.label?.toString().toUpperCase() ?? "")}
                        classNamePrefix="rs"
                        isDisabled={loadingTipoConvocatoria || !canEdit || cancel}
                        isLoading={loadingTipoConvocatoria}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.tipoConvocatoria}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Salario básico</label>
                        <input type="text" placeholder="Ingrese el salario básico" value={displaySalario} disabled={!canEdit || cancel} onChange={(e) => {
                                                                                                                                            const raw = e.target.value;
                                                                                                                                            if (raw === "") {
                                                                                                                                            setDisplaySalario("");
                                                                                                                                            setField("salarioBasico", "" as any);
                                                                                                                                            return;
                                                                                                                                            }
                                                                                                                                            const numeric = toNumberFromEsCO(raw);
                                                                                                                                            const formatted = formatPesosEsCO(String(numeric));
                                                                                                                                            setDisplaySalario(formatted);
                                                                                                                                            setField("salarioBasico", String(numeric) as any);
                                                                                                                                        }}/>
                        <small>{errors.salarioBasico}</small>
                    </div>

                    {state.tipoRequisicion === "Retail" ? (
                        <div className="ft-field">
                        <label className="ft-label">Comisiones</label>
                        <input type="text" placeholder="Ingrese las comisiones" disabled={!canEdit || cancel} value={displayComisiones} onChange={(e) => {
                                                                                                                                    const raw = e.target.value;
                                                                                                                                    if (raw === "") {
                                                                                                                                        setDisplayComisiones("");
                                                                                                                                        setField("comisiones", "" as any);
                                                                                                                                        return;
                                                                                                                                    }
                                                                                                                                    const numeric = toNumberFromEsCO(raw);
                                                                                                                                    const formatted = formatPesosEsCO(String(numeric));
                                                                                                                                    setDisplayComisiones(formatted);
                                                                                                                                    setField("comisiones", String(numeric) as any);
                                                                                                                                    }}
                                                                                                                                />
                        <small>{errors.comisiones}</small>
                        </div>
                    ) : null}

                    <div className="ft-field">
                        <label className="ft-label">Observaciones salario</label>
                        <input type="text" disabled={!canEdit || cancel} placeholder="Notas / condiciones…" value={state.observacionesSalario} onChange={(e) => setField("observacionesSalario", e.target.value)}/>
                    </div>

                    {cve ? (
                        <div className="ft-field">
                        <label className="ft-label">Grupo CVE</label>
                        <Select<desplegablesOption, false>
                            inputId="grupoCVE"
                            options={cveOptions}
                            placeholder={loadingCVE ? "Cargando opciones…" : "Buscar grupo CVE..."}
                            value={selectedCVE}
                            onChange={(opt) => setField("grupoCVE", opt?.label?.toString().toUpperCase() ?? "")}
                            classNamePrefix="rs"
                            isDisabled={loadingCVE || !canEdit || cancel}
                            isLoading={loadingCVE}
                            getOptionValue={(o) => String(o.value)}
                            getOptionLabel={(o) => o.label}
                            components={{ Option }}
                            isClearable
                        />
                        </div>
                    ) : null}

                    <div className="ft-field">
                        <label className="ft-label">Fecha inicio de proceso</label>
                        <input type="date" disabled={!canEdit || cancel} value={toISODateFlex(state.fechaInicioProceso) ?? ""} readOnly />
                        {errors.fechaInicioProceso && <small>{errors.fechaInicioProceso}</small>}
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Mail solicitante</label>
                        <input type="text" value={state.correoSolicitante ?? ""} readOnly />
                        {errors.correoSolicitante && <small>{errors.correoSolicitante}</small>}
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Fecha limite de ingreso</label>
                        <input type="date" value={toISODateFlex(state.fechaLimite) ?? ""} readOnly />
                        {errors.fechaLimite && <small>{errors.fechaLimite}</small>}
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Nombre del empleado vinculado</label>
                        <input type="text" value={state.nombreEmpleadoVinculado} disabled={!canEdit || cancel} onChange={(e) => {setField("nombreEmpleadoVinculado", e.target.value)}} />
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Cedula del empleado vinculado</label>
                        <input type="text" disabled={!canEdit || cancel} value={state.cedulaEmpleadoVinculado} onChange={(e) => {setField("cedulaEmpleadoVinculado", e.target.value)}} />
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Empresa contratista</label>
                        <Select<desplegablesOption, false>
                        inputId="empresa"
                        options={empresaOptions}
                        placeholder={loadingEmpresas ? "Cargando opciones…" : "Buscar analista..."}
                        value={selectedEmpresa}
                        onChange={(opt) => {setField("empresaContratista", opt?.label ?? "");}}
                        classNamePrefix="rs"
                        isDisabled={loadingEmpresas || !canEdit || cancel}
                        isLoading={loadingEmpresas}
                        getOptionValue={(o) => String(o.value)}
                        getOptionLabel={(o) => o.label}
                        components={{ Option }}
                        isClearable
                        />
                        <small>{errors.nombreProfesional}</small>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">ANS</label>
                        <input type="text" value={state.ANS} readOnly/>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Estado</label>
                        <input type="text" value={state.Estado} readOnly/>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Cumple ANS</label>
                        <input type="text" value={state.cumpleANS} readOnly/>
                    </div>

                    <div className="ft-field">
                        <label className="ft-label">Fecha de ingreso</label>
                        <input type="date" value={toISODateFlex(state.fechaIngreso) ?? ""} onChange={(e) => setField("fechaIngreso", e.target.value)} disabled={!canEdit || cancel} />
                        {errors.fechaLimite && <small>{errors.fechaLimite}</small>}
                    </div>

                    {(cancel || state.Estado==="Cerrado") ? (
                        <div className="ft-field">
                            <label className="ft-label">Motivo de la cancelación *</label>
                            <textarea value={state.motivoNoCumplimiento} onChange={(e) => setField("motivoNoCumplimiento", e.target.value)}/>
                        </div>
                    ) : null}

                    <div className="ft-field ft-field--full">
                        <label className="ft-label ft-label--big">¿El empleado es nuevo o es una promoción?</label>

                        <div className="ft-radio-check-row">
                            <div className="ft-radio-stack" role="radiogroup" aria-label="Tipo de requisición">
                                <label className="ft-radio-custom">
                                    <input disabled={cancel || !canEdit} type="radio" name="nuevoPromocion" value="nuevo" checked={state.nuevoPromocion === "nuevo"} onChange={() => setField("nuevoPromocion", "nuevo")}/>
                                    <span className="circle" />
                                    <span className="text">Retail</span>
                                </label>

                                <label className="ft-radio-custom">
                                    <input disabled={cancel || !canEdit}  type="radio" name="nuevoPromocion" value="promocion" checked={state.nuevoPromocion === "promocion"} onChange={() => setField("nuevoPromocion", "promocion")}/>
                                    <span className="circle" />
                                    <span className="text">Administrativa</span>
                                </label>

                                {errors.nuevoPromocion && <small>{errors.nuevoPromocion}</small>}
                            </div>
                        </div>
                    </div>
                </form>
                <footer className="ft-foot full-fila">
                    <div className="ft-foot__left">
                        <button type="button" className="btn btn-xs" onClick={() => {setEvaluacion(true)}}>
                            Crear evaluación de valoración de potencial
                        </button>

                        <button type="submit" className="btn btn-primary btn-xs" disabled={!canEdit} onClick={() => onSubmit(state)}>
                            Guardar
                        </button>
                    </div>
                    
                    {rows.length > 0 ?
                    <button type="button" className="ft-foot__hint" onClick={() => setLog(true)}>
                        {`Esta requisición tiene ${rows.length} novedades. Click aquí para verlas`}
                    </button> : null}
                </footer>
                
                <PostergarModal open={postergar} onClose={() => setPostergar(false)} onSubmit={(r: requisiciones) => onSubmit(r)} setField={setField} requisicion={state}/>
                <NovedadesModal open={log} rows={rows} onClose={() => setLog(false)}/>
            </section>
        </div>
    );
}
