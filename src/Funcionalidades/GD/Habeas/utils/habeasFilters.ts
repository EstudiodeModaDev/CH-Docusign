import type { DateRange, GetAllOpts } from "../../../../models/Commons";


export function buildHabeasServerFilter( range: DateRange, ): GetAllOpts {
  const filters: string[] = [];

  if (range.from && range.to && range.from <= range.to) {
    const fromISO = range.from;
    const toISO = range.to;

    const d = new Date(`${toISO}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const nextDay = d.toISOString().slice(0, 10);

    filters.push(`fields/FechaIngreso ge '${fromISO}T00:00:00Z'`);
    filters.push(`fields/FechaIngreso lt '${nextDay}T00:00:00Z'`);
  }

  return {
    filter: filters.length ? filters.join(" and ") : undefined,
    orderby: "fields/Created desc",
    top: 2000,
  };
}
    

export function buildHabeasReportFilter(from: string, to: string, EnviadoPor?: string, cargo?: string, empresa?: string, ciudad?: string): GetAllOpts {
  const filters: string[] = [];

  filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

  if(EnviadoPor){
    filters.push(`fields/Informacionreportadapor ge '${EnviadoPor}'`)
  }

  if (cargo) {
    filters.push(`fields/Cargo eq '${cargo}'`);
  }

  if (empresa) {
    filters.push(`fields/Empresaalaquepertenece eq '${empresa}'`);
  }

  if (ciudad) {
    filters.push(`fields/Ciudad eq '${ciudad}'`);
  }

  return {
    filter: filters.join(" and "),
    top: 2000,
  };
}