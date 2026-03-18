import type { useGraphServices } from "../../../graph/graphContext";
import { resolvePasoRestriccionCargo } from "./resolvePasoRestriccion";

export async function shouldActivate(proceso: string, idPaso: string, cargo: string, service: ReturnType<typeof useGraphServices>): Promise<boolean> {
  const reglas = await service.pasoRestriccion.getAll({filter: `fields/Proceso eq '${proceso.toUpperCase()}' and fields/Title eq '${idPaso.toUpperCase()}'`});
  const final = resolvePasoRestriccionCargo(cargo, reglas);
  return final.ok
}