import * as React from "react";
import Select, { components, type OptionProps, type SingleValue } from "react-select";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import "./tablaRequisiciones.css";

type Props = {
  open?: boolean;
  row?: requisiciones | null;
  onClose?: () => void;
  selectOptions?: Record<string, desplegablesOption[]>;
  onSave?: (draft: Partial<requisiciones>) => Promise<void>;
};

type SelectFieldKey =
  | "nuevoPromocionOptions"
  | "cargoOptions"
  | "ciudadOptions"
  | "direccionOptions"
  | "unidadNegocioOptions"
  | "centroCostosOptions"
  | "centroOperativoOptions"
  | "motivoOptions"
  | "modalidadOptions"
  | "perteneceCveOptions"
  | "grupoCveOptions";

type FieldBase = {
  key: keyof requisiciones;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
};

type InputField = FieldBase & {
  type?: "text" | "date" | "number";
};

type TextareaField = FieldBase & {
  type: "textarea";
  rows?: number;
};

type SelectField = FieldBase & {
  type: "select";
  options?: string[];
  optionsKey?: SelectFieldKey;
  mapOptionToFields?: (option: desplegablesOption | null) => Partial<requisiciones>;
};

type EditField = InputField | TextareaField | SelectField;

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

const EDIT_SECTIONS: Array<{ title: string; description: string; fields: EditField[] }> = [
  {
    title: "Resumen de requisicion",
    description: "Campos base para identificar la vacante y su estado operativo.",
    fields: [
      { key: "Identificador", label: "Identificador", placeholder: "RQ-0000", disabled: true },
      {
        key: "nuevoPromocion",
        label: "Nuevo o promocion",
        type: "select",
        optionsKey: "nuevoPromocionOptions",
        options: ["Nuevo", "Promocion"],
      },
      {
        key: "Title",
        label: "Cargo",
        type: "select",
        optionsKey: "cargoOptions",
        placeholder: "Selecciona el cargo",
      },
      {
        key: "NivelCargo",
        label: "Nivel de cargo",
        placeholder: "Se completa automaticamente",
        disabled: true,
      },
      {
        key: "motivo",
        label: "Motivo",
        type: "select",
        optionsKey: "motivoOptions",
        placeholder: "Selecciona el motivo",
      },
    ],
  },
  {
    title: "Responsables y fechas",
    description: "Asignacion principal y tiempos clave del proceso.",
    fields: [
      { key: "solicitante", label: "Solicitante", placeholder: "Nombre del solicitante", disabled: true },
      { key: "nombreProfesional", label: "Profesional asignado", placeholder: "Nombre del analista", disabled: true },
      { key: "fechaInicioProceso", label: "Fecha inicio proceso", type: "date", disabled: true },
      { key: "fechaLimite", label: "Fecha limite", type: "date", disabled: true },
    ],
  },
  {
    title: "Ubicacion y estructura",
    description: "Informacion organizacional y geografica asociada a la requisicion.",
    fields: [
      { key: "Ciudad", label: "Ciudad", type: "select", optionsKey: "ciudadOptions", placeholder: "Selecciona la ciudad" },
      { key: "direccion", label: "Direccion", type: "select", optionsKey: "direccionOptions", placeholder: "Selecciona la direccion" },
      { key: "codigoUnidadNegocio", label: "Codigo unidad negocio", placeholder: "UN-000", disabled: true },
      {
        key: "descripcionUnidadNegocio",
        label: "Unidad de negocio",
        type: "select",
        optionsKey: "unidadNegocioOptions",
        placeholder: "Selecciona la unidad",
        mapOptionToFields: (option) => ({
          descripcionUnidadNegocio: option?.label ?? "",
          codigoUnidadNegocio: option?.value ?? "",
        }),
      },
      { key: "codigoCentroCosto", label: "Codigo centro costo", placeholder: "CC-000", disabled: true },
      {
        key: "descripcionCentroCosto",
        label: "Centro costo",
        type: "select",
        optionsKey: "centroCostosOptions",
        placeholder: "Selecciona el centro de costo",
        mapOptionToFields: (option) => ({
          descripcionCentroCosto: option?.label ?? "",
          codigoCentroCosto: option?.value ?? "",
        }),
      },
      { key: "codigoCentroOperativo", label: "Codigo centro operativo", placeholder: "CO-000", disabled: true },
      {
        key: "tienda",
        label: "Centro operativo",
        type: "select",
        optionsKey: "centroOperativoOptions",
        placeholder: "Selecciona el centro operativo",
        mapOptionToFields: (option) => ({
          tienda: option?.label ?? "",
          codigoCentroOperativo: option?.value ?? "",
        }),
      },
    ],
  },
  {
    title: "Condiciones de vinculacion",
    description: "Compensacion, modalidad y consideraciones administrativas.",
    fields: [
      { key: "salarioBasico", label: "Salario basico", placeholder: "$0" },
      { key: "comisiones", label: "Comisiones", placeholder: "$0" },
      { key: "auxilioRodamiento", label: "Auxilio rodamiento", placeholder: "$0" },
      {
        key: "modalidadTeletrabajo",
        label: "Modalidad teletrabajo",
        type: "select",
        optionsKey: "modalidadOptions",
        options: ["Presencial", "Hibrido", "Remoto"],
      },
      { key: "empresaContratista", label: "Empresa contratista", placeholder: "Nombre de empresa" },
      {
        key: "perteneceCVE",
        label: "Pertenece CVE",
        type: "select",
        optionsKey: "perteneceCveOptions",
        options: ["Si", "No"],
      },
      {
        key: "grupoCVE",
        label: "Grupo CVE",
        type: "select",
        optionsKey: "grupoCveOptions",
        placeholder: "Selecciona el grupo CVE",
      },
    ],
  },
];

