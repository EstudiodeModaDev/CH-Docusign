import type { MetricTone } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";

export const RQM_COLORS = {
  good: "#22c55e",
  warn: "#f59e0b",
  risk: "#f43f5e",
  brand: "#7f3bf0",
  track: "#f2eff9",
  grid: "#eee7fb",
  text: "#473d5f",
  textMuted: "#7b7194",
} as const;

export function toneForPct(pct: number): MetricTone {
  if (pct <= 59) return "risk";
  if (pct <= 79) return "warn";
  return "good";
}

export function colorForTone(tone: MetricTone): string {
  if (tone === "good") return RQM_COLORS.good;
  if (tone === "warn") return RQM_COLORS.warn;
  return RQM_COLORS.risk;
}

// Paleta categorica para "Estado" (Activo/Cerrado/Cancelado): deliberadamente
// distinta de RQM_COLORS.good/warn/risk para no sugerir una relacion con el
// cumplimiento de ANS, que usa esos mismos tonos en el mismo tablero.
export const ESTADO_COLORS: Record<string, string> = {
  Activo: "#7f3bf0",
  Cerrado: "#2563eb",
  Cancelado: "#64748b",
};
export const ESTADO_FALLBACK_COLOR = "#c7c2d6";

// Rampa morada ordinal (un solo tono, monotonamente mas clara) para el embudo
// de seleccion. Sin superponer hex con ESTADO_COLORS para que ambos widgets
// se puedan leer juntos en la pagina de Resumen sin ambiguedad de color.
export const FUNNEL_COLORS = ["#4c1d95", "#6d28d9", "#9061f9", "#c4b5fd"];
