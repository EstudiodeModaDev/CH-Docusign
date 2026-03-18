import type { Envio, EnvioErrors } from "../../../../models/Envios";

export function validateEnvio(state: Envio): EnvioErrors {
  const e: EnvioErrors = {};
  if(!state.Cedula) e.Cedula = "Requerido"
  if(!state.Compa_x00f1_ia) e.Compa_x00f1_ia = "Requerido"  
  return e;
}  
  