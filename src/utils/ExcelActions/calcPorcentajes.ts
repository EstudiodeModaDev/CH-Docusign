import type { ReportDTO } from "../../models/DTO";
import { computePctById, type GetAllSvc, type PasoLike } from "../completation";

type PctById = Record<string, number>;

export async function computePctByModule(
  rows: ReportDTO[],
  services: {
    novedades?: GetAllSvc<PasoLike>;
    promociones?: GetAllSvc<PasoLike>;
    cesaciones?: GetAllSvc<PasoLike>;
    retail?: GetAllSvc<PasoLike>;
  }
): Promise<PctById> {
  const result: PctById = {};

  const novedadesRows = rows.filter(r => r.Modulo === "Contratación" && r.Id);
  const promocionesRows = rows.filter(r => r.Modulo === "Promoción" && r.Id);
  const cesacionesRows = rows.filter(r => r.Modulo === "Cesaciones" && r.Id);
  const retailRows = rows.filter(r => r.Modulo === "Retail" && r.Id);

  if (novedadesRows.length > 0 && services.novedades) {
    const ids = novedadesRows.map(r => r.Id);
    const pct = await computePctById(ids, services.novedades, { concurrency: 10 });
    Object.assign(result, pct);
  }

  if (promocionesRows.length > 0 && services.promociones) {
    const ids = promocionesRows.map(r => r.Id);
    const pct = await computePctById(ids, services.promociones, { concurrency: 10 });
    Object.assign(result, pct);
  }

  if (cesacionesRows.length > 0 && services.cesaciones) {
    const ids = cesacionesRows.map(r => r.Id);
    const pct = await computePctById(ids, services.cesaciones, { concurrency: 10 });
    Object.assign(result, pct);
  }

  if (retailRows.length > 0 && services.retail) {
    const ids = retailRows.map(r => r.Id);
    const pct = await computePctById(ids, services.retail, { concurrency: 10 });
    Object.assign(result, pct);
  }

  return result;
}