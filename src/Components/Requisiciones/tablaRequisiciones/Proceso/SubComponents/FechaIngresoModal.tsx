import * as React from "react";
import { getTodayLocalISO } from "../../../../../utils/Date";

type Props = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (fechaIngreso: string) => void | Promise<void>;
};

// Se muestra cuando el ultimo paso del checklist va a cerrar la requisicion.
export default function FechaIngresoModal({ open, busy, onCancel, onConfirm }: Props) {
  const [fecha, setFecha] = React.useState<string>("");

  React.useEffect(() => {
    if (open) setFecha(getTodayLocalISO());
  }, [open]);

  if (!open) return null;

  return (
    <div className="rq-process-backdrop rq-ingreso-backdrop" role="presentation">
      <section className="rq-process-modal rq-ingreso-modal" role="dialog" aria-modal="true" aria-labelledby="rq-ingreso-title">
        <form
          className="rq-ingreso-body"
          onSubmit={(event) => {
            event.preventDefault();
            if (fecha) void onConfirm(fecha);
          }}
        >
          <span className="rq-detail-kicker">Cierre de requisicion</span>
          <h2 id="rq-ingreso-title" className="rq-detail-title">Fecha de ingreso</h2>
          <p className="rq-detail-copy">
            Se completaron todos los pasos. Indica la fecha de ingreso de la persona; esta sera la fecha de cierre de la requisicion.
          </p>

          <label className="rq-ingreso-field">
            <span>Fecha de ingreso *</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required disabled={busy} />
          </label>

          <div className="rq-ingreso-actions">
            <button type="button" className="btn btn-secondary-final btn-xs" onClick={onCancel} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="rq-process-primary" disabled={busy || !fecha}>
              {busy ? "Cerrando..." : "Cerrar requisicion"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
