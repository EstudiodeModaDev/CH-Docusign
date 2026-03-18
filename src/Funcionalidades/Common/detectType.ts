import type { Cesacion } from "../../models/Cesaciones";
import type { HabeasData } from "../../models/HabeasData";
import type { Novedad } from "../../models/Novedades";
import type { Promocion } from "../../models/Promociones";
import type { Retail } from "../../models/Retail";

export function isCesacion(value: any): value is Cesacion {
  return value && typeof value === "object" && "FechaSalidaCesacion" in value;
}

export function isNovedad(value: any): value is Novedad {
  return value && typeof value === "object" && "CARGO" in value;
}

export function isPromocion(value: any): value is Promocion {
  return value && typeof value === "object" && "TipoNomina" in value;
}

export function isHabeasData(value: any): value is HabeasData {
  return value && typeof value === "object" && "Empresa" in value;
}

export function isRetail(value: any): value is Retail {
  return value && typeof value === "object" && "Impacto" in value;
}