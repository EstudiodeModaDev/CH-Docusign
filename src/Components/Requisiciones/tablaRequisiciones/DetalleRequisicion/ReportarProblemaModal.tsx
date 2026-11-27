import * as React from "react";
import { notify } from "../../../../utils/notify";
import SubModal from "./SubModal";
import { countWords } from "./detalleUtils";

const MAX_WORDS = 200;

const MOTIVOS = [
  "Información incompleta",
  "Inconsistencia en datos",
  "Planta no disponible",
  "Otros",
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Devuelve false si no se pudo enviar (el modal queda abierto) */
  onSubmit: (motivo: string, detalle: string) => Promise<boolean>;
};

export default function ReportarProblemaModal({ open, onClose, onSubmit }: Props) {
  const [selectedReason, setSelectedReason] = React.useState("");
  const [reportText, setReportText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const reportWords = countWords(reportText);
  const reportExceeded = reportWords > MAX_WORDS;

  const handleSend = async () => {
    if (!selectedReason) {
      notify.error("Debes seleccionar un motivo.");
      return;
    }

    if (!reportText.trim()) {
      notify.error("Debes escribir el detalle del problema.");
      return;
    }

    if (reportExceeded) {
      notify.error(`El detalle no puede superar ${MAX_WORDS} palabras.`);
      return;
    }

    setSaving(true);
    try {
      const ok = await onSubmit(selectedReason, reportText);
      if (!ok) return;
      notify.auto("El motivo fue actualizado correctamente.");
      setSelectedReason("");
      setReportText("");
      onClose();
    } catch (error) {
      console.error("Error actualizando el motivo de la requisicion", error);
      notify.auto("No fue posible guardar el motivo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubModal
      open={open}
      titleId="rq-report-title"
      kicker="Reporte"
      title="Reportar problema"
      description={`Selecciona el tipo de novedad y describe el caso en un maximo de ${MAX_WORDS} palabras.`}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" disabled={saving} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger btn-xs rq-detail-btn rq-detail-btn--danger" disabled={saving || reportExceeded} onClick={handleSend}>
            {saving ? "Enviando..." : "Enviar"}
          </button>
        </>
      }
    >
      <label className="rq-report-label" htmlFor="rq-report-reason">Motivo</label>
      <select
        id="rq-report-reason"
        className="rq-report-select"
        value={selectedReason}
        onChange={(event) => setSelectedReason(event.target.value)}
        disabled={saving}
      >
        <option value="">Selecciona un motivo</option>
        {MOTIVOS.map((motivo) => (
          <option key={motivo} value={motivo}>{motivo}</option>
        ))}
      </select>

      <label className="rq-report-label" htmlFor="rq-report-text">Detalle del problema</label>
      <textarea
        id="rq-report-text"
        className={`rq-report-textarea ${reportExceeded ? "is-invalid" : ""}`}
        value={reportText}
        onChange={(event) => setReportText(event.target.value)}
        placeholder="Describe el problema con el mayor contexto posible."
        rows={6}
        disabled={saving}
      />

      <div className={`rq-report-counter ${reportExceeded ? "is-invalid" : ""}`}>
        {reportWords}/{MAX_WORDS} palabras
      </div>
    </SubModal>
  );
}
