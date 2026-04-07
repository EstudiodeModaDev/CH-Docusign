import * as React from "react";
import "./ReasonModal.css";

interface ReturnFolderModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSend: (reason: string) => Promise<void> | void;
  title: string
}

export function ReasonModal({title, open, loading = false, onClose, onSend,}: ReturnFolderModalProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError("Debes escribir la razón de devolución.");
      return;
    }

    try {
      setError("");
      await onSend(trimmedReason);
      setReason("");
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "No fue posible devolver la carpeta.");
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason("");
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
          <p className="rfm-text">
            Escribe la razón por la cual la carpeta será devuelta.
          </p>

          <label className="rfm-label" htmlFor="return-reason">
            Razón de devolución
          </label>

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

          {error ? <div className="rfm-error">{error}</div> : null}
        </div>

        <div className="rfm-footer">
          <button type="button" className="rfm-btn rfm-btn--ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>

          <button type="button" className="rfm-btn rfm-btn--danger" onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading ? "Devolviendo..." : "Devolver carpeta"}
          </button>
        </div>
      </div>
    </div>
  );
};