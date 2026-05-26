import * as React from "react";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import { spDateToDDMMYYYY } from "../../../utils/Date";
import "./tablaRequisiciones.css";

type Props = {
  open: boolean;
  row: requisiciones | null;
  onClose: () => void;
};

type DetailField = {
  key: keyof requisiciones | "Id";
  label: string;
  kind?: "date" | "number";
};

const DETAIL_SECTIONS: Array<{ title: string; fields: DetailField[] }> = [
  {
    title: "Resumen",
    fields: [
      { key: "Identificador", label: "Identificador" },
      { key: "Estado", label: "Estado" },
      { key: "tipoRequisicion", label: "Tipo de requisicion" },
      { key: "nuevoPromocion", label: "Nuevo o promocion" },
      { key: "Title", label: "Cargo" },
      { key: "NivelCargo", label: "Nivel de cargo" },
      { key: "motivo", label: "Motivo" },
      { key: "tipoConvocatoria", label: "Tipo de convocatoria" },
      { key: "genero", label: "Genero" },
    ],
  },
  {
    title: "Responsables y tiempos",
    fields: [
      { key: "solicitante", label: "Solicitante" },
      { key: "nombreProfesional", label: "Profesional asignado" },
      { key: "fechaInicioProceso", label: "Fecha inicio proceso", kind: "date" },
      { key: "fechaLimite", label: "Fecha limite", kind: "date" },
      { key: "fechaIngreso", label: "Fecha ingreso", kind: "date" },
      { key: "diasHabiles", label: "Dias habiles", kind: "number" },
      { key: "ANS", label: "ANS" },
      { key: "cumpleANS", label: "Cumple ANS" },
      { key: "motivoNoCumplimiento", label: "Motivo no cumplimiento" },
    ],
  },
  {
    title: "Ubicacion y estructura",
    fields: [
      { key: "Ciudad", label: "Ciudad" },
      { key: "direccion", label: "Direccion" },
      { key: "codigoUnidadNegocio", label: "Codigo unidad negocio" },
      { key: "descripcionUnidadNegocio", label: "Unidad de negocio" },
      { key: "codigoCentroCosto", label: "Codigo centro costo" },
      { key: "descripcionCentroCosto", label: "Centro costo" },
      { key: "codigoCentroOperativo", label: "Codigo centro operativo" },
      { key: "tienda", label: "Centro Operativo" },
    ],
  },
  {
    title: "Condiciones de vinculacion",
    fields: [
      { key: "salarioBasico", label: "Salario basico" },
      { key: "comisiones", label: "Comisiones" },
      { key: "auxilioRodamiento", label: "Auxilio rodamiento" },
      { key: "modalidadTeletrabajo", label: "Modalidad teletrabajo" },
      { key: "empresaContratista", label: "Empresa contratista" },
      { key: "perteneceCVE", label: "Pertenece CVE" },
      { key: "grupoCVE", label: "Grupo CVE" },
    ],
  },
];

export default function RequisicionDetalleModal({ open, row, onClose }: Props) {

  //Cerrar con escape o click fuera
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !row) return null;

  const tone = getToneByEstado(row.Estado);

  return (
    <div className="rq-detail-backdrop" role="presentation" onClick={onClose}>
      <div
        className="rq-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rq-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rq-detail-header">
          <h2 id="rq-detail-title" className="rq-detail-title">
            {row.Title || "Detalle de requisicion"}
          </h2>

          <div className="rq-detail-header__meta">
            <span className="rq-detail-id">#{row.Identificador || "Sin ID"}</span>
            <span className={`rb-status rb-status--${tone}`}>{row.Estado || "Sin estado"}</span>
            <button type="button" className="btn btn-secondary-final btn-xs" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <div className="rq-detail-body">
          {DETAIL_SECTIONS.map((section) => (
            <section key={section.title} className="rq-detail-section">
              <div className="rq-detail-section__header">
                <h3>{section.title}</h3>
              </div>

              <div className="rq-detail-grid">
                {section.fields.map((field) => (
                  <article key={field.key} className="rq-detail-card">
                    <span className="rq-detail-label">{field.label}</span>
                    <strong className="rq-detail-value">{formatValue(row, field)}</strong>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatValue(row: requisiciones, field: DetailField): string {
  if (field.key === "Id") {
    return row.Id ? String(row.Id) : "Sin dato";
  }

  const value = row[field.key]

  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  if (field.kind === "date") {
    return spDateToDDMMYYYY(value as string);
  }

  return String(value);
}

function getToneByEstado(estado: string): "active" | "closed" | "cancel" | "neutral" {
  const normalized = String(estado ?? "").trim().toLowerCase();

  if (normalized.includes("cancel")) return "cancel";
  if (normalized.includes("cerr")) return "closed";
  if (normalized.includes("activo") || normalized.includes("abiert")) return "active";
  return "neutral";
}
