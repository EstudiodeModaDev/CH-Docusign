import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { requisiciones } from "../../../models/requisiciones";

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
  errors: any;

  cargoOptions: desplegablesOption[];
  loadingCargo: boolean;
  selectedCargo: desplegablesOption | null
  selectedCiudad: desplegablesOption | null
  municipioSelectOptions: desplegablesOption[];
  loadingDepto: boolean;

  cve: boolean;
  setCVE: (v: boolean) => void;

  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
};

export function Step1({state, errors, cargoOptions, selectedCargo, selectedCiudad, loadingCargo, municipioSelectOptions, loadingDepto, cve, setCVE, setField,}: Props) {

    return (
    <>
        <h3 className="full-fila">Paso 1 — Cargo y Ciudad</h3>

        <div className="ft-field">
            <label className="ft-label">Cargo</label>
            <Select<desplegablesOption, false>
            inputId="cargo"
            options={cargoOptions}
            placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
            value={selectedCargo}
            onChange={(opt) => setField("Title", opt?.label ?? "")}
            classNamePrefix="rs"
            isDisabled={loadingCargo}
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
            options={municipioSelectOptions}
            placeholder={loadingDepto ? "Cargando opciones…" : "Buscar ciudad..."}
            value={selectedCiudad}
            onChange={(opt) => setField("Ciudad", opt?.label ?? "")}
            classNamePrefix="rs"
            isDisabled={loadingDepto}
            isLoading={loadingDepto}
            getOptionValue={(o) => String(o.value)}
            getOptionLabel={(o) => o.label}
            components={{ Option }}
            isClearable
            />
            <small>{errors.Ciudad}</small>
        </div>

        <div className="ft-field ft-field--full">
            <label className="ft-label ft-label--big">¿Esta requisición es administrativa o retail?</label>

            <div className="ft-radio-check-row">
                <div className="ft-radio-stack" role="radiogroup" aria-label="Tipo de requisición">
                    <label className="ft-radio-custom">
                        <input type="radio" name="tipoRequisicion" value="Retail" checked={state.tipoRequisicion === "Retail"} onChange={() => setField("tipoRequisicion", "Retail")}/>
                        <span className="circle" />
                        <span className="text">Retail</span>
                    </label>

                    <label className="ft-radio-custom">
                        <input type="radio" name="tipoRequisicion" value="Administrativa" checked={state.tipoRequisicion === "Administrativa"} onChange={() => setField("tipoRequisicion", "Administrativa")}/>
                        <span className="circle" />
                        <span className="text">Administrativa</span>
                    </label>

                    {errors.tipoRequisicion && <small>{errors.tipoRequisicion}</small>}
                </div>

                <div className="ft-check-side">
                    <label className="ft-check-custom" style={{ position: "relative" }}>
                        <input type="checkbox" checked={cve} onChange={(e) => setCVE(e.target.checked)} />
                        <span className="box" />
                        <span className="text">¿Pertence al modelo CVE?</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="ft-field ft-field--full">
            <label className="ft-label">Mail solicitante</label>
            <input type="email" value={state.correoSolicitante} readOnly />
            {errors.correoSolicitante && <small>{errors.correoSolicitante}</small>}
        </div>
    </>
  );
}
