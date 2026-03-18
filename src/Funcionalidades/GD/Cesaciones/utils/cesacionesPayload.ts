import type { Cesacion } from "../../../../models/Cesaciones";
import { toGraphDateTime } from "../../../../utils/Date";

export function buildCesacionCreatePayload(state: Cesacion): Cesacion {
  return {
    ...state,
    FechaIngreso: toGraphDateTime(state.FechaIngreso) ?? null,
    FechaLimiteDocumentos: toGraphDateTime(state.FechaLimiteDocumentos) ?? null,
    FechaSalidaCesacion: toGraphDateTime(state.FechaSalidaCesacion) ?? null,
    Fechaenlaquesereporta: toGraphDateTime(state.Fechaenlaquesereporta) ?? null,
    Salario: String(state.Salario),
    Estado: "En proceso",
  };
}