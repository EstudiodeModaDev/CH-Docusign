import * as React from "react";
import "./RequisicionesMetricas.css";
import { Bar, Cell, ComposedChart, Funnel, FunnelChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type {  RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #d8daf3",
  background: "#ffffff",
  boxShadow: "0 14px 26px rgba(72, 60, 132, 0.14)",
};



type Props = {
  metrics: RequisicionesMetrics;

};

export default function RequisicionTableroCentral(props: Props) {
  const {
    metrics,
  } = props;


  const gaugeData = React.useMemo(() => {
    const cumplimiento = metrics.resumen.cumplimientoAnsPct;

    return [
      { name: "Cumplimiento", value: cumplimiento, fill: "#22c55e" },
      { name: "Pendiente", value: Math.max(0, 100 - cumplimiento), fill: "#e9eef8" },
    ];
  }, [metrics.resumen.cumplimientoAnsPct]);

  const funnelData = React.useMemo(
    () => [
      { name: "Recibidas", value: metrics.embudo.recibidas, fill: "#88d2ff" },
      { name: "Seleccionados", value: metrics.embudo.seleccionadas, fill: "#8b5cf6" },
      { name: "Entrevistas", value: metrics.embudo.entrevistas, fill: "#7fd8d0" },
      { name: "Finalistas", value: metrics.embudo.finalistas, fill: "#88cf72" },
    ],
    [metrics.embudo]
  );

  const trendData = React.useMemo(
    () =>
      metrics.tendenciaMensual.map((item) => ({
        month: item.month,
        total: item.total,
        ans: item.cumplimientoPct,
      })),
    [metrics.tendenciaMensual]
  );

  return (
    <section className="rqm-grid">

      {/*COMPONENTE CUMPLIMIENTO POR ANS */}
      <article className="rqm-card rqm-card--gauge">
        <div className="rqm-card__header">
          <h2>Cumplimiento ANS</h2>
        </div>

        <div className="rqm-card__body rqm-card__body--center">
          <div className="rqm-gauge">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="90%"
                  innerRadius={70}
                  outerRadius={94}
                  cornerRadius={8}
                  stroke="none"
                >
                  {gaugeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="rqm-gauge__center">
              <strong>{metrics.resumen.cumplimientoAnsPct}%</strong>
              <span>Cumplimiento ANS</span>
            </div>
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

      {/* COMPONENTE EMBUDO DE SELECCIÓN */}
      <article className="rqm-card">

        
        <div className="rqm-card__header">
          <h2>Embudo de Selección</h2>
        </div>

        <div className="rqm-card__body rqm-card__body--split">
          <div className="rqm-chart">
            <ResponsiveContainer width="100%" height={220}>
              <FunnelChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive={false} />
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          <ul className="rqm-funnel-list">
            {funnelData.map((item) => (
              <li key={item.name}>
                <strong>{item.value}</strong>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* COMPONENTE CUMPLIMIENTO ANS*/}
      <article className="rqm-card">
        <div className="rqm-card__header">
          <div>
            <h2>Cumplimiento de ANS</h2>
            <p>Requisiciones que cumplen ANS vs todas</p>
          </div>
          <span className="rqm-pill">{metrics.resumen.cumplimientoAnsPct}%</span>
        </div>

        <div className="rqm-chart rqm-chart--tall">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={trendData}>
              <Tooltip contentStyle={tooltipStyle} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
              <Bar yAxisId="left" dataKey="total" fill="#32c36d" radius={[8, 8, 0, 0]} barSize={18} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ans"
                stroke="#26a65b"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ffffff", stroke: "#26a65b", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
