import type { DateRange, GetAllOpts } from "../../../../models/Commons";
import { buildEnviosOrderBy, type EnvioSort } from "./enviosSorts";

export function buildEnviosFilter(range: DateRange, top: number, search?: string, sorts: EnvioSort[] = [{ field: "id", dir: "desc" }]): GetAllOpts {
  const filters: string[] = [];

  if (search) {
    filters.push(
      `(startswith(fields/Cedula, '${search}') or ` +
      `startswith(fields/CorreoReceptor, '${search}') or ` +
      `startswith(fields/Receptor, '${search}') or ` +
      `startswith(fields/EnviadoPor, '${search}') or ` +
      `startswith(fields/Title, '${search}'))`
    );
  }

  if (range.from && range.to && range.from <= range.to) {
    filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
    filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
  }

  return {
    filter: filters.length ? filters.join(" and ") : undefined,
    orderby: buildEnviosOrderBy(sorts),
    top,
  };
}

export function buildEnviosReportFilter(from: string, to: string, EnviadoPor?: string, destinatario?: string, plantilla?: string): GetAllOpts {
  const filters: string[] = [];

  if(from && to && from <= to)
  filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

  if(EnviadoPor){
    filters.push(`fields/EnviadoPor eq '${EnviadoPor}'`)
  }

  if(destinatario){
    filters.push(`fields/Receptor eq '${destinatario}'`)
  }

  if(plantilla){
    filters.push(`fields/Title eq '${plantilla}'`)
  }

  return {
    filter: filters.join(" and "),
    top: 2000,
  };
}