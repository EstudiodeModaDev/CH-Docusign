
import type { requisiciones } from "../../../../models/requisiciones";
import { normalize, } from "../../../../utils/Date";

const fields: (keyof requisiciones)[] = [
  "Area","Ciudad", "Title", "auxilioRodamiento", "cantidadPersonas", "cedulaEmpleadoVinculado", "codigoCentroCosto", 
  "codigoCentroOperativo","codigoCentroOperativo", "codigoUnidadNegocio", "comisiones", "descripcionCentroCosto", 
  "descripcionCentroOperativo", "descripcionUnidadNegocio", "direccion", "empresaContratista", "genero", "grupoCVE"
  ,"marca", "modalidadTeletrabajo",
];


export function buildRequisicionesPatch(original: requisiciones, next: requisiciones) {
  const patch: Record<string, any> = {};

  for (const k of fields) {
    const a = normalize(original[k]);
    const b = normalize(next[k]);
    if (a !== b) patch[k] = b;
  }


  return patch;
}