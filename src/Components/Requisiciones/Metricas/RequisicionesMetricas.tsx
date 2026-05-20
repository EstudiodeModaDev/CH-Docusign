import * as React from "react";
import "./RequisicionesMetricas.css";
import { Bar, Cell, ComposedChart, Funnel, FunnelChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { MetricGroupRow, RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #d8daf3",
  background: "#ffffff",
  boxShadow: "0 14px 26px rgba(72, 60, 132, 0.14)",
};

type GroupKey = "direccion" | "ciudad" | "analista";

type Props = {
  loading: boolean;
  error: string | null;
  rowsCount: number;
  metrics: RequisicionesMetrics;
  anio: string;
  cargo: string;
  ciudad: string;
  analista: string;
  direccion: string;
  yearOptions: desplegablesOption[];
  cargoOptions: desplegablesOption[];
  ciudadOptions: desplegablesOption[];
  analistaOptions: desplegablesOption[];
  direccionOptions: desplegablesOption[];
  setAnio: (value: string) => void;
  setCargo: (value: string) => void;
  setCiudad: (value: string) => void;
  setAnalista: (value: string) => void;
  setDireccion: (value: string) => void;
};

export default function RequisicionesMetricasPage(props: Props) {
  const {
    loading,
    error,
    rowsCount,
    metrics,
    anio,
    cargo,
    ciudad,
    analista,
    direccion,
    yearOptions,
    cargoOptions,
    ciudadOptions,
    analistaOptions,
    direccionOptions,
    setAnio,
    setCargo,
    setCiudad,
    setAnalista,
    setDireccion,
  } = props;

  const [groupBy, setGroupBy] = React.useState<GroupKey>("direccion");

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
      { name: "Entrevistas", value: metrics.embudo.entrevistas, fill: "#7fd8d0" },
      { name: "Finalistas", value: metrics.embudo.finalistas, fill: "#88cf72" },
      { name: "Seleccionados", value: metrics.embudo.seleccionadas, fill: "#8b5cf6" },
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

  const tableRows = React.useMemo<MetricGroupRow[]>(() => {
    if (groupBy === "ciudad") return metrics.porCiudad;
    if (groupBy === "analista") return metrics.porAnalista;
    return metrics.porDireccion;
  }, [groupBy, metrics.porAnalista, metrics.porCiudad, metrics.porDireccion]);

  const groupLabel = groupBy === "ciudad" ? "Ciudad" : groupBy === "analista" ? "Analista" : "Dirección";

  return (
    <div className="rqm-page">
      <div className="rqm-shell">
        <section className="rqm-filters" aria-label="Filtros del tablero">
          <label className="rqm-filter-field">
            <span>Año</span>
            <select value={anio} onChange={(e) => setAnio(e.target.value)}>
              {yearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rqm-filter-field">
            <span>Dirección</span>
            <select value={direccion} onChange={(e) => setDireccion(e.target.value)}>
              {direccionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rqm-filter-field">
            <span>Ciudad</span>
            <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
              {ciudadOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rqm-filter-field">
            <span>Cargo</span>
            <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
              {cargoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rqm-filter-field">
            <span>Analista</span>
            <select value={analista} onChange={(e) => setAnalista(e.target.value)}>
              {analistaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {(loading || error) && <section className="rqm-feedback">{loading ? "Cargando métricas..." : error}</section>}

        <section className="rqm-grid">
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

        <section className="rqm-kpis" aria-label="Indicadores principales">
          <article className="rqm-mini-card">
            <strong>{metrics.resumen.vacantesAbiertas}</strong>
            <span>Vacantes abiertas</span>
          </article>
          <article className="rqm-mini-card">
            <strong>{metrics.resumen.diasPromedioCierre}</strong>
            <span>Días promedio de cierre</span>
          </article>
          <article className="rqm-mini-card">
            <strong className="is-warn">{metrics.resumen.enRiesgoAns}</strong>
            <span>Vacantes en riesgo</span>
          </article>
          <article className="rqm-mini-card">
            <strong className="is-risk">{metrics.resumen.vencidasAns}</strong>
            <span>Vacantes vencidas</span>
          </article>
        </section>

        <section className="rqm-card rqm-table-card">
          <div className="rqm-card__header rqm-card__header--stack">
            <div className="rqm-summary-line">
              <h2>% Cumplimiento ANS por Dirección, Ciudad y Analista</h2>
              <span>{rowsCount} requisiciones analizadas</span>
            </div>
            <div className="rqm-tabs" role="tablist" aria-label="Vista de agrupación">
              <button type="button" className={groupBy === "direccion" ? "is-active" : ""} onClick={() => setGroupBy("direccion")}>
                Dirección
              </button>
              <button type="button" className={groupBy === "ciudad" ? "is-active" : ""} onClick={() => setGroupBy("ciudad")}>
                Ciudad
              </button>
              <button type="button" className={groupBy === "analista" ? "is-active" : ""} onClick={() => setGroupBy("analista")}>
                Analista
              </button>
            </div>
          </div>

          <div className="rqm-table-wrap">
            <table className="rqm-table">
              <thead>
                <tr>
                  <th>{groupLabel}</th>
                  <th>% Cumplimiento</th>
                  <th>Vacantes Abiertas</th>
                  <th>Tiempo Promedio de Cierre</th>
                  <th>Semáforo</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>
                      <div className="rqm-progress">
                        <div className={`rqm-progress__bar is-${row.semaforo}`} style={{ width: `${row.cumplimientoPct}%` }}>
                          {row.cumplimientoPct}%
                        </div>
                      </div>
                    </td>
                    <td>{row.vacantesAbiertas}</td>
                    <td>{row.tiempoPromedioCierre} días</td>
                    <td>
                      <span className={`rqm-badge is-${row.semaforo}`}>{labelForTone(row.semaforo)}</span>
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="rqm-table__empty">
                      No hay datos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function labelForTone(tone: MetricGroupRow["semaforo"]): string {
  if (tone === "good") return "Cumplen ANS (80-100%)";
  if (tone === "warn") return "60-79%";
  return "59% o menos";
}
