import type { solicitud } from "../../../../models/solicitudCambio";
import { toISODateFlex } from "../../../../utils/Date";

export function createEmptyRequest(reportadoPor: string, correo: string): solicitud {
  return {
    Aprobador: "",
    comentarioAprobador: "",
    CorreoSolicitante: correo,
    fechaAprobacion: null,
    Estado: "Pendiente",
    fechaSolicitud: toISODateFlex(new Date()),
    IdRegistro: "",
    NombreSolicitante: reportadoPor,
    Razon: "",
    Title: ""
  };
}