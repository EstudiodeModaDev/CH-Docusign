import type { Cesacion } from "../../../../models/Cesaciones";
import { normalize, normalizeDate } from "../../../../utils/Date";

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
}