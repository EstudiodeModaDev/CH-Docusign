import { Bar } from "react-chartjs-2";
import type { Chart, Plugin } from "chart.js";
import { RQM_COLORS, colorForTone, toneForPct } from "../rqmChartTheme";

type Props = {
  pct: number;
};

const thresholdLinesPlugin: Plugin<"bar"> = {
  id: "rqmThresholdLines",
  afterDraw(chart: Chart) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!chartArea || !xScale) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    [60, 80].forEach((value) => {
      const x = xScale.getPixelForValue(value);
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top + 2);
      ctx.lineTo(x, chartArea.bottom - 2);
      ctx.stroke();
    });
    ctx.restore();
  },
};

export default function AnsMeterChart({ pct }: Props) {
  const tone = toneForPct(pct);

  const data = {
    labels: [""],
    datasets: [
      { label: "Cumplimiento", data: [pct], backgroundColor: colorForTone(tone), borderRadius: 10, barThickness: 30 },
      { label: "Restante", data: [100 - pct], backgroundColor: RQM_COLORS.track, borderRadius: 10, barThickness: 30 },
    ],
  };

  return (
    <div className="rqm-chart-canvas rqm-chart-canvas--meter">
      <Bar
        data={data}
        options={{
          indexAxis: "y" as const,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { min: 0, max: 100, stacked: true, display: false, grid: { display: false } },
            y: { stacked: true, display: false, grid: { display: false } },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              filter: (item) => item.datasetIndex === 0,
              callbacks: { label: (item) => `Cumplimiento: ${item.parsed.x}%`, title: () => "" },
            },
          },
          animation: { duration: 500 },
        }}
        plugins={[thresholdLinesPlugin]}
      />
    </div>
  );
}
