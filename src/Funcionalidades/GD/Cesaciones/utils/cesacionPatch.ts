import type { Cesacion } from "../../../../models/Cesaciones";
import { areFieldValuesEqual } from "../../UpdateRequestDetails/utils/fieldComparison";

const fields: (keyof Cesacion)[] = [
  "Title", "Nombre", "Cargo", "Temporal", "Tienda", "Celular", "Correoelectronico",
  "Jefedezona", "Reportadopor", "Empresaalaquepertenece", "TipoDoc", "Departamento",
  "Ciudad", "Niveldecargo", "CargoCritico", "Dependencia", "CodigoCC", "DescripcionCC",
  "CodigoCO", "DescripcionCO", "CodigoUN", "DescripcionUN", "Salario", "SalarioTexto",
  "auxConectividadTexto", "auxConectividadValor", "Pertenecealmodelo", "GrupoCVE",
  "PresupuestaVentas", "Autonomia", "ImpactoCliente", "contribucionEstrategia",
  "Promedio", "direccionResidencia",
];

const dateFields: (keyof Cesacion)[] = [
  "FechaIngreso",
  "FechaLimiteDocumentos",
  "FechaSalidaCesacion",
];

export function buildCesacionPatch(original: Cesacion, next: Cesacion) {
  const patch: Record<string, any> = {};

  for (const k of fields) {
    if (!areFieldValuesEqual(String(k), original[k], next[k])) patch[k] = next[k];
  }

  for (const k of dateFields) {
    if (!areFieldValuesEqual(String(k), original[k], next[k], "date")) patch[k] = next[k];
  }

  return patch;
}
