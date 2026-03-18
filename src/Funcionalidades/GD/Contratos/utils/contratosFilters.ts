import type { DateRange, GetAllOpts } from "../../../../models/Commons";


export function buildContartosServerFilter(estado: string, range: DateRange ): GetAllOpts {
  const filters: string[] = [];

  if (estado === "proceso") filters.push(`fields/Estado eq 'En proceso'`);
  if (estado === "finalizado") filters.push(`fields/Estado eq 'Completado'`);
  if (estado === "cancelado") filters.push(`fields/Estado eq 'Cancelado'`);

  if (range.from && range.to && range.from <= range.to) {
    const fromISO = range.from;
    const toISO = range.to;

    const d = new Date(`${toISO}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const nextDay = d.toISOString().slice(0, 10);

    filters.push(`fields/FECHA_x0020_REQUERIDA_x0020_PARA0 ge '${fromISO}T00:00:00Z'`);
    filters.push(`fields/FECHA_x0020_REQUERIDA_x0020_PARA0 le '${nextDay}T23:59:59Z'`);
  }

  return {
    filter: filters.length ? filters.join(" and ") : undefined,
    orderby: "fields/Created desc",
    top: 2000,
  };
}

export function buildContratosReportFilter(from: string, to: string, enviadoPor?: string, cargo?: string, empresa?: string, ciudad?: string): GetAllOpts {
  const filters: string[] = [];

  filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

  if (enviadoPor) {
    filters.push(`fields/Informaci_x00f3_n_x0020_enviada_ ge '${enviadoPor}'`)
  }

  if (cargo) {
    filters.push(`fields/CARGO ge '${cargo}'`)
  }

  if (empresa) {
    filters.push(`fields/Empresa_x0020_que_x0020_solicita ge '${empresa}'`)
  }

  if (ciudad) {
    filters.push(`fields/CIUDAD ge '${ciudad}'`)
  }

  return {
    filter: filters.join(" and "),
    top: 2000,
  };
}