import type { cargoCiudadAnalista, cargoCiudadAnalistaErrors } from "../../../../models/requisiciones";

export function validateCargoCiudadAnalistaForm(state: cargoCiudadAnalista): cargoCiudadAnalistaErrors {
  const errors: cargoCiudadAnalistaErrors = {};

  if (!state.Cargo?.trim()) {errors.Cargo = "Seleccione un cargo";}

  if (!state.Ciudad?.trim()) {errors.Ciudad = "Seleccione la ciudad";}

  if (!state.Title?.trim()) {errors.Title = "Seleccione el analista encargado";}

  return errors;
}

export function isCargoCiudadAnalistaFormValid(errors: cargoCiudadAnalistaErrors): boolean {
  return Object.keys(errors).length === 0;
}