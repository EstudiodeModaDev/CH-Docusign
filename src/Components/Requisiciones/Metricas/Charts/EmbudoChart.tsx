import { Bar } from "react-chartjs-2";
import type { FunnelMetrics } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { FUNNEL_COLORS } from "../rqmChartTheme";

type Props = {
  data: FunnelMetrics;
};

const STAGES: { key: keyof FunnelMetrics; label: string }[] = [
  { key: "recibidas", label: "Recibidas" },
  { key: "entrevistas", label: "Entrevistas" },
  { key: "finalistas", label: "Finalistas" },
  { key: "seleccionadas", label: "Seleccionadas" },
];

export default function EmbudoChart({ data }: Props) {
  const values = STAGES.map((stage) => data[stage.key]);

  return (
    <div className="rqm-card__body--split">
      <div className="rqm-chart-canvas">
        <Bar
          data={{
            labels: STAGES.map((stage) => stage.label),
            datasets: [{ data: values, backgroundColor: FUNNEL_COLORS, borderRadius: 8, barThickness: 26 }],
          }}
          options={{
            indexAxis: "y" as const,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { display: false, grid: { display: false } },
              y: { grid: { display: false }, ticks: { font: { size: 12, weight: 600 as const } } },
            },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (item) => `${item.parsed.x} candidatos` } },
            },
            animation: { duration: 500 },
          }}
        />
      </div>

      <ul className="rqm-funnel-list">
        {STAGES.map((stage) => (
          <li key={stage.key}>
            <strong>{data[stage.key]}</strong>
            <span>{stage.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
