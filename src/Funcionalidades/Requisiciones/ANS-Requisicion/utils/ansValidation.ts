import type { ansRequisicion, ansRequisionErrors } from "../../../../models/requisiciones";


export function validateANSForm(state: ansRequisicion): ansRequisionErrors {
  const errors: ansRequisionErrors = {};

  if (!state.NivelCargo?.trim()) {errors.NivelCargo = "Seleccione un nivel de cargo";}

  if (!state.diasHabiles0 || Number(state.diasHabiles0) <= 0) {errors.diasHabiles0 = "Ingrese cuántos días hábiles tiene este cargo";}

  return errors;
}

export function isANSFormValid(errors: ansRequisionErrors): boolean {
  return Object.keys(errors).length === 0;
}