import * as React from "react";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import { notify } from "../../../utils/notify";
import { spDateToDDMMYYYY } from "../../../utils/Date";
import "./tablaRequisiciones.css";
import { useNotifyRequisiciones } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/useRequisicionNotifications";

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
  const notificaciones = useNotifyRequisiciones()
  const [currentRow, setCurrentRow] = React.useState<requisiciones | null>(row);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState("");
  const [reportText, setReportText] = React.useState("");
  const [savingReport, setSavingReport] = React.useState(false);

  //Cerrar con escape o click fuera
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    setCurrentRow(row);
    setSelectedReason("");
    setReportText("");
  }, [open, row]);

  if (!open || !currentRow) return null;

  const tone = getToneByEstado(currentRow.Estado);
  const reportWords = countWords(reportText);
  const reportExceeded = reportWords > 200;

  const handleSendNotification = async () => {
    if (!currentRow?.Id) {
      notify.error("La requisicion no tiene un ID valido.");
      return;
    }

    if (!selectedReason) {
      notify.error("Debes seleccionar un motivo.");
      return;
    }

    if (!reportText.trim()) {
      notify.error("Debes escribir el detalle del problema.");
      return;
    }

    if (reportExceeded) {
      notify.error("El detalle no puede superar 200 palabras.");
      return;
    }

    setSavingReport(true);
    try {
      if(!row) {
        notify.error("No se ha seleccionado una requisición valida")
        return
      }
      notificaciones.notifyInconveniente(row, selectedReason, reportText)
      notify.auto("El motivo fue actualizado correctamente.");
      setSelectedReason("")
      setReportText("")
      setReportModalOpen(false)
    } catch (error) {
      console.error("Error actualizando el motivo de la requisicion", error);
      notify.auto("No fue posible guardar el motivo.");
    } finally {
      setSavingReport(false);
    }
  };

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
          <div className="rq-detail-header__copy">
            <span className="rq-detail-kicker">Detalle de requisicion</span>
            <h2 id="rq-detail-title" className="rq-detail-title">
              {currentRow.Title || "Detalle de requisicion"}
            </h2>
            <p className="rq-detail-copy">
              #{currentRow.Identificador || currentRow.Id || "Sin ID"} - {currentRow.tipoRequisicion || "Sin tipo"} - {currentRow.Ciudad || "Sin ciudad"}
            </p>
          </div>

          <div className="rq-detail-header__meta">
            <div className="rq-detail-header__status">
              <span className={`rb-status rb-status--${tone}`}>{currentRow.Estado || "Sin estado"}</span>
            </div>

            <div className="rq-detail-header__actions">
              <button type="button" className="btn btn-danger btn-xs rq-detail-btn rq-detail-btn--danger" onClick={() => setReportModalOpen(true)}>
                Reportar problema
              </button>
              <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
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
                    <strong className="rq-detail-value">{formatValue(currentRow, field)}</strong>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {reportModalOpen ? (
          <div className="rq-report-backdrop" role="presentation" onClick={() => !savingReport && setReportModalOpen(false)}>
            <section
              className="rq-report-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rq-report-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="rq-report-header">
                <div>
                  <span className="rq-detail-kicker">Reporte</span>
                  <h3 id="rq-report-title" className="rq-report-title">Reportar problema</h3>
                  <p className="rq-report-copy">Selecciona el tipo de novedad y describe el caso en un maximo de 200 palabras.</p>
                </div>
              </header>

              <div className="rq-report-body">
                <label className="rq-report-label" htmlFor="rq-report-reason">Motivo</label>
                <select
                  id="rq-report-reason"
                  className="rq-report-select"
                  value={selectedReason}
                  onChange={(event) => setSelectedReason(event.target.value)}
                  disabled={savingReport}
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="Información incompleta">Información incompleta</option>
                  <option value="Inconsistencia en datos">Inconsistencia en datos</option>
                  <option value="Planta no disponible">Planta no disponible</option>
                  <option value="Otros">Otros</option>

                </select>

                <label className="rq-report-label" htmlFor="rq-report-text">Detalle del problema</label>
                <textarea
                  id="rq-report-text"
                  className={`rq-report-textarea ${reportExceeded ? "is-invalid" : ""}`}
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                  placeholder="Describe el problema con el mayor contexto posible."
                  rows={6}
                  disabled={savingReport}
                />

                <div className={`rq-report-counter ${reportExceeded ? "is-invalid" : ""}`}>
                  {reportWords}/200 palabras
                </div>
              </div>

              <footer className="rq-report-actions">
                <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" disabled={savingReport} onClick={() => setReportModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger btn-xs rq-detail-btn rq-detail-btn--danger" disabled={savingReport || reportExceeded} onClick={handleSendNotification}>
                  {savingReport ? "Enviando..." : "Enviar"}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function countWords(value: string): number {
  const words = value.trim().match(/\S+/g);
  return words ? words.length : 0;
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
