import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../models/Desplegables";
import { formatPesosEsCO, toNumberFromEsCO } from "../../../utils/Number";

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
  state: any;
  errors: any;

  direccionOptions: desplegablesOption[];
  loadingDireccion: boolean;
  selectedDireccion: desplegablesOption | null;

  COOptions: desplegablesOption[];
  loadingCO: boolean;
  selectedCentroOperativo: desplegablesOption | null;

  CentroCostosOptions: desplegablesOption[];
  loadingCC: boolean;
  selectedCentroCostos: desplegablesOption | null;

  UNOptions: desplegablesOption[];
  loadingUN: boolean;
  selectedUnidadNegocio: desplegablesOption | null;

  generoOptions: desplegablesOption[];
  loadingGenero: boolean;
  selectedGenero: desplegablesOption | null;

  motivoOptions: desplegablesOption[];
  loadingMotivo: boolean;
  selectedMotivo: desplegablesOption | null;

  tipoConvocatoriaOptions: desplegablesOption[];
  loadingTipoConvocatoria: boolean;
  selectedTipoConvocatoria: desplegablesOption | null;

  cve: boolean;
  cveOptions: desplegablesOption[];
  loadingCVE: boolean;
  selectedCVE: desplegablesOption | null;

  displaySalario: string;
  setDisplaySalario: (v: string) => void;

  displayComisiones: string;
  setDisplayComisiones: (v: string) => void;

  setField: <K extends string>(k: K, v: any) => void;
};

export function Step2({state, errors, direccionOptions, loadingDireccion, selectedDireccion, COOptions, loadingCO, selectedCentroOperativo, CentroCostosOptions, loadingCC, selectedCentroCostos, UNOptions, loadingUN, selectedUnidadNegocio, generoOptions, loadingGenero, selectedGenero, motivoOptions, loadingMotivo, selectedMotivo, tipoConvocatoriaOptions, loadingTipoConvocatoria, selectedTipoConvocatoria, cve, cveOptions, loadingCVE, selectedCVE, displaySalario, setDisplaySalario, displayComisiones, setDisplayComisiones, setField,}: Props) {
    return (
        <>
            <h3 className="full-fila">Paso 2 — Detalles de la requisición</h3>

            <div className="ft-field">
                <label className="ft-label">Cargo</label>
                <input type="text" value={state.Title} readOnly />
            </div>

            <div className="ft-field">
                <label className="ft-label">Ciudad</label>
                <input type="text" value={state.Ciudad} readOnly />
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
                isDisabled={loadingDireccion}
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
                <input type="text" placeholder="Ej: Capital Humano" value={state.Area} onChange={(e) => setField("Area", e.target.value.toUpperCase())}/>
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
                isDisabled={loadingCO}
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
                isDisabled={loadingCC}
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
                isDisabled={loadingUN}
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
                isDisabled={loadingGenero}
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
                isDisabled={loadingMotivo}
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
                <input type="text" value={state.razon} onChange={(e) => setField("razon", e.target.value.toUpperCase())} />
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
                isDisabled={loadingTipoConvocatoria}
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
                <input
                type="text"
                placeholder="Ingrese el salario básico"
                value={displaySalario}
                onChange={(e) => {
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
                }}
                />
                <small>{errors.salarioBasico}</small>
            </div>

            {state.tipoRequisicion === "Retail" ? (
                <div className="ft-field">
                <label className="ft-label">Comisiones</label>
                <input
                    type="text"
                    placeholder="Ingrese las comisiones"
                    value={displayComisiones}
                    onChange={(e) => {
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
                <input type="text" placeholder="Notas / condiciones…" value={state.observacionesSalario} onChange={(e) => setField("observacionesSalario", e.target.value)}/>
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
                    isDisabled={loadingCVE}
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
                <input type="date" value={state.fechaInicioProceso ?? ""} readOnly />
                {errors.fechaInicioProceso && <small>{errors.fechaInicioProceso}</small>}
            </div>
        </>
    );
}
