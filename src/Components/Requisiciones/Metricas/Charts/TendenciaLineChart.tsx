import { Line } from "react-chartjs-2";
import type { MonthlyMetricRow } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { RQM_COLORS } from "../rqmChartTheme";

type Props = {
  data: MonthlyMetricRow[];
  targetPct?: number;
};

export default function TendenciaLineChart({ data, targetPct = 80 }: Props) {
  return (
    <div className="rqm-chart-canvas">
      <Line
        data={{
          labels: data.map((row) => row.month),
          datasets: [
            {
              label: "% Cumplimiento",
              data: data.map((row) => row.cumplimientoPct),
              borderColor: RQM_COLORS.brand,
              backgroundColor: `${RQM_COLORS.brand}26`,
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: RQM_COLORS.brand,
              borderWidth: 2.5,
            },
            {
              label: `Meta ${targetPct}%`,
              data: data.map(() => targetPct),
              borderColor: RQM_COLORS.textMuted,
              borderDash: [5, 4],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: { min: 0, max: 100, grid: { color: RQM_COLORS.grid }, ticks: { callback: (value) => `${value}%` } },
          },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.parsed.y}%` } },
          },
          animation: { duration: 500 },
        }}
      />
    </div>
  );
}
