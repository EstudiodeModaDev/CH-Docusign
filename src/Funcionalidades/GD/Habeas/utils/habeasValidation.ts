import type { HabeasData, HabeasErrors } from "../../../../models/HabeasData";


export function validateHabeas(state: HabeasData): HabeasErrors {
  const e: HabeasErrors = {};

    if(!state.Ciudad) e.Ciudad = "Seleccione un departamento y ciudad"
    if(!state.Fechaenlaquesereporta) e.Fechaenlaquesereporta = "Seleccione una fecha de expedición"
    if(!state.NumeroDocumento) e.NumeroDocumento = "Ingrese el numero de identificación"
    if(!state.Title) e.Title = "Ingrese el nombre del seleccionado"
    if(!state.Correo) e.Correo = "Ingrese el correo del seleccionado"
    if(!state.Empresa) e.Empresa = "Ingrese la empresa del seleccionado"

  return e;
}