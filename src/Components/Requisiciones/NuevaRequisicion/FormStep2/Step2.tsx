import * as React from "react";
import type { desplegablesOption } from "../../../../models/Desplegables";
import { formatPesosEsCO } from "../../../../utils/Number";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import Select, { components, type OptionProps } from "react-select";
import { notify } from '../../../../utils/notify';

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
  state: requisiciones;
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
  tipoConvocatoria: "Administrativa" | "Retail";
  tipoConvocatoriaOptions: desplegablesOption[];
  selectedTipoConvocatoria: desplegablesOption | null;
  generoOptions: desplegablesOption[];
  selectedGenero: desplegablesOption | null;
  motivoOptions: desplegablesOption[];
  selectedMotivo: desplegablesOption | null;
  centroOperativoOptions: desplegablesOption[];
  selectedCentroOperativo: desplegablesOption | null;
  centroCostosOptions: desplegablesOption[];
  selectedCentroCostos: desplegablesOption | null;
  unidadNegocioOptions: desplegablesOption[];
  selectedUnidadNegocio: desplegablesOption | null;
  direccionOptions: desplegablesOption[];
  selectedDireccion: desplegablesOption | null;
  cveOptions: desplegablesOption[];
  selectedCve: desplegablesOption | null;
  modalidadOptions: desplegablesOption[];
  selectedModalidad: desplegablesOption | null;
};

