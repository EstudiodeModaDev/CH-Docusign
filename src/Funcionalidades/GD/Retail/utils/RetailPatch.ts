import type { Retail } from "../../../../models/Retail";
import { areFieldValuesEqual } from "../../UpdateRequestDetails/utils/fieldComparison";

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
    if (!areFieldValuesEqual(String(k), original[k], next[k])) patch[k] = next[k];
  }

  for (const k of dateFields) {
    if (!areFieldValuesEqual(String(k), original[k], next[k], "date")) patch[k] = next[k];
  }

  return patch;
};
