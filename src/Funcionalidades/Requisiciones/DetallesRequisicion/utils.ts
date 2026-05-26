import type { detalleRequisicion, pasoRequisicion } from "../../../models/Requisiciones/pasos";
import type { RequisicionStepResolved } from "./types";

export function sortTemplateSteps(rows: pasoRequisicion[]): pasoRequisicion[] {
  return [...rows].sort((a, b) => {
    const aOrder = Number(a.OrdenPaso ?? Number.MAX_SAFE_INTEGER);
    const bOrder = Number(b.OrdenPaso ?? Number.MAX_SAFE_INTEGER);

    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.Title ?? "").localeCompare(String(b.Title ?? ""), "es");
  });
}

export function buildTemplateStepMap(rows: pasoRequisicion[]): Record<string, pasoRequisicion> {
  const map: Record<string, pasoRequisicion> = {};

  for (const row of rows) {
    const key = String(row.Id ?? "").trim();
    if (!key) continue;
    map[key] = row;
  }

  return map;
}

export function buildDetailStepMap(rows: detalleRequisicion[]): Record<string, detalleRequisicion> {
  const map: Record<string, detalleRequisicion> = {};

  for (const row of rows) {
    const key = String(row.Title ?? "").trim();
    if (!key) continue;
    map[key] = row;
  }

  return map;
}

export function resolveStepRows(templates: pasoRequisicion[], details: detalleRequisicion[]): RequisicionStepResolved[] {
  const templatesOrdered = sortTemplateSteps(templates);
  const detailByTemplateId = buildDetailStepMap(details);
  const resolved: RequisicionStepResolved[] = [];

  for (const template of templatesOrdered) {
    const templateId = String(template.Id ?? "").trim();
    if (!templateId) continue;

    const detail = detailByTemplateId[templateId] ?? null;

    resolved.push({
      templateId,
      detailId: String(detail?.Id ?? ""),
      nombrePaso: String(template.Title ?? ""),
      descripcion: String(template.Descripcion ?? ""),
      tipoPaso: String(template.TipoPaso ?? ""),
      ordenPaso: Number(template.OrdenPaso ?? 0),
      obligatorio: Boolean(template.Obligatorio),
      activo: Boolean(template.Activo),
      idRequisicion: String(detail?.IdRequisicion ?? ""),
      estado: String(detail?.Estado ?? "Pendiente"),
      completadoPor: String(detail?.CompletadoPor ?? ""),
      notas: String(detail?.Notas ?? ""),
      fechaCompletadoPor: detail?.FechaCompletadoPor ?? null,
      plantilla: template,
      detalle: detail,
    });
  }

  return resolved;
}

export function calculatePorcentaje(template: pasoRequisicion[], detail: detalleRequisicion[]): number {
  const plantillaActiva = template.filter((t) => !!t.Activo).length;

  if (!plantillaActiva) return 0;

  const detalleFinalizado = detail.filter((t) => {
    const estado = String(t.Estado ?? "").toLocaleLowerCase().trim();
    return estado === "omitido" || estado === "completado";
  }).length;

  return Math.round((detalleFinalizado / plantillaActiva) * 100);
}
