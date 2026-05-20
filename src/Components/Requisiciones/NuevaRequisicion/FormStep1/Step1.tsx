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
  state: requisiciones
};

export default function FirstStepForm({ciudadesAllOptions, cargosOptions, selectedCargo, onChangeCargo, selectedCiudad, setField, state}: Props) {
  return (
    <section className="rqw-section rqw-section--hero">
      <div className="rqw-section__head">
        <div>
          <span className="rqw-section__eyebrow">Paso 1</span>
          <h3 className="rqw-section__title">Informacion base de la vacante</h3>
          <p className="rqw-section__copy">Define el contexto principal de la requisicion. El tipo se asigna automaticamente con base en el cargo.</p>
        </div>
      </div>

      <div className="rqw-grid rqw-grid--intro">
        <div className="ft-field rqw-panel-field">
          <label className="ft-label">Tipo de requisicion *</label>
          <input type="text" readOnly value={state.tipoRequisicion} />
          <small className="rqw-field-hint">Este valor se calcula automaticamente segun el cargo seleccionado.</small>
        </div>

        <div className="ft-field rqw-panel-field">
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
          <small className="rqw-field-hint">Escoge el cargo exacto para asignar ANS, flujo y responsable.</small>
        </div>

        <div className="ft-field rqw-panel-field">
          <label className="ft-label">Nivel de cargo *</label>
          <input type="text" readOnly value={state.NivelCargo} />
          <small className="rqw-field-hint">Este valor se calcula automaticamente segun el cargo seleccionado.</small>
        </div>

        <div className="ft-field rqw-panel-field">
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
          <small className="rqw-field-hint">La ciudad ayuda a determinar la asignacion y reglas operativas.</small>
        </div>
      </div>
    </section>
  );
}
