import * as React from "react";
import { useCoreGraphServices } from "../../../graph/graphContext";
import { ExcelSatisfactionSurvey } from "../../../Services/Requisiciones/Encuestas/SatisfactionSurvey.excel.service";
import type { encuestaSatisfaccion } from "../../../models/Requisiciones/satisfaction-survey";

export type EncuestaSatisfaccionResumen = {
  totalEncuestas: number;
  totalAprobadas: number;
  pctAprobadas: number;
};

export type EncuestaSatisfaccionMesRow = {
  month: string;
  total: number;
  aprobadas: number;
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const NOTA_MINIMA_APROBACION = 0.80;

function isAprobada(r: encuestaSatisfaccion): boolean {
  const respuestas = [
    r.did_team_review,
    r.did_team_submit_on_time,
    r.had_candidate_personal_presentation,
    r.was_candidate_correct_adn,
    r.had_candidate_correct_knowledge,
  ];

  const positivas = respuestas.filter(Boolean).length;
  return positivas / respuestas.length >= NOTA_MINIMA_APROBACION;
}

function toResumen(responses: encuestaSatisfaccion[]): EncuestaSatisfaccionResumen {
  const totalEncuestas = responses.length;
  const totalAprobadas = responses.filter(isAprobada).length;
  const pctAprobadas = totalEncuestas > 0 ? Math.round((totalAprobadas / totalEncuestas) * 100) : 0;

  return { totalEncuestas, totalAprobadas, pctAprobadas };
}

function toPorMes(responses: encuestaSatisfaccion[]): EncuestaSatisfaccionMesRow[] {
  const filas = MONTHS.map((month) => ({ month, total: 0, aprobadas: 0 }));

  responses.forEach((r) => {
    if (!(r.Hora_inicio instanceof Date) || Number.isNaN(r.Hora_inicio.getTime())) return;

    const fila = filas[r.Hora_inicio.getMonth()];
    fila.total += 1;
    if (isAprobada(r)) fila.aprobadas += 1;
  });

  return filas;
}

export function useEncuestaSatisfaccionMetrics() {
  const { graph } = useCoreGraphServices();
  const service = React.useMemo(() => new ExcelSatisfactionSurvey(graph), [graph]);

  const [responses, setResponses] = React.useState<encuestaSatisfaccion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [year, setYear] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await service.loadResponses({});
      setResponses(data);
    } catch (e: any) {
      setError(e?.message ?? "No fue posible cargar la encuesta de satisfacción.");
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }, [service]);

  React.useEffect(() => {
    load();
  }, [load]);

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();

    responses.forEach((r) => {
      if (r.Hora_inicio instanceof Date && !Number.isNaN(r.Hora_inicio.getTime())) {
        years.add(r.Hora_inicio.getFullYear());
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [responses]);

  React.useEffect(() => {
    if (year !== null && availableYears.includes(year)) return;
    setYear(availableYears[0] ?? null);
  }, [availableYears, year]);

  const responsesForYear = React.useMemo(() => {
    if (year === null) return responses;
    return responses.filter((r) => r.Hora_inicio instanceof Date && r.Hora_inicio.getFullYear() === year);
  }, [responses, year]);

  const resumen = React.useMemo(() => toResumen(responsesForYear), [responsesForYear]);
  const porMes = React.useMemo(() => toPorMes(responsesForYear), [responsesForYear]);

  return { resumen, porMes, availableYears, year, setYear, loading, error, reload: load };
}
