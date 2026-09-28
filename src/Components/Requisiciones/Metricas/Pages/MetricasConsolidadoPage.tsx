import * as React from "react";
import "../RequisicionesMetricas.css";
import { useRequisicionesMetricasData } from "../RequisicionesMetricasContext";
import { buildMonthlyMetricsForYear } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { useEncuestaSatisfaccionMetrics } from "../../../../Funcionalidades/Requisiciones/EncuestaSatisfaccion/useEncuestaSatisfaccionMetrics";
import { useEncuestaPeriodoPruebaMetrics } from "../../../../Funcionalidades/Requisiciones/EncuestaPeriodoPrueba/useEncuestaPeriodoPruebaMetrics";
import { RQM_COLORS } from "../rqmChartTheme";

const MONTH_LABELS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const PESO_REQUISICIONES = 70;
const PESO_PERIODO_PRUEBA = 20;
const PESO_SATISFACCION = 10;
const META = 90;

// Conteo mensual comun a los tres componentes: cuantos registros hay y cuantos cumplen.
type MonthCount = { total: number; ok: number };

type ComponenteRow = {
  key: string;
  label: string;
  peso: number;
  tone: "dark" | "light" | "muted";
  porMes: MonthCount[];
};

// Aporte ponderado (0..peso). Sin registros en el periodo el componente aporta 0.
function aporte(count: MonthCount, peso: number): number | null {
  if (!count.total) return null;
  return (count.ok / count.total) * peso;
}

function sumCounts(counts: MonthCount[]): MonthCount {
  return counts.reduce((acc, c) => ({ total: acc.total + c.total, ok: acc.ok + c.ok }), { total: 0, ok: 0 });
}

const pctFormatter = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatPct(value: number | null): string {
  return value === null ? "—" : `${pctFormatter.format(value)} %`;
}