export default function Step2Form({
  modalidadOptions,
  selectedModalidad,
  cveOptions,
  selectedCve,
  direccionOptions,
  selectedDireccion,
  unidadNegocioOptions,
  selectedUnidadNegocio,
  centroCostosOptions,
  selectedCentroCostos,
  centroOperativoOptions,
  selectedCentroOperativo,
  tipoConvocatoria,
  motivoOptions,
  selectedMotivo,
  state,
  setField,
  tipoConvocatoriaOptions,
  selectedTipoConvocatoria,
  generoOptions,
  selectedGenero,
}: Props) {
  const [displaySalario, setDisplaySalario] = React.useState("");

  React.useEffect(() => {
    if (state.salarioBasico) {
      setDisplaySalario(formatPesosEsCO(state.salarioBasico));
      return;
    }

    setDisplaySalario("");
  }, [state.salarioBasico]);

  return (
    <div className="rqw-stage-stack">
      <section className="rqw-stage">
        <div className="rqw-stage__intro">
          <span className="rqw-stage__eyebrow">Paso 2</span>
          <h3 className="rqw-stage__title">Configuracion de la solicitud</h3>
          <p className="rqw-stage__copy">
            Completa la compensacion, los datos organizacionales y la informacion complementaria para crear la vacante.
          </p>
        </div>

        <div className="rqw-summary-band">
          <div className="rqw-summary-band__item">
            <span>Tipo</span>
            <strong>{state.tipoRequisicion || "Pendiente"}</strong>
          </div>
          <div className="rqw-summary-band__item">
            <span>Cargo</span>
            <strong>{state.Title || "Sin definir"}</strong>
          </div>
          <div className="rqw-summary-band__item">
            <span>Ciudad</span>
            <strong>{state.Ciudad || "Sin definir"}</strong>
          </div>
        </div>
      </section>

      <section className="rqw-stage">
        <div className="rqw-block-head">
          <div>
            <span className="rqw-block-head__kicker">Compensacion</span>
            <h4 className="rqw-block-head__title">Datos principales</h4>
          </div>
        </div>

        <div className="rqw-fields-grid">
          <div className="ft-field rqw-field-card">
            <label className="ft-label">Salario *</label>
            <input type="text" value={displaySalario} onChange={(e) => { setField("salarioBasico", e.target.value); }} />
          </div>

          <div className="ft-field rqw-field-card">
            <label className="ft-label">Tipo de convocatoria *</label>
            <Select<desplegablesOption, false>
              inputId="tipoConvocatoria"
              options={tipoConvocatoriaOptions}
              value={selectedTipoConvocatoria}
              onChange={(option) => setField("tipoConvocatoria", option?.label ?? "")}
              classNamePrefix="rs"
              components={{ Option }}
              placeholder="Selecciona el tipo"
              {...selectMenuProps}
            />
          </div>

          <div className="ft-field rqw-field-card">
            <label className="ft-label">Genero *</label>
            <Select<desplegablesOption, false>
              inputId="genero"
              options={generoOptions}
              value={selectedGenero}
              onChange={(option) => setField("genero", option?.label ?? "")}
              classNamePrefix="rs"
              components={{ Option }}
              placeholder="Selecciona el genero"
              {...selectMenuProps}
            />
          </div>

          <div className="ft-field rqw-field-card">
            <label className="ft-label">Motivo *</label>
            <Select<desplegablesOption, false>
              inputId="motivo"
              options={motivoOptions}
              value={selectedMotivo}
              onChange={(option) => setField("motivo", option?.label ?? "")}
              classNamePrefix="rs"
              components={{ Option }}
              placeholder="Selecciona el motivo"
              {...selectMenuProps}
            />
          </div>

          <div className="ft-field rqw-field-card">
            <label className="ft-label">Gerencia *</label>
            <Select<desplegablesOption, false>
              inputId="gerencia"
              options={direccionOptions}
              value={selectedDireccion}
              onChange={(option) => setField("direccion", option?.label ?? "")}
              classNamePrefix="rs"
              components={{ Option }}
              placeholder="Selecciona la gerencia"
              {...selectMenuProps}
            />
          </div>
        </div>
      </section>

      <section className="rqw-stage">
        <div className="rqw-block-head">
          <div>
            <span className="rqw-block-head__kicker">Operacion</span>
            <h4 className="rqw-block-head__title">Ubicacion y estructura</h4>
          </div>
        </div>

        <div className="rqw-fields-grid">
          {state.tipoRequisicion === "Retail" ? (
            <>
              <div className="ft-field rqw-field-card">
                <label className="ft-label">Tienda *</label>
                <Select<desplegablesOption, false>
                  inputId="centroOperativo"
                  options={centroOperativoOptions}
                  value={selectedCentroOperativo}
                  onChange={(option) => {
                    setField("codigoCentroOperativo", option?.value ?? "");
                    setField("tienda", option?.label ?? "");
                  }}
                  classNamePrefix="rs"
                  components={{ Option }}
                  placeholder="Selecciona la tienda"
                  {...selectMenuProps}
                />
              </div>

              <div className="ft-field rqw-field-card">
                <label className="ft-label">Codigo centro operativo</label>
                <input type="text" readOnly value={state.codigoCentroOperativo} placeholder="Se completa automaticamente" />
              </div>
            </>
          ) : null}

          <div className="ft-field rqw-field-card">
            <label className="ft-label">{tipoConvocatoria === "Administrativa" ? "Area *" : "Marca *"}</label>
            <Select<desplegablesOption, false>
              inputId="centroCostos"
              options={centroCostosOptions}
              value={selectedCentroCostos}
              onChange={(option) => {
                setField("codigoCentroCosto", option?.value ?? "");
                setField("descripcionCentroCosto", option?.label ?? "");
              }}
              classNamePrefix="rs"
              components={{ Option }}
              placeholder="Selecciona el centro de costos"
              {...selectMenuProps}
            />
          </div>

          <div className="ft-field rqw-field-card">
            <label className="ft-label">Codigo centro de costos</label>
            <input type="text" readOnly value={state.codigoCentroCosto} placeholder="Se completa automaticamente" />
          </div>

          <div className="ft-field rqw-field-card">
            <label className="ft-label">Unidad de negocio *</label>
            <Select<desplegablesOption, false>
              inputId="unidadNegocio"
              options={unidadNegocioOptions}
              value={selectedUnidadNegocio}
              onChange={(option) => {
                setField("codigoUnidadNegocio", option?.value ?? "");
                setField("descripcionUnidadNegocio", option?.label ?? "");
              }}
              classNamePrefix="rs"
              components={{ Option }}
              placeholder="Selecciona la unidad de negocio"
              {...selectMenuProps}
            />
          </div>
        </div>
      </section>

      {state.tipoRequisicion === "Administrativa" ? (
        <section className="rqw-stage">
          <div className="rqw-block-head">
            <div>
              <span className="rqw-block-head__kicker">Complementario</span>
              <h4 className="rqw-block-head__title">Configuracion administrativa</h4>
            </div>
          </div>

          <div className="rqw-fields-grid">


            <div className="ft-field rqw-field-card">
              <label className="ft-label">Pertenece al CVE?</label>
              <select
                id="perteneceCVE"
                value={state.perteneceCVE}
                onChange={(option) => {
                  setField("perteneceCVE", option.target.value ?? "");
                  if (option.target.value !== "Si") setField("grupoCVE", "");
                }}
              >
                <option value="Si">Si</option>
                <option value="No">No</option>
              </select>
            </div>

            {state.perteneceCVE === "Si" ? (
              <div className="ft-field rqw-field-card">
                <label className="ft-label">Grupo CVE</label>
                <Select<desplegablesOption, false>
                  inputId="grupoCVE"
                  options={cveOptions}
                  value={selectedCve}
                  onChange={(option) => setField("grupoCVE", option?.label ?? "")}
                  classNamePrefix="rs"
                  components={{ Option }}
                  placeholder="Selecciona el grupo"
                  {...selectMenuProps}
                />
              </div>
            ) : null}

            <div className="ft-field rqw-field-card">
              <label className="ft-label">Tiene auxilio de rodamiento?</label>
              <select
                id="auxilioRodamiento"
                value={state.auxilioRodamiento}
                onChange={(option) => {
                  setField("auxilioRodamiento", option.target.value ?? "");
                }}
              >
                <option value="Si">Si</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="ft-field rqw-field-card">
              <label className="ft-label">Tipo de teletrabajo *</label>
              <Select<desplegablesOption, false>
                inputId="modalidadTeletrabajo"
                options={modalidadOptions}
                value={selectedModalidad}
                onChange={(option) => {setField("modalidadTeletrabajo", option?.label ?? ""); notify.auto(option?.label)}}
                classNamePrefix="rs"
                components={{ Option }}
                placeholder="Selecciona la modalidad"
                {...selectMenuProps}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}


