import type { DetallesPasos } from "../../../../models/Pasos";

//Calcular el porcentaje de pasos completados (incluye "Omitido" como completado)
export function calculateCompletedPercentage(items: DetallesPasos[]): number {
  if (items.length === 0) return 0;

  const completed = items.filter(
    i => i.EstadoPaso === "Completado" || i.EstadoPaso === "Omitido"
  ).length;

  return (completed / items.length) * 100;
}