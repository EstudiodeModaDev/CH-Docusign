import "./RequisicionesMetricas.css";
import type { RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { IconAlertTriangle, IconBriefcase, IconClock, IconXCircle } from "./icons";

type Props = {
  metrics: RequisicionesMetrics;
};

export default function KPIGenericos(props: Props) {
  const {metrics,} = props;

  return (

    <section className="rqm-kpis" aria-label="Indicadores principales">
      <article className="rqm-mini-card">
        <span className="rqm-mini-card__icon"><IconBriefcase size={16} /></span>
        <strong>{metrics.resumen.vacantesAbiertas}</strong>
        <span>Vacantes abiertas</span>
      </article>
      <article className="rqm-mini-card">
        <span className="rqm-mini-card__icon"><IconClock size={16} /></span>
        <strong>{metrics.resumen.diasPromedioCierre}</strong>
        <span>Días promedio de cierre</span>
      </article>
      <article className="rqm-mini-card">
        <span className="rqm-mini-card__icon is-warn"><IconAlertTriangle size={16} /></span>
        <strong className="is-warn">{metrics.resumen.enRiesgoAns}</strong>
        <span>Vacantes en riesgo</span>
      </article>
      <article className="rqm-mini-card">
        <span className="rqm-mini-card__icon is-risk"><IconXCircle size={16} /></span>
        <strong className="is-risk">{metrics.resumen.vencidasAns}</strong>
        <span>Vacantes vencidas</span>
      </article>
    </section>

  );
}