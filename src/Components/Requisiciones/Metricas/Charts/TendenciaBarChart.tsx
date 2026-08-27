import { Bar } from "react-chartjs-2";
import type { MonthlyMetricRow } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { RQM_COLORS } from "../rqmChartTheme";

type Props = {
  data: MonthlyMetricRow[];
};

export default function TendenciaBarChart({ data }: Props) {
  return (
    <div className="rqm-chart-canvas">
      <Bar
        data={{
          labels: data.map((row) => row.month),
          datasets: [
            {
              label: "Requisiciones",
              data: data.map((row) => row.total),
              backgroundColor: RQM_COLORS.brand,
              borderRadius: 6,
              maxBarThickness: 28,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: RQM_COLORS.grid } },
          },
          plugins: { legend: { display: false } },
          animation: { duration: 500 },
        }}
      />
    </div>
  );
}
