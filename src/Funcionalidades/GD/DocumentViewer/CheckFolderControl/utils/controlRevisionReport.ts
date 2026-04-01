import type { GetAllOpts } from "../../../../../models/Commons";

export function buildControlRevisionReportFilter(from: string, to: string, empresa?: string, estado?: string): GetAllOpts {
  const filters: string[] = [];

  filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

  if (estado) {
    filters.push(`fields/Estado eq '${estado}'`);
  }

  if (empresa) {
    filters.push(`fields/Empresa eq '${empresa}'`);
  }


  return {
    filter: filters.join(" and "),
    top: 2000,
  };
}
