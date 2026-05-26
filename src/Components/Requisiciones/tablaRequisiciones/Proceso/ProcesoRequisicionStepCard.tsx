import { normalizeStepType } from "./processUtils";
import CompletedStep from "./SubComponents/CompleteStep";
import OnGoingStep from "./SubComponents/OnGoingStep";
import type { StepCardProps } from "./types";

export default function ProcesoRequisicionStepCard(props: StepCardProps) {
  const {rowId, step, detail, stepTone, busy, approvalValue, textValue, numberValue, onApprovalChange, onTextChange, onNumberChange, onOmit, onComplete,} = props;

  const stepType = normalizeStepType(step.TipoPaso);
  const isDone = stepTone === "done";

  return (
    <article key={detail.Id ?? `${rowId}-${step.Id}`} className="rq-process-card">
      <div className="rq-process-card__header">
        <div>
          <h3>{step.Title || "Paso"}</h3>
          <p>{step.Descripcion || "Completa este paso para avanzar con la requisicion."}</p>
        </div>

        <span className={`rq-phase-chip rq-phase-chip--${stepTone}`}>
          {isDone ? detail.Estado : stepType}
        </span>
      </div>

      {!isDone ? (
        <div className="rq-process-card__body">
          <OnGoingStep 
            step={step} 
            detail={detail} 
            busy={busy} 
            approvalValue={approvalValue} 
            textValue={textValue} 
            numberValue={numberValue} 
            onApprovalChange={onApprovalChange} 
            onTextChange={onTextChange} 
            onNumberChange={onNumberChange} 
            onOmit={onOmit} 
            onComplete={onComplete}/>
        </div>
      ) : (
        <CompletedStep detail={detail}/>
      )}
    </article>
  );
}
