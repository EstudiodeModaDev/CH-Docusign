import * as React from "react";

type Props = {
  open: boolean;
  /** id del titulo, para aria-labelledby */
  titleId: string;
  kicker: string;
  title: string;
  description?: React.ReactNode;
  /** Mientras esta ocupado no se cierra con Escape ni con click fuera */
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

// Modal secundario que se abre encima del detalle de la requisicion.
export default function SubModal({ open, titleId, kicker, title, description, busy = false, onClose, children, footer }: Props) {
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="rq-report-backdrop" role="presentation" onClick={() => !busy && onClose()}>
      <section
        className="rq-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rq-report-header">
          <div>
            <span className="rq-detail-kicker">{kicker}</span>
            <h3 id={titleId} className="rq-report-title">{title}</h3>
            {description ? <p className="rq-report-copy">{description}</p> : null}
          </div>
        </header>

        <div className="rq-report-body">{children}</div>

        <footer className="rq-report-actions">{footer}</footer>
      </section>
    </div>
  );
}
