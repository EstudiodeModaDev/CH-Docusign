import * as React from "react";
import "./RequisicionesMetricas.css";
import type { MetricGroupRow, RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
type GroupKey = "direccion" | "ciudad" | "analista";

type Props = {
  rowsCount: number;
  metrics: RequisicionesMetrics;
};

export default function RequisicionesTableroFooter(props: Props) {
  const {
    rowsCount,
    metrics,
  } = props;

  const [groupBy, setGroupBy] = React.useState<GroupKey>("direccion");

  const tableRows = React.useMemo<MetricGroupRow[]>(() => {
    if (groupBy === "ciudad") return metrics.porCiudad;
    if (groupBy === "analista") return metrics.porAnalista;
    return metrics.porDireccion;
  }, [groupBy, metrics.porAnalista, metrics.porCiudad, metrics.porDireccion]);

  const groupLabel = groupBy === "ciudad" ? "Ciudad" : groupBy === "analista" ? "Analista" : "Dirección";

  React.useState({
    
  })

  return (
    <section className="rqm-card rqm-table-card">
      <div className="rqm-card__header rqm-card__header--stack">
        <div className="rqm-summary-line">
          <h2>% Cumplimiento ANS por Dirección, Ciudad y Analista</h2>
          <span>{rowsCount} requisiciones analizadas</span>
        </div>
        <div className="rqm-tabs" role="tablist" aria-label="Vista de agrupación">
          <button type="button" className={groupBy === "direccion" ? "is-active" : ""} onClick={() => setGroupBy("direccion")}>
            Dirección
          </button>
          <button type="button" className={groupBy === "ciudad" ? "is-active" : ""} onClick={() => setGroupBy("ciudad")}>
            Ciudad
          </button>
          <button type="button" className={groupBy === "analista" ? "is-active" : ""} onClick={() => setGroupBy("analista")}>
            Analista
          </button>
        </div>
      </div>

      <div className="rqm-table-wrap">
        <table className="rqm-table">
          <thead>
            <tr>
              <th>{groupLabel}</th>
              <th>% Cumplimiento</th>
              <th>Vacantes Abiertas</th>
              <th>Tiempo Promedio de Cierre</th>
              <th>Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>
                  <div className="rqm-progress">
                    <div className={`rqm-progress__bar is-${row.semaforo}`} style={{ width: `${row.cumplimientoPct}%` }}>
                      {row.cumplimientoPct}%
                    </div>
                  </div>
                </td>
                <td>{row.vacantesAbiertas}</td>
                <td>{row.tiempoPromedioCierre} días</td>
                <td>
                  <span className={`rqm-badge is-${row.semaforo}`}>{labelForTone(row.semaforo)}</span>
                </td>
              </tr>
            ))}
            {tableRows.length === 0 && (
              <tr>
                <td colSpan={5} className="rqm-table__empty">
                  No hay datos para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function labelForTone(tone: MetricGroupRow["semaforo"]): string {
  if (tone === "good") return "Cumplen ANS (80-100%)";
  if (tone === "warn") return "60-79%";
  return "59% o menos";
}