export default function MetricasConsolidadoPage() {
  const { rows, loading: loadingRequisiciones, error: errorRequisiciones } = useRequisicionesMetricasData();

  const requisicionYears = React.useMemo(() => {
    const years = new Set<number>();
    rows.forEach((row) => {
      if (!row.fechaInicioProceso) return;
      const date = new Date(row.fechaInicioProceso);
      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear());
    });
    return years;
  }, [rows]);

  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  // "all" muestra todos los meses del año; un numero (0-11) limita el consolidado a ese mes.
  const [month, setMonth] = React.useState<"all" | number>("all");

  const satisfaccion = useEncuestaSatisfaccionMetrics(year);
  const periodoPrueba = useEncuestaPeriodoPruebaMetrics(year);

  const availableYears = React.useMemo(() => {
    const years = new Set<number>([year, ...requisicionYears, ...satisfaccion.availableYears, ...periodoPrueba.availableYears]);
    return Array.from(years).sort((a, b) => b - a);
  }, [year, requisicionYears, satisfaccion.availableYears, periodoPrueba.availableYears]);

  const componentes = React.useMemo<ComponenteRow[]>(() => {
    const requisicionesMes = buildMonthlyMetricsForYear(rows, year);

    return [
      {
        key: "requisiciones",
        label: `Componente individual - Requisiciones ${PESO_REQUISICIONES}%`,
        peso: PESO_REQUISICIONES,
        tone: "dark",
        porMes: requisicionesMes.map((m) => ({ total: m.total, ok: m.cumplenAns })),
      },
      {
        key: "periodoPrueba",
        label: `Componente grupal - Periodo de prueba ${PESO_PERIODO_PRUEBA}%`,
        peso: PESO_PERIODO_PRUEBA,
        tone: "light",
        porMes: periodoPrueba.porMes.map((m) => ({ total: m.total, ok: m.aprobadas })),
      },
      {
        key: "satisfaccion",
        label: `Componente grupal - Encuesta satisfacción ${PESO_SATISFACCION}%`,
        peso: PESO_SATISFACCION,
        tone: "muted",
        porMes: satisfaccion.porMes.map((m) => ({ total: m.total, ok: m.aprobadas })),
      },
    ];
  }, [rows, year, periodoPrueba.porMes, satisfaccion.porMes]);

  // Sin mes seleccionado se muestran los meses desde enero hasta el ultimo con informacion en cualquier componente.
  const monthIndexes = React.useMemo(() => {
    if (month !== "all") return [month];

    let last = -1;
    componentes.forEach((c) => {
      c.porMes.forEach((m, index) => {
        if (m.total > 0 && index > last) last = index;
      });
    });
    return Array.from({ length: last + 1 }, (_, index) => index);
  }, [componentes, month]);

  const tabla = React.useMemo(() => {
    const porComponente = componentes.map((c) => ({
      ...c,
      valores: monthIndexes.map((index) => aporte(c.porMes[index], c.peso)),
      total: aporte(sumCounts(monthIndexes.map((index) => c.porMes[index])), c.peso),
    }));

    const totalMes = monthIndexes.map((_, col) => porComponente.reduce((acc, c) => acc + (c.valores[col] ?? 0), 0));
    const totalGeneral = porComponente.reduce((acc, c) => acc + (c.total ?? 0), 0);

    return { porComponente, totalMes, totalGeneral };
  }, [componentes, monthIndexes]);

  const loading = loadingRequisiciones || satisfaccion.loading || periodoPrueba.loading;
  const error = errorRequisiciones || satisfaccion.error || periodoPrueba.error;
  const hasData = monthIndexes.some((index) => componentes.some((c) => c.porMes[index].total > 0));
  const periodoLabel = month === "all" ? String(year) : `${MONTH_LABELS[month].toLowerCase()} de ${year}`;

  const renderRow = (label: string, tone: string, valores: React.ReactNode[], total: React.ReactNode, cellClass?: (col: number) => string) => (
    <div className="rqm-cons-row" key={label}>
      <div className={`rqm-cons-label rqm-cons-label--${tone}`}>{label}</div>
      <div className="rqm-cons-table-wrap">
        <table className={`rqm-cons-table rqm-cons-table--${tone}`}>
          <thead>
            <tr>
              {monthIndexes.map((index) => (
                <th key={index}>{MONTH_LABELS[index]}</th>
              ))}
              <th className="rqm-cons-total">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {valores.map((valor, col) => (
                <td key={monthIndexes[col]} className={cellClass?.(col)}>
                  {valor}
                </td>
              ))}
              <td className="rqm-cons-total">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="rqm-shell">
      {(loading || error) && <section className="rqm-feedback">{loading ? "Cargando consolidado..." : error}</section>}

      <section className="rqm-filters" aria-label="Filtros del consolidado">
        <label className="rqm-filter-field">
          <span>Año</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="rqm-filter-field">
          <span>Mes</span>
          <select value={month} onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <option value="all">*Todos*</option>
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rqm-cons-layout">
        <article className="rqm-card rqm-cons-gauge">
          <div className="rqm-card__header">
            <h2>% Total ponderado</h2>
          </div>
          <ConsolidadoGauge value={hasData ? tabla.totalGeneral : 0} meta={META} />
          <strong className={`rqm-cons-gauge__value ${tabla.totalGeneral >= META ? "is-good" : "is-risk"}`}>
            {formatPct(hasData ? tabla.totalGeneral : null)}
          </strong>
          <span className="rqm-cons-gauge__meta">Meta {formatPct(META)}</span>
        </article>

        <article className="rqm-card rqm-cons-body">
          {!hasData ? (
            <p className="rqm-cons-empty">No hay información registrada para {periodoLabel}.</p>
          ) : (
            <>
              {tabla.porComponente.map((c) =>
                renderRow(
                  c.label,
                  c.tone,
                  c.valores.map((v) => formatPct(v)),
                  <strong>{formatPct(c.total)}</strong>
                )
              )}

              {renderRow(
                "Total ponderado 100%",
                "dark",
                tabla.totalMes.map((v) => formatPct(v)),
                <strong>{formatPct(tabla.totalGeneral)}</strong>,
                (col) => (tabla.totalMes[col] >= META ? "rqm-cons-cell--good" : "rqm-cons-cell--risk")
              )}

              {renderRow(
                "Meta",
                "dark",
                monthIndexes.map(() => formatPct(META)),
                <strong>{formatPct(META)}</strong>
              )}

              <p className="rqm-cons-note">
                Los valores de cada componente son su aporte ponderado. Un mes sin registros en un componente se muestra como "—" y aporta 0 al total.
              </p>
            </>
          )}
        </article>
      </section>
    </div>
  );
}

type GaugeProps = { value: number; meta: number };

// Medidor semicircular 0-100 con bandas de color y marca de la meta.
function ConsolidadoGauge({ value, meta }: GaugeProps) {
  const cx = 100;
  const cy = 100;
  const r = 80;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const point = (pct: number, radius: number) => {
    const angle = Math.PI * (1 - clamp(pct) / 100);
    return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
  };
  const arc = (from: number, to: number) => {
    const a = point(from, r);
    const b = point(to, r);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };

  const needle = point(value, r - 18);
  const metaInner = point(meta, r - 22);
  const metaOuter = point(meta, r + 22);

  return (
    <svg className="rqm-cons-gauge__svg" viewBox="0 0 200 115" role="img" aria-label={`Total ponderado ${value.toFixed(2)} %, meta ${meta} %`}>
      <path d={arc(0, 80)} stroke={RQM_COLORS.risk} strokeOpacity={0.35} strokeWidth={36} fill="none" />
      <path d={arc(80, meta)} stroke={RQM_COLORS.warn} strokeOpacity={0.4} strokeWidth={36} fill="none" />
      <path d={arc(meta, 100)} stroke={RQM_COLORS.good} strokeOpacity={0.45} strokeWidth={36} fill="none" />
      <line x1={metaInner.x} y1={metaInner.y} x2={metaOuter.x} y2={metaOuter.y} stroke={RQM_COLORS.text} strokeWidth={2} />
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={RQM_COLORS.text} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={7} fill={RQM_COLORS.text} />
    </svg>
  );
}
