import type { PasosProceso, } from "../../../../models/Pasos";

// Construir el argumento By ID de forma general independientemente de la tabla donde venga la info.
export function buildStepsMap(rows: PasosProceso[],): Record<string, PasosProceso> {
  const map: Record<string, PasosProceso> = {};

  for (const row of rows) {
    const key = row.Orden !== undefined && row.Orden !== null
          ? String(row.Orden)
          : undefined;

    if (key) map[String(key)] = row;
  }

  return map;
}

//Buscar un paso en especifico en el mapa, devolviendo null si no se encuentra (en vez de undefined) para facilitar su uso.
export function findStepByKey(map: Record<string, PasosProceso>, key: string): PasosProceso | null {
  return map[key] ?? null;
}