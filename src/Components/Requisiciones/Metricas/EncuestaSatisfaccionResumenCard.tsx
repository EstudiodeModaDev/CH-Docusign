import "./RequisicionesMetricas.css";
import AnsMeterChart from "./Charts/AnsMeterChart";

type Props = {
  totalEncuestas: number;
  totalAprobadas: number;
  title: string;
};

export default function EncuestaSatisfaccionResumenCard({ totalEncuestas, totalAprobadas, title }: Props) {
  const pctAprobadas = totalEncuestas > 0 ? Math.round((totalAprobadas / totalEncuestas) * 100) : 0;
  const noAprobadas = totalEncuestas - totalAprobadas;

  return (
    <article className="rqm-card rqm-card--gauge">
      <div className="rqm-card__header">
        <div>
          <h2>{title}</h2>
          <p>{totalEncuestas} encuestas registradas</p>
        </div>
        <span className="rqm-pill">{pctAprobadas}%</span>
      </div>

      <div className="rqm-card__body rqm-card__body--center">
        <AnsMeterChart pct={pctAprobadas} />
        <div className="rqm-meter-ticks">
          <span>0</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>

        <ul className="rqm-status-list">
          <li>
            <span className="rqm-dot rqm-dot--good" />
            Aprobadas
            <strong>{totalAprobadas}</strong>
          </li>
          <li>
            <span className="rqm-dot rqm-dot--risk" />
            No aprobadas
            <strong>{noAprobadas}</strong>
          </li>
        </ul>
      </div>
    </article>
  );
}
