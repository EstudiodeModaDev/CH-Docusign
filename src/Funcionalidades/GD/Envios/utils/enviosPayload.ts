import type { Envio } from "../../../../models/Envios";
import { toGraphDateTime } from "../../../../utils/Date";

export function enviosPayload(state: Envio): Envio {
  return {
    ...state,
    Fechadeenvio: toGraphDateTime(new Date()) ?? ""
  };
}      
