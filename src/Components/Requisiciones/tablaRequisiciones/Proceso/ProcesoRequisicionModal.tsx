import * as React from "react";
import { useRequisicionSteps } from "../../../../Funcionalidades/Requisiciones/DetallesRequisicion";
import type { detalleRequisicion, pasoRequisicion } from "../../../../models/Requisiciones/pasos";
import ProcesoRequisicionStepCard from "./ProcesoRequisicionStepCard";
import { isStepDone, resolveChecklistPhase, sortChecklistSteps } from "./processUtils";
import type { ProcesoRequisicionModalProps } from "./types";
import "../tablaRequisiciones.css";

export { resolveChecklistPhase, sortChecklistSteps } from "./processUtils";

export default function ProcesoRequisicionModal(props: ProcesoRequisicionModalProps) {
  const { open, row, onClose, onChecklistChanged } = props;
  const {
    templates,
    resolvedRows,
    loadingTemplates,
    templatesError,
    loadTemplates,
    loadingDetails,
    detailsError,
    loadDetails,
    decisiones,
    motivos,
    setDecisiones,
    setMotivos,
    handleCompleteStep,
  } = useRequisicionSteps(row?.Id);
  const [busyId, setBusyId] = React.useState<string>("");

  React.useEffect(() => {
    if (!open || !row?.Id) return;
    console.log("Cargando checklist para requisicion", row.Id);
    void Promise.all([loadTemplates(), loadDetails()]);
  }, [open, row?.Id]);

  React.useEffect(() => {
    console.log(resolvedRows)
  }, [resolvedRows]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const setApprovalValue = React.useCallback((detailId: string, value: "" | "Aprobado" | "Rechazado") => {
    setDecisiones((current) => ({ ...current, [detailId]: value }));
  }, [setDecisiones]);

  const setTextValue = React.useCallback((detailId: string, value: string) => {
    setMotivos((current) => ({ ...current, [detailId]: value }));
  }, [setMotivos]);

  const setNumberValue = React.useCallback((detailId: string, value: string) => {
    setMotivos((current) => ({ ...current, [detailId]: value }));
  }, [setMotivos]);

  const completeStep = React.useCallback(async (detail: detalleRequisicion, _step: pasoRequisicion) => {
    if (!detail?.Id) return;
    setBusyId(detail.Id);
    try {
      await handleCompleteStep(detail, "Completado");
      await loadDetails();
      await onChecklistChanged?.();
    } finally {
      setBusyId("");
    }
  }, [handleCompleteStep, loadDetails, onChecklistChanged]);

  const omitStep = React.useCallback(async (detail: detalleRequisicion) => {
    if (!detail?.Id) return;
    setBusyId(detail.Id);
    try {
      await handleCompleteStep(detail, "Omitido");
      await loadDetails();
      await onChecklistChanged?.();
    } finally {
      setBusyId("");
    }
  }, [handleCompleteStep, loadDetails, onChecklistChanged]);

  if (!open || !row) return null;

  const orderedTemplates = sortChecklistSteps(templates.filter((step) => step.Activo !== false));
  const phase = resolveChecklistPhase(
    orderedTemplates,
    resolvedRows.map((item) => item.detalle).filter(Boolean) as detalleRequisicion[]
  );

  return (
    <div className="rq-process-backdrop" role="presentation" onClick={onClose}>
      <section
        className="rq-process-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rq-process-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rq-process-header">
          <div className="rq-process-header__copy">
            <span className="rq-detail-kicker">Checklist del proceso</span>
            <h2 id="rq-process-title" className="rq-detail-title">
              {row.Title || "Proceso de requisicion"}
            </h2>
            <p className="rq-detail-copy">
              #{row.Id || "Sin ID"} - {phase.label}
            </p>
          </div>

          <div className="rq-process-header__meta">
            <span className={`rq-phase-chip rq-phase-chip--${phase.tone}`}>
              {phase.completed}/{phase.total || 0} pasos
            </span>
            <button type="button" className="btn btn-secondary-final btn-xs" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <div className="rq-process-body">
          {loadingTemplates || loadingDetails ? <div>Cargando checklist...</div> : null}
          {templatesError ? <div>{templatesError}</div> : null}
          {detailsError ? <div>{detailsError}</div> : null}

          {!loadingTemplates && !loadingDetails && !templatesError && !detailsError && !orderedTemplates.length ? (
            <div className="rb-empty">
              <strong>Sin pasos configurados</strong>
              <p>No hay checklist activo para esta requisicion.</p>
            </div>
          ) : (
            resolvedRows.map((item, index) => {
              if (!item.plantilla || !item.detalle) return null;

              const previous = index > 0 ? resolvedRows[index - 1] : null;
              const unlocked = index === 0 || isStepDone(previous?.estado);
              const done = isStepDone(item.estado);
              const stepTone = done ? "done" : unlocked ? "current" : "pending";

              if (!unlocked && !done) return null;

              return (
                <ProcesoRequisicionStepCard
                  key={item.detailId || `${row.Id}-${item.templateId}`}
                  rowId={String(row.Id ?? "")}
                  step={item.plantilla}
                  detail={item.detalle}
                  stepTone={stepTone}
                  busy={busyId === item.detailId}
                  approvalValue={decisiones[item.detailId] ?? ""}
                  textValue={motivos[item.detailId] ?? ""}
                  numberValue={motivos[item.detailId] ?? ""}
                  onApprovalChange={setApprovalValue}
                  onTextChange={setTextValue}
                  onNumberChange={setNumberValue}
                  onOmit={omitStep}
                  onComplete={completeStep}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
