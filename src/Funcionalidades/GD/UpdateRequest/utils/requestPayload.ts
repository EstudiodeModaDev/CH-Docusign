import type { solicitud } from "../../../../models/solicitudCambio";
import { toGraphDateTime } from "../../../../utils/Date";

export function requestPayload(state: solicitud): solicitud {
  return {
    ...state,
    fechaSolicitud: toGraphDateTime(state.fechaSolicitud) ?? null,    
  };
}