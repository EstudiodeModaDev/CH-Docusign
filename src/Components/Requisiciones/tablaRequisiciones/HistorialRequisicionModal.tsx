import * as React from "react";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import type { historicoFecha } from "../../../models/Requisiciones/historicoFechas";
import { useHistoricoFechas } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/useHistoricoFechas";
import { spDateToDDMMYYYY } from "../../../utils/Date";
import "./tablaRequisiciones.css";

type Props = {
  open: boolean;
  row: requisiciones | null;
  onClose: () => void;
};

export default function HistorialRequisicionModal({ open, row, onClose }: Props) {
  const { getRequisicionLogs } = useHistoricoFechas({});
  const [logs, setLogs] = React.useState<historicoFecha[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !row?.Id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setLogs([]);

    getRequisicionLogs(row)
      .then((res) => {
        if (!cancelled) setLogs(res.data);
      })
      .catch((e) => {
        console.error("Error cargando el historial de la requisicion", e);
        if (!cancelled) setError("No fue posible cargar el historial de la requisición.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row?.Id]);

  if (!open || !row) return null;

  return (
    <div className="rq-report-backdrop" role="presentation" onClick={onClose}>
      <section
        className="rq-report-modal rq-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rq-history-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rq-report-header">
          <div>
            <span className="rq-detail-kicker">Historial</span>
            <h3 id="rq-history-title" className="rq-report-title">Historial de la requisición #{row.Id}</h3>
            <p className="rq-report-copy">Acciones registradas sobre la requisición, de la más reciente a la más antigua.</p>
          </div>
        </header>

        <div className="rq-history-body">
          {loading ? (
            <p className="rq-history-empty">Cargando historial...</p>
          ) : error ? (
            <p className="rq-history-empty rq-history-empty--error">{error}</p>
          ) : logs.length === 0 ? (
            <p className="rq-history-empty">Esta requisición no tiene movimientos registrados.</p>
          ) : (
            <ol className="rq-history-list">
              {logs.map((log, index) => (
                <li key={log.id ?? index} className="rq-history-item">
                  <span className="rq-history-dot" aria-hidden="true" />
                  <article className="rq-history-card">
                    <div className="rq-history-card__top">
                      <strong className="rq-history-action">{log.Accion || "Sin acción"}</strong>
                      <span className="rq-history-date">{formatDateTime(log.fechaComentario)}</span>
                    </div>

                    {log.observacion ? <p className="rq-history-text">{String(log.observacion)}</p> : null}

                    <dl className="rq-history-meta">
                      {log.fechaLimite ? (
                        <div>
                          <dt>Fecha límite anterior</dt>
                          <dd>{formatDate(log.fechaLimite)}</dd>
                        </div>
                      ) : null}
                      {log.Nuevo_Ans ? (
                        <div>
                          <dt>Nueva fecha</dt>
                          <dd>{formatDate(log.Nuevo_Ans)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="rq-report-actions">
          <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}

function formatDate(value: string | Date): string {
  if (value instanceof Date) return spDateToDDMMYYYY(value.toISOString());
  // Valores no fecha (p. ej. "Cancelación") se muestran tal cual
  return spDateToDDMMYYYY(value) || String(value);
}

function formatDateTime(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}
