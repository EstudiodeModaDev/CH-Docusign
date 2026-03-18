import type { Envio } from "../../../../models/Envios";
import { toISODateFlex } from "../../../../utils/Date";

export function createEmptyEnvio(reportadoPor: string, ): Envio {
  return {
    Cedula: "",
    Compa_x00f1_ia: "",
    CorreoReceptor: "",
    Datos: "",
    EnviadoPor: reportadoPor,
    Fechadeenvio: toISODateFlex(new Date()),
    Estado: "",
    Fuente: "",
    ID_Novedad: "",
    IdSobre: "",
    Receptor: "",
    Recipients: "",
    Title: ""
  };
}