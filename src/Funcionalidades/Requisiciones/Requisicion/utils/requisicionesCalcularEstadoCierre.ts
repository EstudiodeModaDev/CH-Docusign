import type { RequisicionesService } from "../../../../Services/Requisiciones/Requisiciones.service";

export async function calcularEstadoCierre (requisicionId: string, svc: RequisicionesService): Promise<string> {
  const requisicion = await svc.get(requisicionId);
  const limite = new Date(requisicion.fechaLimite ?? "").getTime();
  const finalizacion = new Date().getTime();
  const cumple = limite < finalizacion ? "No" : "Si";
  return cumple
};
