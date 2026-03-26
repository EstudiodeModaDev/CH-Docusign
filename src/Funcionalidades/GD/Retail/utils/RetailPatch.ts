import type { Retail } from "../../../../models/Retail";
import { normalize, normalizeDate } from "../../../../utils/Date";

const fields: (keyof Retail)[] = [
  "Title", "TipoDoc", "Nombre", "Empresaalaquepertenece", "CorreoElectronico", "Celular", "NivelCargo", "Cargo", "Salario", "SalarioLetras", "Auxiliodetransporte", 
  "Auxiliotransporteletras", "Depedencia", "Departamento", "Ciudad", "Temporal", "CentroCostos", "CodigoCentroCostos", "CentroOperativo", "CodigoCentroOperativo", 
  "UnidadNegocio", "CodigoUnidadNegocio", "OrigenSeleccion", ];

const dateFields: (keyof Retail)[] = [
  "FechaIngreso",
];

export function buildRetailPatch(original: Retail, next: Retail){
  const patch: Record<string, any> = {};

  for (const k of fields) {
    const a = normalize(original[k]);
    const b = normalize(next[k]);
    if (a !== b) patch[k] = b;
  }

  for (const k of dateFields) {
    const a = normalizeDate(original[k]);
    const b = normalizeDate(next[k]);
    if (a !== b) patch[k] = b;
  }

  return patch;
};