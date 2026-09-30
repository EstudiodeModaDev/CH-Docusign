import type { RequisicionesService } from "../../../../Services/Requisiciones/Requisiciones.service";

// Cumple el ANS si la fecha de cierre (por defecto hoy) no supera la fecha limite.
export async function calcularEstadoCierre (requisicionId: string, svc: RequisicionesService, fechaCierre: Date = new Date()): Promise<string> {
  const requisicion = await svc.get(requisicionId);
  const limite = new Date(requisicion.fechaLimite ?? "").getTime();
  const finalizacion = fechaCierre.getTime();
  const cumple = limite < finalizacion ? "No" : "Si";
  return cumple
};
