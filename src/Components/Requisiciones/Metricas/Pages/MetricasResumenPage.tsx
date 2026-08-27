import "../RequisicionesMetricas.css";
import { useRequisicionesMetricasData } from "../RequisicionesMetricasContext";
import AnsMeterChart from "../Charts/AnsMeterChart";
import EmbudoChart from "../Charts/EmbudoChart";
import RequisicionesPorAnalistaChart, { ANALISTA_CHART_VISIBLE_LIMIT } from "../Charts/RequisicionesPorAnalistaChart";
import WatchlistCard from "../WatchlistCard";
import TendenciaLineChart from "../Charts/TendenciaLineChart";

export default function MetricasResumenPage() {
  const { metrics } = useRequisicionesMetricasData();

  return (
    <div className="rqm-shell">
      <section className="rqm-grid">
        <article className="rqm-card rqm-card--gauge">
          <div className="rqm-card__header">
            <h2>Cumplimiento ANS</h2>
          </div>

          <div className="rqm-card__body rqm-card__body--center">
            <AnsMeterChart pct={metrics.resumen.cumplimientoAnsPct} />
            <div className="rqm-meter-ticks">
              <span>0</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>

            <ul className="rqm-status-list">
              <li>
                <span className="rqm-dot rqm-dot--good" />
                Cumplimiento ANS
                <strong>{metrics.resumen.cumplenAns}</strong>
              </li>
              <li>
                <span className="rqm-dot rqm-dot--warn" />
                En riesgo
                <strong>{metrics.resumen.enRiesgoAns}</strong>
              </li>
              <li>
                <span className="rqm-dot rqm-dot--risk" />
                Vencidas
                <strong>{metrics.resumen.vencidasAns}</strong>
              </li>
            </ul>
          </div>
        </article>

        <article className="rqm-card">
          <div className="rqm-card__header">
            <h2>Embudo de Selección</h2>
          </div>
          <EmbudoChart data={metrics.embudo} />
        </article>

        <article className="rqm-card">
          <div className="rqm-card__header">
            <div>
              <h2>Requisiciones por analista</h2>
              <p>Top {ANALISTA_CHART_VISIBLE_LIMIT} por cantidad de requisiciones</p>
            </div>
          </div>
          <RequisicionesPorAnalistaChart data={metrics.porAnalista} />
        </article>

        <article className="rqm-card">
          <div className="rqm-card__header">
            <div>
              <h2>Requisiciones por mes</h2>
            </div>
          </div>
          <TendenciaLineChart data={metrics.tendenciaMensual} />
        </article>
      </section>

      <WatchlistCard items={metrics.watchlist} />
    </div>
  );
}
