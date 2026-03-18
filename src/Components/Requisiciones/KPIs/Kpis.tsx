import * as React from "react";
import "./kpis.css";
import type { requisiciones } from "../../../models/requisiciones";

export type ReqMetrics = {
  conDiasDeRetraso: number;
  noCumplenANS: number;
  abiertas: number;
  cerradas: number;
  canceladas: number;
};

function parseDateLoose(value: string | null | undefined): Date | null {
  if (!value) return null;

  const d1 = new Date(value);
  if (!Number.isNaN(d1.getTime())) return d1;

  const m = String(value).trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s|T|$)/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]) - 1;
    let yy = Number(m[3]);
    if (yy < 100) yy += 2000;
    const d2 = new Date(yy, mm, dd);
    if (!Number.isNaN(d2.getTime())) return d2;
  }

  return null;
}

function isTruthyNo(value: unknown): boolean {
  const s = String(value ?? "").trim().toLowerCase();
  return s === "no" || s === "false" || s === "0" || s === "n";
}

function getEstadoLoose(r: any): string {
  const raw = r?.estado ?? r?.Estado ?? r?.status ?? r?.Status ?? "";
  return String(raw ?? "").trim();
}

export function computeReqMetrics(rows: requisiciones[], now = new Date()): ReqMetrics {
  let cerradas = 0;
  let abiertas = 0;
  let canceladas = 0;
  let noCumplenANS = 0;
  let conDiasDeRetraso = 0;

  for (const r of rows ?? []) {
    const estado = getEstadoLoose(r).toLowerCase();
    const isCancel = estado === "cancelada" || estado === "cancelado";
    const isClosed = estado === "cerrado" && r.cumpleANS === "Si";
    const isOpen = estado === "activo" || estado === "activa"
    if (isCancel) canceladas++;
    if (isClosed) cerradas++;
    if (isOpen) abiertas++;

    if (isTruthyNo(r.cumpleANS)) noCumplenANS++;

    // Retraso: abierta + fechaLimite vencida
    if (!isClosed && !isCancel) {
      const lim = parseDateLoose(r.fechaLimite);
      if (lim && now.getTime() > lim.getTime()) conDiasDeRetraso++;
    }
  }

  return { conDiasDeRetraso, noCumplenANS, abiertas, cerradas, canceladas };
}

type Props = {
  rows: requisiciones[];
  /** Si ya calculas afuera, puedes pasar metrics y no rows */
  metrics?: ReqMetrics;
  className?: string;
};

export default function MetricsBar({ rows, metrics, className }: Props) {
  const m = React.useMemo(() => metrics ?? computeReqMetrics(rows), [rows, metrics]);

  return (
    <div className={`mb-metrics ${className ?? ""}`.trim()} role="group" aria-label="Métricas de requisiciones">
      <Metric value={m.conDiasDeRetraso} label="Con días de retraso" tone="muted" />
      <Metric value={m.noCumplenANS} label="No cumplen ANS" tone="danger" />
      <Metric value={m.abiertas} label="Abiertas" tone="success" />
      <Metric value={m.cerradas} label="Cerradas" tone="info" />
      <Metric value={m.canceladas} label="Canceladas" tone="warn" />
    </div>
  );
}

function Metric({value, label, tone,}: {value: number; label: string; tone: "muted" | "danger" | "success" | "info" | "warn";}) {
  return (
    <div className="mb-metric">
      <div className={`mb-metric__value mb-tone-${tone}`}>{value}</div>
      <div className={`mb-metric__label mb-tone-${tone}`}>{label}</div>
    </div>
  );
}
