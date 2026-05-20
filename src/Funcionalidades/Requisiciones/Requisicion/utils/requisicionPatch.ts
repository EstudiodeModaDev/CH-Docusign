
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { normalize, } from "../../../../utils/Date";

const fields: (keyof requisiciones)[] = [
  "Ciudad", "Title", "auxilioRodamiento", "cedulaEmpleadoVinculado", "codigoCentroCosto", 
  "codigoCentroOperativo","codigoCentroOperativo", "codigoUnidadNegocio", "comisiones", "descripcionCentroCosto", 
  "descripcionUnidadNegocio", "direccion", "empresaContratista", "genero", "grupoCVE", "modalidadTeletrabajo",
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