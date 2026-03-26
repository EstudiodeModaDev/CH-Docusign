import type { solicitud, solicitudErrors } from "../../../../models/solicitudCambio";

export function validateRequest(state: solicitud): solicitudErrors {
  const e: solicitudErrors = {};
  if(!state.Razon) e.Razon = "Debe escribir la razón por la que solicita la edición"
  
  return e;
}