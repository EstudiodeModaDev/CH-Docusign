import "./RequisicionesMetricas.css";
import type { WatchlistItem } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { IconAlertTriangle, IconXCircle } from "./icons";

type Props = {
  items: WatchlistItem[];
};

const VISIBLE_LIMIT = 8;

function urgenciaLabel(item: WatchlistItem): string {
  if (item.diasRestantes === null) return "Sin fecha límite";
  if (item.diasRestantes < 0) return `Vencida hace ${Math.abs(item.diasRestantes)} día${Math.abs(item.diasRestantes) === 1 ? "" : "s"}`;
  if (item.diasRestantes === 0) return "Vence hoy";
  return `Vence en ${item.diasRestantes} día${item.diasRestantes === 1 ? "" : "s"}`;
}

export default function WatchlistCard({ items }: Props) {
  const visible = items.slice(0, VISIBLE_LIMIT);
  const remaining = items.length - visible.length;

  return (
    <article className="rqm-card rqm-watchlist-card">
      <div className="rqm-card__header">
        <div>
          <h2>Requiere atención</h2>
          <p>Vacantes abiertas en riesgo o vencidas, ordenadas por urgencia</p>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rqm-table__empty">No hay vacantes en riesgo ni vencidas para los filtros seleccionados.</p>
      ) : (
        <ul className="rqm-watchlist">
          {visible.map((item) => (
            <li key={item.id} className="rqm-watchlist__item">
              <span className={`rqm-watchlist__icon is-${item.tone}`}>
                {item.tone === "risk" ? <IconXCircle size={16} /> : <IconAlertTriangle size={16} />}
              </span>
              <span className="rqm-watchlist__body">
                <strong>{item.cargo}</strong>
                <span>
                  {[item.ciudad, item.tienda, item.direccion].filter(Boolean).join(" · ")}
                  {item.analista ? ` · ${item.analista}` : ""}
                </span>
              </span>
              <span className={`rqm-badge is-${item.tone}`}>{urgenciaLabel(item)}</span>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && <p className="rqm-watchlist__more">+{remaining} vacantes adicionales en riesgo</p>}
    </article>
  );
}
