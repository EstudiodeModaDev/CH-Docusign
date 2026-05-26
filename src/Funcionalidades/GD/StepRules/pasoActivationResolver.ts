import type { pasoRestriccionProcesoService } from "../../../Services/PasoRestriccionProceso.Service";
import { resolvePasoRestriccionCargo } from "./resolvePasoRestriccion";

type Props = {
  proceso: string,
  idPaso: string,
  cargo: string
  service: {
    pasoRestriccion: pasoRestriccionProcesoService
  }
}

export async function shouldActivate({proceso, idPaso, cargo, service}: Props): Promise<boolean> {
  const reglas = await service.pasoRestriccion.getAll({filter: `fields/Proceso eq '${proceso.toUpperCase()}' and fields/Title eq '${idPaso.toUpperCase()}'`});
  const final = resolvePasoRestriccionCargo(cargo, reglas);
  return final.ok
}