import type { detalle } from "../../../../models/solicitudCambio";

export function buildUpdatePayloadFromDetails(detalles: detalle[]): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const d of detalles) {
    payload[d.NombreCampo] = d.ValorNuevo;
  }

  return payload;
}