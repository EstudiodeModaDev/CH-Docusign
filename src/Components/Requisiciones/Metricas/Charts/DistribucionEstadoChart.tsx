import { Bar } from "react-chartjs-2";
import type { EstadoDistributionRow } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { ESTADO_COLORS, ESTADO_FALLBACK_COLOR } from "../rqmChartTheme";

type Props = {
  data: EstadoDistributionRow[];
};

export default function DistribucionEstadoChart({ data }: Props) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="rqm-chart-canvas">
      <Bar
        data={{
          labels: [""],
          datasets: data.map((row) => ({
            label: row.estado,
            data: [row.count],
            backgroundColor: ESTADO_COLORS[row.estado] ?? ESTADO_FALLBACK_COLOR,
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 40,
          })),
        }}
        options={{
          indexAxis: "y" as const,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, display: false, grid: { display: false } },
            y: { stacked: true, display: false, grid: { display: false } },
          },
          plugins: {
            legend: { position: "bottom" as const, labels: { boxWidth: 10, padding: 14 } },
            tooltip: {
              callbacks: {
                label: (item) => {
                  const value = typeof item.raw === "number" ? item.raw : 0;
                  const pct = total ? Math.round((value / total) * 100) : 0;
                  return `${item.dataset.label}: ${value} (${pct}%)`;
                },
              },
            },
          },
          animation: { duration: 500 },
        }}
      />
    </div>
  );
}
