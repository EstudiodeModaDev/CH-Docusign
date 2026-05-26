import React from "react";
import type { detalleRequisicion, pasoRequisicion } from "../../../../models/Requisiciones/pasos";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";

export type MetricTone = "good" | "warn" | "risk";

export type MetricGroupRow = {
  label: string;
  cumplimientoPct: number;
  vacantesAbiertas: number;
  tiempoPromedioCierre: number;
  cumplenAns: number;
  total: number;
  semaforo: MetricTone;
};

export type MonthlyMetricRow = {
  month: string;
  total: number;
  cumplenAns: number;
  cumplimientoPct: number;
};

export type FunnelMetrics = {
  recibidas: number;
  entrevistas: number;
  finalistas: number;
  seleccionadas: number;
};

export type SummaryMetrics = {
  total: number;
  cumplimientoAnsPct: number;
  cumplenAns: number;
  enRiesgoAns: number;
  vencidasAns: number;
  diasPromedioCierre: number;
  vacantesAbiertas: number;
};

export type RequisicionesMetrics = {
  resumen: SummaryMetrics;
  embudo: FunnelMetrics;
  tendenciaMensual: MonthlyMetricRow[];
  porDireccion: MetricGroupRow[];
  porCiudad: MetricGroupRow[];
  porAnalista: MetricGroupRow[];
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const EMPTY_METRICS: RequisicionesMetrics = {
  resumen: {
    total: 0,
    cumplimientoAnsPct: 0,
    cumplenAns: 0,
    enRiesgoAns: 0,
    vencidasAns: 0,
    diasPromedioCierre: 0,
    vacantesAbiertas: 0,
  },
  embudo: {
    recibidas: 0,
    entrevistas: 0,
    finalistas: 0,
    seleccionadas: 0,
  },
  tendenciaMensual: MONTHS.map((month) => ({
    month,
    total: 0,
    cumplenAns: 0,
    cumplimientoPct: 0,
  })),
  porDireccion: [],
  porCiudad: [],
  porAnalista: [],
};

type DetailsByRequisicion = Record<string, detalleRequisicion[]>;
type TemplatesById = Record<string, pasoRequisicion>;

export function useRequisicionesMetrics(
  rows: requisiciones[],
  detailsByRequisicion: DetailsByRequisicion,
  templatesById: TemplatesById,
  now = new Date()
): RequisicionesMetrics {
  return React.useMemo(
    () => buildRequisicionesMetrics(rows, detailsByRequisicion, templatesById, now),
    [rows, detailsByRequisicion, templatesById, now]
  );
}

export function buildRequisicionesMetrics(
  rows: requisiciones[],
  detailsByRequisicion: DetailsByRequisicion,
  templatesById: TemplatesById,
  now = new Date()
): RequisicionesMetrics {
  if (!rows.length) return EMPTY_METRICS;

  const resumen = buildSummaryMetrics(rows, now);
  const embudo = buildFunnelMetrics(rows, detailsByRequisicion, templatesById);
  const tendenciaMensual = buildMonthlyMetrics(rows);

  return {
    resumen,
    embudo,
    tendenciaMensual,
    porDireccion: buildGroupedMetrics(rows, "direccion", now),
    porCiudad: buildGroupedMetrics(rows, "Ciudad", now),
    porAnalista: buildGroupedMetrics(rows, "nombreProfesional", now),
  };
}

function buildSummaryMetrics(rows: requisiciones[], now: Date): SummaryMetrics {
  const cumplenAns = rows.filter(isCumpleAns).length;
  const vacantesAbiertas = rows.filter(isOpenRequisition).length;
  const vencidasAns = rows.filter((row) => isExpiredAns(row, now)).length;
  const enRiesgoAns = rows.filter((row) => isRiskAns(row, now)).length;
  const diasPromedioCierre = average(rows.map(getClosingDays).filter(isNumber));

  return {
    total: rows.length,
    cumplimientoAnsPct: toPercent(cumplenAns, rows.length),
    cumplenAns,
    enRiesgoAns,
    vencidasAns,
    diasPromedioCierre,
    vacantesAbiertas,
  };
}

function buildFunnelMetrics(rows: requisiciones[], detailsByRequisicion: DetailsByRequisicion, templatesById: TemplatesById): FunnelMetrics {
  let entrevistas = 0;
  let finalistas = 0;
  let seleccionadas = 0;
  let recibidas = 0

  rows.forEach((row) => {
    const requisicionId = String(row.Id ?? "").trim();
    if (!requisicionId) return;

    const details = detailsByRequisicion[requisicionId] ?? [];

    details.forEach((detail) => {
      if (!isCompletedDetail(detail)) return;

      const templateId = String(detail.Title ?? "").trim();
      const template = templatesById[templateId];
      const stage = resolveFunnelStage(template);

      if (stage === "entrevista"){entrevistas += Number(detail.Notas)}
      if (stage === "recibidas"){recibidas += Number(detail.Notas)}
      if (stage === "finalista") finalistas += Number(detail.Notas)      
      if (stage === "seleccionada") seleccionadas += Number(detail.Notas);
    });


  });

  return {
    recibidas,
    entrevistas,
    finalistas,
    seleccionadas,
  };
}

function isCompletedDetail(detail: detalleRequisicion): boolean {
  const estado = normalize(detail.Estado);
  return estado === "completado" || estado === "omitido";
}

function resolveFunnelStage(template?: pasoRequisicion): "entrevista" | "finalista" | "seleccionada" | "recibidas" | null {
  if (!template) return null;

  if (template.Id === "4") {
    return "seleccionada";
  }

  if (template.Id === "7") {
    return "finalista";
  }

  if (template.Id === "5") {
    return "entrevista";
  }

  if (template.Id === "3") {
    return "recibidas";
  }

  return null;
}

function buildMonthlyMetrics(rows: requisiciones[]): MonthlyMetricRow[] {
  const bucket = MONTHS.map((month) => ({
    month,
    total: 0,
    cumplenAns: 0,
    cumplimientoPct: 0,
  }));

  rows.forEach((row) => {
    const date = pickStartDate(row);
    if (!date) return;

    const monthIndex = date.getMonth();
    bucket[monthIndex].total += 1;

    if (isCumpleAns(row)) {
      bucket[monthIndex].cumplenAns += 1;
    }
  });

  return bucket.map((item) => ({
    ...item,
    cumplimientoPct: toPercent(item.cumplenAns, item.total),
  }));
}

function buildGroupedMetrics(
  rows: requisiciones[],
  field: keyof Pick<requisiciones, "direccion" | "Ciudad" | "nombreProfesional">,
  now: Date
): MetricGroupRow[] {
  const groups = new Map<string, requisiciones[]>();

  rows.forEach((row) => {
    const raw = row[field];
    const key = typeof raw === "string" && raw.trim() ? raw.trim() : "Sin dato";
    const current = groups.get(key);

    if (current) {
      current.push(row);
      return;
    }

    groups.set(key, [row]);
  });

  return [...groups.entries()]
    .map(([label, groupedRows]) => buildGroupRow(label, groupedRows, now))
    .sort((a, b) => b.total - a.total);
}

function buildGroupRow(label: string, rows: requisiciones[], now: Date): MetricGroupRow {
  const total = rows.length;
  const cumplenAns = rows.filter(isCumpleAns).length;
  const vacantesAbiertas = rows.filter(isOpenRequisition).length;
  const tiempoPromedioCierre = average(rows.map(getClosingDays).filter(isNumber));
  const cumplimientoPct = toPercent(cumplenAns, total);

  return {
    label,
    cumplimientoPct,
    vacantesAbiertas,
    tiempoPromedioCierre,
    cumplenAns,
    total,
    semaforo: getTone(cumplimientoPct, rows, now),
  };
}

function getTone(cumplimientoPct: number, rows: requisiciones[], now: Date): MetricTone {
  if (rows.some((row) => isExpiredAns(row, now)) || cumplimientoPct <= 59) return "risk";
  if (rows.some((row) => isRiskAns(row, now)) || cumplimientoPct <= 79) return "warn";
  return "good";
}

function isCumpleAns(row: requisiciones): boolean {
  const value = normalize(row.cumpleANS);
  return value === "si" || value === "sí" || value === "cumple" || value === "ok" || value === "true" || value === "1";
}

function isOpenRequisition(row: requisiciones): boolean {
  const state = normalize(row.Estado);
  return state !== "cerrado" && state !== "cancelado";
}

function isExpiredAns(row: requisiciones, now: Date): boolean {
  if (!isOpenRequisition(row)) return false;
  const deadline = parseDate(row.fechaLimite);
  if (!deadline) return false;
  return deadline.getTime() < now.getTime();
}

function isRiskAns(row: requisiciones, now: Date): boolean {
  if (!isOpenRequisition(row)) return false;
  if (isExpiredAns(row, now)) return false;

  const deadline = parseDate(row.fechaLimite);
  if (!deadline) return false;

  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
}

function getClosingDays(row: requisiciones): number | null {
  const start = pickStartDate(row);
  const end = parseDate(row.fechaIngreso);

  if (!start || !end) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function pickStartDate(row: requisiciones): Date | null {
  return parseDate(row.fechaInicioProceso);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function average(values: number[]): number {
  if (!values.length) return 0;
  const total = values.reduce((acc, value) => acc + value, 0);
  return Math.round(total / values.length);
}

function toPercent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function isNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}
