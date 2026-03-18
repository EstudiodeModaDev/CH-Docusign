import type { Novedad } from "../../../../models/Novedades";
import { toGraphDateTime } from "../../../../utils/Date";

export function contratosPayload(state: Novedad): Novedad {
  return {
    ...state,
    Estado: "En proceso",
    FECHA_x0020_DE_x0020_AJUSTE_x002: toGraphDateTime(state.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? null,
    FechaFinalLectiva: toGraphDateTime(state.FechaFinalLectiva) ?? null,
    FechaFinalProductiva: toGraphDateTime(state.FechaFinalProductiva) ?? null,
    FechaInicioLectiva: toGraphDateTime(state.FechaInicioLectiva) ?? null,
    FechaInicioProductiva: toGraphDateTime(state.FechaInicioProductiva) ?? null,
    FechaNac: toGraphDateTime(state.FechaNac) ?? null,
    FechaReporte: toGraphDateTime(state.FechaReporte) ?? null,
    FECHA_x0020_DE_x0020_ENTREGA_x00: toGraphDateTime(state.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? null,
    FECHA_x0020_HASTA_x0020_PARA_x00: toGraphDateTime(state.FECHA_x0020_HASTA_x0020_PARA_x00) ?? null,
    FECHA_x0020_REQUERIDA_x0020_PARA0: toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? null,
    FECHA_x0020_REQUERIDA_x0020_PARA: toGraphDateTime(state.FECHA_x0020_REQUERIDA_x0020_PARA) ?? null,
  };
}