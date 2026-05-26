import type { detalleRequisicion, pasoRequisicion } from "../../../../../models/Requisiciones/pasos";
import { normalizeStepType } from "../processUtils";

export type onGoingStepProps = {
  step: pasoRequisicion;
  detail: detalleRequisicion;
  busy: boolean;
  approvalValue: "" | "Aprobado" | "Rechazado";
  textValue: string;
  numberValue: string;
  onApprovalChange: (detailId: string, value: "" | "Aprobado" | "Rechazado") => void;
  onTextChange: (detailId: string, value: string) => void;
  onNumberChange: (detailId: string, value: string) => void;
  onOmit: (detail: detalleRequisicion) => void | Promise<void>;
  onComplete: (detail: detalleRequisicion, step: pasoRequisicion) => void | Promise<void>;
};

export default function OnGoingStep(props: onGoingStepProps) {
  const {step, detail, busy, approvalValue, textValue, numberValue, onApprovalChange, onTextChange, onNumberChange, onOmit, onComplete,} = props;

  const stepType = normalizeStepType(step.TipoPaso);
  const detailId = detail.Id ?? "";

  return (
    <>
      {stepType === "Aprobacion" && (
        <>
          <label className="rb-label" htmlFor={`approval-${detailId}`}>Decision</label>
          <select id={`approval-${detailId}`} className="rb-select" value={approvalValue} onChange={(event) => onApprovalChange(detailId, event.target.value as "" | "Aprobado" | "Rechazado")}>
            <option value="">Selecciona una opcion</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Rechazado">Rechazado</option>
          </select>

          {approvalValue === "Rechazado" && (
            <>
              <label className="rb-label" htmlFor={`approval-note-${detailId}`}>Motivo</label>
              <textarea
                id={`approval-note-${detailId}`}
                className="rq-process-textarea"
                rows={4}
                value={textValue}
                onChange={(event) => onTextChange(detailId, event.target.value)}
                placeholder="Explica el rechazo"
              />
            </>
          )}
        </>
      )}

      {stepType === "Numerico" && (
        <>
          <label className="rb-label" htmlFor={`number-${detailId}`}>Valor</label>
          <input
            id={`number-${detailId}`}
            type="number"
            className="rb-input"
            value={numberValue}
            onChange={(event) => onNumberChange(detailId, event.target.value)}
            placeholder="Ingresa un valor numerico"
          />
        </>
      )}

      {stepType === "Texto" && (
        <>
          <label className="rb-label" htmlFor={`text-${detailId}`}>Respuesta</label>
          <textarea
            id={`text-${detailId}`}
            className="rq-process-textarea"
            rows={5}
            value={textValue}
            onChange={(event) => onTextChange(detailId, event.target.value)}
            placeholder="Escribe el detalle de este paso"
          />
        </>
      )}

      <div className="rq-process-actions">
        {!step.Obligatorio && (
          <button type="button" className="rb-clear-btn" onClick={() => void onOmit(detail)} disabled={busy}>Omitir</button>
        )}

        <button type="button" className="rq-process-primary" onClick={() => void onComplete(detail, step)} disabled={busy}>
          {busy ? "Guardando..." : "Completar paso"}
        </button>
      </div>
    </>
  );
}
