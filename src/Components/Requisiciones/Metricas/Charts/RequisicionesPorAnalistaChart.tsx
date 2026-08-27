import type { MetricGroupRow } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";

type Props = {
  data: MetricGroupRow[];
};

export const ANALISTA_CHART_VISIBLE_LIMIT = 8;

export default function RequisicionesPorAnalistaChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="rqm-table__empty">No hay datos para los filtros seleccionados.</p>;
  }

  const visible = data.slice(0, ANALISTA_CHART_VISIBLE_LIMIT);
  const remaining = data.length - visible.length;

  return (
    <>
      <ul className="rqm-analista-list">
        {visible.map((row) => (
          <li key={row.label} className="rqm-analista-row">
            <div className="rqm-analista-row__head">
              <span className="rqm-analista-row__name">{row.label}</span>
              <span className="rqm-analista-row__count">
                {row.total} {row.total === 1 ? "requisición" : "requisiciones"}
              </span>
            </div>
            <div className="rqm-progress rqm-progress--fluid">
              <div className={`rqm-progress__bar is-${row.semaforo}`} style={{ width: `${row.cumplimientoPct}%` }}>
                {row.cumplimientoPct}%
              </div>
            </div>
          </li>
        ))}
      </ul>

      {remaining > 0 && <p className="rqm-watchlist__more">+{remaining} analistas adicionales</p>}
    </>
  );
}
