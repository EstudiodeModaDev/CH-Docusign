import * as React from "react";
import RichTextBase64 from "../../../../RichText/RichText";
import { safeString } from "../../../../../utils/text";

type DecisionValue = "" | "Aceptado" | "Rechazado";

type ApprovalStepContentProps = {
  idDetalle: string;
  isDone: boolean;
  catalogReady: boolean;
  decision: DecisionValue;
  motivo: string;
  setDecisiones: React.Dispatch<React.SetStateAction<Record<string, DecisionValue>>>;
  setMotivos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onApprove: () => void;
};

export function ApprovalStepContent(props: ApprovalStepContentProps) {
  const { idDetalle, isDone, catalogReady, decision, motivo, setDecisiones, setMotivos, onApprove } = props;

  if (isDone) return null;

  return (
    <>
      <select
        className="step-card__select"
        value={decision}
        onChange={(e) => {
          const value = e.target.value as DecisionValue;
          setDecisiones((prev) => ({ ...prev, [idDetalle]: value }));
        }}
      >
        <option value="">Seleccione…</option>
        <option value="Aceptado">Aceptado</option>
        <option value="Rechazado">Rechazado</option>
      </select>

      {decision === "Rechazado" && (
        <input
          type="text"
          className="step-card__input"
          placeholder="Motivo del rechazo"
          value={motivo}
          onChange={(e) => {
            setMotivos((prev) => ({ ...prev, [idDetalle]: e.target.value }));
          }}
        />
      )}

      <button
        type="button"
        className={`step-card__check ${isDone ? "step-card__check--active" : ""}`}
        disabled={isDone || !catalogReady}
        onClick={onApprove}
        title="Completar paso"
      >
        ✓
      </button>
    </>
  );
}

type NotificationStepContentProps = {
  isDone: boolean;
  busySend: boolean;
  destinatario: string;
  asunto: string;
  cuerpo: string;
  attachments: File[];
  setDestinatario: React.Dispatch<React.SetStateAction<string>>;
  setAsunto: React.Dispatch<React.SetStateAction<string>>;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  setIsCustomBody: React.Dispatch<React.SetStateAction<boolean>>;
  onAddAttachments: (files: FileList | null) => void;
  onRemoveAttachment: (index: number) => void;
  onSend: () => void;
};

export function NotificationStepContent(props: NotificationStepContentProps) {
  const {
    isDone,
    busySend,
    destinatario,
    asunto,
    cuerpo,
    attachments,
    setDestinatario,
    setAsunto,
    setBody,
    setIsCustomBody,
    onAddAttachments,
    onRemoveAttachment,
    onSend,
  } = props;
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (isDone) return null;

  React.useEffect(() => {
    console.log(attachments)
  }, [attachments])

  return (
    <div className="mail">
      <div className="mail__topbar">
        <div className="mail__title">Nuevo mensaje</div>

        <div className="mail__actions">
          <button
            type="button"
            className="mail__send btn btn-xs"
            disabled={busySend}
            onClick={onSend}
            title="Enviar notificación y completar"
          >
            {busySend ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>

      <div className="mail__main">
        <div className="mail__fields">
          <div className="mail__row">
            <div className="mail__label">Para</div>
            <input
              type="text"
              className="mail__input"
              placeholder="correo@dominio.com; correo2@gmail.com; correo3@hotmail.com"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              disabled={busySend}
            />
          </div>

          <div className="mail__row">
            <div className="mail__label">Asunto</div>
            <input
              type="text"
              className="mail__input"
              placeholder="Asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              disabled={busySend}
            />
          </div>
        </div>

        <div className="mail__editor">
          <RichTextBase64
            value={cuerpo}
            placeholder="Redacta tu mensaje… (HTML permitido)"
            readOnly={busySend}
            className="mail__rte-inner"
            imageSize={{ width: 240, fit: "contain" }}
            onChange={(html) => {
              setIsCustomBody(true);
              setBody(html);
            }}
          />
        </div>
      </div>

      <div className="mail__attachments">
        <div className="mail__attachments-header">
          <div className="mail__attachments-heading">
            <strong className="mail__attachments-title">Adjuntos</strong>
            <span className="mail__attachments-count">
              {attachments.length === 0 ? "Sin archivos" : `${attachments.length} archivo(s)`}
            </span>
          </div>

          <button
            type="button"
            className="mail__attachments-trigger"
            disabled={busySend}
            onClick={() => fileInputRef.current?.click()}
          >
            Agregar archivos
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="mail__attachments-input"
            disabled={busySend}
            onChange={(e) => {
              onAddAttachments(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {attachments.length ? (
          <div className="mail__attachments-list">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="mail__attachments-item">
                <div className="mail__attachments-file">
                  <span className="mail__attachments-name">{file.name}</span>
                  <span className="mail__attachments-meta">
                    {file.size >= 1024 * 1024
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : `${(file.size / 1024).toFixed(1)} KB`}
                  </span>
                </div>
                <button
                  type="button"
                  className="mail__attachments-remove"
                  disabled={busySend}
                  onClick={() => onRemoveAttachment(index)}
                  title="Quitar adjunto"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mail__attachments-empty">No hay archivos adjuntos.</p>
        )}
      </div>
    </div>
  );
}

type UploadStepContentProps = {
  idDetalle: string;
  isDone: boolean;
  busyUpload: boolean;
  file: File | null;
  pasoNombreEvidencia?: string | null;
  pasoNombre?: string | null;
  pasoAceptaTipos?: string | null;
  onOpenPicker: (config: { idDetalle: string; label: string; accept: string }) => void;
  onUpload: () => void;
};

export function UploadStepContent(props: UploadStepContentProps) {
  const {
    idDetalle,
    isDone,
    busyUpload,
    file,
    pasoNombreEvidencia,
    pasoNombre,
    pasoAceptaTipos,
    onOpenPicker,
    onUpload,
  } = props;

  if (isDone) return null;

  return (
    <>
      <div className="step-card__upload-wrapper">
        <button
          type="button"
          className="step-card__upload-btn"
          disabled={busyUpload}
          onClick={() =>
            onOpenPicker({
              idDetalle,
              label: safeString(pasoNombreEvidencia ?? pasoNombre ?? "Documento requerido"),
              accept: safeString(pasoAceptaTipos ?? ".pdf,.jpg,.jpeg,.png"),
            })
          }
        >
          Seleccionar archivo
        </button>

        {file && <span className="step-card__file-name">{file.name}</span>}
      </div>

      <button
        type="button"
        className="btn btn-xs"
        disabled={busyUpload || !file}
        onClick={onUpload}
        title="Subir y completar"
      >
        {busyUpload ? "Subiendo…" : "Subir ✓"}
      </button>
    </>
  );
}

type StepCompletionNotesProps = {
  isOmitted: boolean;
  isCompleted: boolean;
  completadoPor?: string | null;
  fechaCompletacion?: string | null;
  notas?: string | null;
};

export function StepCompletionNotes(props: StepCompletionNotesProps) {
  const { isOmitted, isCompleted, completadoPor, fechaCompletacion, notas } = props;

  if (!isOmitted && !isCompleted) return null;

  return (
    <div className="step-card__notes">
      <p className="step-card__note">
        <strong>{isOmitted ? "Omitido" : "Completado"} Por: </strong>
        {completadoPor}
      </p>
      <p className="step-card__note">
        <strong>Fecha en la que se {isOmitted ? "omitio" : "completo"}: </strong>
        {fechaCompletacion}
      </p>
      <p className="step-card__note">
        <strong>Notas: </strong>
        {notas}
      </p>
    </div>
  );
}
