import * as React from "react";
import "./ConfirmaModal.css";

export type ConfirmModalPayload = {
  reason?: string;
  date?: string;
};

interface ReturnFolderModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSend: (payload: ConfirmModalPayload) => Promise<void> | void;
  title: string
  needText: boolean;
  description: string;
  buttonText: string
  needDate?: boolean
  dateText?: string
}

export function ConfirmModal({dateText, needDate, title, open, loading = false, onClose, onSend, needText, description, buttonText}: ReturnFolderModalProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const [date, setDate] = React.useState<string>("")

  React.useEffect(() => {
    if (!open) {
      setReason("");
      setDate("");
      setError("");
    }
  }, [open]);

  const requiresReason = Boolean(needText);
  const requiresDate = Boolean(needDate);
  const hasReason = reason.trim().length > 0;
  const hasDate = date.trim().length > 0;
  const isSubmitDisabled = loading || (requiresReason && !hasReason) || (requiresDate && !hasDate);

  const handleSubmit = async () => {
    try {
      setError("");
      await onSend({
        reason: hasReason ? reason.trim() : undefined,
        date: hasDate ? date : undefined,
      });
      setReason("");
      setDate("");
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "No fue posible completar la acción.");
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason("");
    setDate("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="rfm-backdrop" onClick={handleClose}>
      <div className="rfm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="rfm-title">
        <div className="rfm-header">
          <h2 id="rfm-title" className="rfm-title">{title}</h2>
          <button type="button" className="rfm-close" onClick={handleClose} disabled={loading} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="rfm-body">
          {needText ? (
            <>
              <p className="rfm-text">{description}</p>

              <label className="rfm-label" htmlFor="return-reason">Razón</label>

              <textarea
                id="return-reason"
                className="rfm-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe claramente qué debe corregirse..."
                rows={6}
                maxLength={1000}
                disabled={loading}
              />

              <div className="rfm-meta">
                <span>{reason.trim().length}/1000</span>
              </div>

            </>) : (
            <p className="rfm-text">{description}</p>
          )}

          {needDate ? (
            <div className="rfm-dateBlock">
              <label className="rfm-label" htmlFor="input-date">{dateText}</label>
              <div className="rfm-dateField">
                <input
                  id="input-date"
                  type="date"
                  className="rfm-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ) : null}

          {error ? <div className="rfm-error">{error}</div> : null}
        </div>

        <div className="rfm-footer">
          <button type="button" className="rfm-btn rfm-btn--ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>

          <button type="button" className="rfm-btn rfm-btn--danger" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {loading ? "Procesando..." : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