export default function RequisicionEditModal({ open = true, row = null, onClose, selectOptions, onSave }: Props) {
  const [draft, setDraft] = React.useState<Partial<requisiciones>>(row ?? {});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraft(row ?? {});
  }, [row]);

  if (!open) return null;

  const title = getDraftValue(draft, "Title") || "Edicion de requisicion";
  const identifier = getDraftValue(draft, "Identificador") || getDraftValue(draft, "Id") || "Sin ID";
  const estado = getDraftValue(draft, "Estado") || "Borrador visual";

  const applyPatch = (patch: Partial<requisiciones>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(draft);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rq-edit-backdrop" role="presentation" onClick={handleClose}>
      <div
        className="rq-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rq-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rq-edit-header">
          <div className="rq-edit-header__copy">
            <span className="rq-detail-kicker">Edicion de requisicion</span>
            <h2 id="rq-edit-title" className="rq-detail-title">
              {title}
            </h2>
            <p className="rq-detail-copy">
              #{identifier} - {getDraftValue(draft, "tipoRequisicion") || "Sin tipo"} - {getDraftValue(draft, "Ciudad") || "Sin ciudad"}
            </p>
          </div>

          <div className="rq-edit-header__meta">
            <span className="rq-detail-id">{estado}</span>
            <div className="rq-edit-header__actions">
              <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" onClick={handleClose} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary btn-xs rq-detail-btn rq-edit-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </header>

        <div className="rq-edit-body">
          <section className="rq-edit-summary">
            <article className="rq-edit-highlight">
              <span className="rq-detail-label">Observacion</span>
              <strong className="rq-detail-value">Componente visual listo para integracion.</strong>
              <p className="rq-edit-note">Los cambios se mantienen localmente en el modal y solo se persisten cuando haces clic en guardar.</p>
            </article>
          </section>

          {EDIT_SECTIONS.map((section) => (
            <section key={section.title} className="rq-edit-section">
              <div className="rq-process-card__header">
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              </div>

              <div className="rq-edit-grid">
                {section.fields.map((field) => (
                  <label
                    key={`${section.title}-${String(field.key)}`}
                    className={`rq-edit-field ${field.fullWidth || field.type === "textarea" ? "rq-edit-field--full" : ""} ${field.disabled ? "is-readonly" : ""}`}
                  >
                    <span className="rq-report-label">{field.label}</span>
                    {renderField(field, draft, selectOptions, applyPatch)}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="rq-edit-footer">
          <p className="rq-edit-footer__copy">Revisa los cambios antes de confirmar. Cancelar cerrara el modal sin persistir el borrador actual.</p>
          <div className="rq-edit-footer__actions">
            <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" onClick={handleClose} disabled={saving}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary btn-xs rq-detail-btn rq-edit-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function renderField(
  field: EditField,
  draft: Partial<requisiciones>,
  selectOptions: Record<string, desplegablesOption[]> | undefined,
  applyPatch: (patch: Partial<requisiciones>) => void,
) {
  const value = getDraftValue(draft, field.key);

  if (field.type === "textarea") {
    return (
      <textarea
        className="rq-edit-textarea"
        rows={field.rows ?? 4}
        value={value}
        placeholder={field.placeholder}
        disabled={Boolean(field.disabled)}
        onChange={(event) => applyPatch({ [field.key]: event.target.value } as Partial<requisiciones>)}
      />
    );
  }

  if (field.type === "select") {
    const options = getSelectOptions(field, selectOptions);
    const selectedOption = options.find((option) => option.label === value || option.value === value) ?? null;

    return (
      <Select<desplegablesOption, false>
        inputId={`rq-edit-${String(field.key)}`}
        options={options}
        value={selectedOption}
        classNamePrefix="rs"
        className="rq-edit-rs"
        components={{ Option }}
        placeholder={field.placeholder || "Selecciona una opcion"}
        isClearable={!field.disabled}
        isSearchable={!field.disabled}
        isDisabled={Boolean(field.disabled)}
        onChange={(option) => {
          const patch = resolveSelectPatch(field, option);
          applyPatch(patch);
        }}
        {...selectMenuProps}
      />
    );
  }

  return (
    <input
      className="rq-edit-input"
      type={field.type ?? "text"}
      value={value}
      placeholder={field.placeholder}
      disabled={Boolean(field.disabled)}
      onChange={(event) => applyPatch({ [field.key]: event.target.value } as Partial<requisiciones>)}
    />
  );
}

function getDraftValue(draft: Partial<requisiciones>, key: keyof requisiciones | "Id"): string {
  const value = draft[key as keyof requisiciones];
  return value === null || value === undefined ? "" : String(value);
}

function getSelectOptions(field: SelectField, selectOptions?: Record<string, desplegablesOption[]>): desplegablesOption[] {
  if (field.optionsKey && selectOptions?.[field.optionsKey]?.length) {
    return selectOptions[field.optionsKey];
  }

  return (field.options ?? []).map((option) => ({
    value: option,
    label: option,
  }));
}

function resolveSelectPatch(field: SelectField, option: SingleValue<desplegablesOption>): Partial<requisiciones> {
  if (field.mapOptionToFields) {
    return field.mapOptionToFields(option ?? null);
  }

  return {
    [field.key]: option?.label ?? "",
  } as Partial<requisiciones>;
}
