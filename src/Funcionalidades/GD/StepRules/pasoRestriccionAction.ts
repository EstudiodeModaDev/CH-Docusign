import type { PasoRestriccion } from "../../../models/Pasos";
import type { pasoRestriccionProcesoService } from "../../../Services/PasoRestriccionProceso.Service";
import { validatePasoRestriccionCargoConsistency, validatePasoRestriccionCargoInput } from "./validatePasoRestriccion";
import { notify } from '../../../utils/notify';

type createStepRestrictionProps = {
  data: Omit<PasoRestriccion, "Id">,
  service: {
    pasoRestriccion: pasoRestriccionProcesoService
  }
}

export async function createStepRestriction({data, service}: createStepRestrictionProps) {
  const validInputs = validatePasoRestriccionCargoInput({CargoNegocio: data.CargoNombre, IdPaso: data.Title, Proceso: data.Proceso, TipoRegla: data.TipoRegla});

  if(validInputs.ok){
    const existing = await service.pasoRestriccion.getAll({filter: `fields/Proceso eq '${data.Proceso}' and fields/Title eq '${data.Title}'`});
    const validConsistency = validatePasoRestriccionCargoConsistency(existing, data.CargoNombre, data.TipoRegla);
    if(validConsistency.ok) {
      return await service.pasoRestriccion.create(data);
    } else{
      notify.auto(validConsistency.message)
    }
  } else {
    notify.auto(validInputs.message)
  }  
}

type updateStepRestrictionProps = {
  data: PasoRestriccion,
  service: {
    pasoRestriccion: pasoRestriccionProcesoService
  }
}

export async function updateStepRestriction({data, service}: updateStepRestrictionProps) {
  const validInputs = validatePasoRestriccionCargoInput({CargoNegocio: data.CargoNombre, IdPaso: data.Title, Proceso: data.Proceso, TipoRegla: data.TipoRegla});

  if(validInputs.ok){
    const existing = await service.pasoRestriccion.getAll({filter: `fields/Proceso eq '${data.Proceso}' and fields/Title eq '${data.Title}'`});
    const validConsistency = validatePasoRestriccionCargoConsistency(existing, data.CargoNombre, data.TipoRegla, data.Id);
    if(validConsistency.ok) {
      return await service.pasoRestriccion.update(data.Id!, data);
    } else{
      notify.auto(validConsistency.message)
    }
  } else {
    notify.auto(validInputs.message)
  }  
}

type toggleUpdateRestrictionProps = {
  id: string,
  activo: boolean,
  service: {
    pasoRestriccion: pasoRestriccionProcesoService
  }
}

export async function toggleUpdateRestriction({id, activo, service}: toggleUpdateRestrictionProps) {
  return await service.pasoRestriccion.update(id, { Activo: activo });
}



