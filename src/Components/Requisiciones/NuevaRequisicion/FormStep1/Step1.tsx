import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../../models/Desplegables";
import type { requisiciones } from "../../../../models/requisiciones";


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
  tipoRequisicion: string
  
  selectedCargo: desplegablesOption | null
  onChangeCargo: (s: string) => void

  cargosOptions: desplegablesOption[]
  selectedCiudad: desplegablesOption | null
  ciudadesAllOptions: desplegablesOption[]
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void
};

export default function FirstStepForm({ciudadesAllOptions, cargosOptions, tipoRequisicion, selectedCargo, onChangeCargo, selectedCiudad, setField}: Props) {
  return (
    <>
      <div className="ft-field">
        <label className="ft-label">Tipo de requisición *</label>
        <input type="text" readOnly value={tipoRequisicion}/>
      </div>

      {/*Cargos*/}
      <div className="ft-field">
        <label className="ft-label">Cargo *</label>
        <Select<desplegablesOption, false>
          inputId="cargo"
          options={cargosOptions}
          value={selectedCargo}
          onChange={(option) => onChangeCargo(option?.label ?? "")}
          classNamePrefix="rs"
          components={{ Option }}
          placeholder="Selecciona el cargo"
        />
      </div>

      <div className="ft-field">
        <label className="ft-label">Ciudad *</label>
        <Select<desplegablesOption, false>
          inputId="ciudad"
          options={ciudadesAllOptions}
          value={selectedCiudad}
          onChange={(option) => setField("Ciudad", option?.label ?? "")}
          classNamePrefix="rs"
          components={{ Option }}
          placeholder="Selecciona la ciudad"
        />
      </div>
    </>
  );
}
