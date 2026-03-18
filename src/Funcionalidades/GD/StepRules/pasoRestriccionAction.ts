import type { useGraphServices } from "../../../graph/graphContext";
import type { PasoRestriccion } from "../../../models/Pasos";
import { validatePasoRestriccionCargoConsistency, validatePasoRestriccionCargoInput } from "./validatePasoRestriccion";

export async function createStepRestriction(data: Omit<PasoRestriccion, "Id">, service: ReturnType<typeof useGraphServices>) {
  const validInputs = validatePasoRestriccionCargoInput({CargoNegocio: data.CargoNombre, IdPaso: data.Title, Proceso: data.Proceso, TipoRegla: data.TipoRegla});

  if(validInputs.ok){
    const existing = await service.pasoRestriccion.getAll({filter: `fields/Proceso eq '${data.Proceso}' and fields/Title eq '${data.Title}'`});
    const validConsistency = validatePasoRestriccionCargoConsistency(existing, data.CargoNombre, data.TipoRegla);
    if(validConsistency.ok) {
      return await service.pasoRestriccion.create(data);
    } else{
      alert(validConsistency.message)
    }
  } else {
    alert(validInputs.message)
  }  
}

export async function updateStepRestriction(data: PasoRestriccion, service: ReturnType<typeof useGraphServices>) {
  const validInputs = validatePasoRestriccionCargoInput({CargoNegocio: data.CargoNombre, IdPaso: data.Title, Proceso: data.Proceso, TipoRegla: data.TipoRegla});

  if(validInputs.ok){
    const existing = await service.pasoRestriccion.getAll({filter: `fields/Proceso eq '${data.Proceso}' and fields/Title eq '${data.Title}'`});
    const validConsistency = validatePasoRestriccionCargoConsistency(existing, data.CargoNombre, data.TipoRegla, data.Id);
    if(validConsistency.ok) {
      return await service.pasoRestriccion.update(data.Id!, data);
    } else{
      alert(validConsistency.message)
    }
  } else {
    alert(validInputs.message)
  }  
}

export async function toggleUpdateRestriction(id: string, activo: boolean, service: ReturnType<typeof useGraphServices>) {
  return await service.pasoRestriccion.update(id, { Activo: activo });
}

