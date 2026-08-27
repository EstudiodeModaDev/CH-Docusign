import { Bar } from "react-chartjs-2";
import type { EncuestaSatisfaccionMesRow } from "../../../../Funcionalidades/Requisiciones/EncuestaSatisfaccion/useEncuestaSatisfaccionMetrics";
import { RQM_COLORS } from "../rqmChartTheme";

type Props = {
  data: EncuestaSatisfaccionMesRow[];
};

export default function EncuestaSatisfaccionMesChart({ data }: Props) {
  return (
    <div className="rqm-chart-canvas">
      <Bar
        data={{
          labels: data.map((row) => row.month),
          datasets: [
            {
              label: "Aprobadas",
              data: data.map((row) => row.aprobadas),
              backgroundColor: RQM_COLORS.good,
              stack: "encuestas",
              maxBarThickness: 28,
            },
            {
              label: "No aprobadas",
              data: data.map((row) => row.total - row.aprobadas),
              backgroundColor: RQM_COLORS.risk,
              stack: "encuestas",
              maxBarThickness: 28,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: RQM_COLORS.grid } },
          },
          plugins: {
            legend: { position: "bottom" as const, labels: { boxWidth: 10, padding: 14 } },
          },
          animation: { duration: 500 },
        }}
      />
    </div>
  );
}
