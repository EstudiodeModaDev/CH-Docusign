import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../../models/Desplegables";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";

const selectMenuProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed" as const,
};

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
  selectedCargo: desplegablesOption | null;
  onChangeCargo: (s: string) => void;
  cargosOptions: desplegablesOption[];
  selectedCiudad: desplegablesOption | null;
  ciudadesAllOptions: desplegablesOption[];
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
  state: requisiciones;
};

export default function FirstStepForm({
  ciudadesAllOptions,
  cargosOptions,
  selectedCargo,
  onChangeCargo,
  selectedCiudad,
  setField,
  state,
}: Props) {
  const readyForNext = Boolean(state.Title && state.Ciudad);

  return (
    <section className="rqw-stage">
      <div className="rqw-stage__intro">
        <span className="rqw-stage__eyebrow">Paso 1</span>
        <h3 className="rqw-stage__title">Base de la vacante</h3>
        <p className="rqw-stage__copy">
          Selecciona el cargo y la ciudad para definir el tipo de requisicion, el nivel y el flujo inicial.
        </p>
      </div>

      <div className="rqw-callout">
        <div className="rqw-callout__status">
          <span className={`rqw-dot ${readyForNext ? "is-ready" : ""}`} />
          <strong>{readyForNext ? "Listo para continuar" : "Faltan datos base"}</strong>
        </div>
        <p className="rqw-callout__copy">
          El sistema completa automaticamente algunos valores cuando eliges el cargo correcto.
        </p>
      </div>

      <div className="rqw-fields-grid rqw-fields-grid--step1">
        <div className="ft-field rqw-field-card">
          <label className="ft-label">Cargo *</label>
          <Select<desplegablesOption, false>
            inputId="cargo"
            options={cargosOptions}
            value={selectedCargo}
            onChange={(option) => onChangeCargo(option?.label ?? "")}
            classNamePrefix="rs"
            components={{ Option }}
            placeholder="Selecciona el cargo"
            {...selectMenuProps}
          />
          <small className="rqw-field-note">Este campo define ANS, responsable y tipo de requisicion.</small>
        </div>

        <div className="ft-field rqw-field-card">
          <label className="ft-label">Ciudad *</label>
          <Select<desplegablesOption, false>
            inputId="ciudad"
            options={ciudadesAllOptions}
            value={selectedCiudad}
            onChange={(option) => setField("Ciudad", option?.label ?? "")}
            classNamePrefix="rs"
            components={{ Option }}
            placeholder="Selecciona la ciudad"
            {...selectMenuProps}
          />
          <small className="rqw-field-note">La ciudad ayuda a definir la operacion y la asignacion.</small>
        </div>

        <div className="ft-field rqw-field-card">
          <label className="ft-label">Tipo de requisicion</label>
          <input type="text" readOnly value={state.tipoRequisicion || "Pendiente"} />
          <small className="rqw-field-note">Se calcula automaticamente con base en el cargo.</small>
        </div>

        <div className="ft-field rqw-field-card">
          <label className="ft-label">Nivel de cargo</label>
          <input type="text" readOnly value={state.NivelCargo || "Pendiente"} />
          <small className="rqw-field-note">Se completa cuando el cargo tiene configuracion asociada.</small>
        </div>
      </div>
    </section>
  );
}
