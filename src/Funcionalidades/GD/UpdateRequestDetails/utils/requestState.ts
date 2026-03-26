import type { detalle,  } from "../../../../models/solicitudCambio";

export function createEmptyRequestDetail(): detalle {
  return {
    EtiquetaCampo: "",
    NombreCampo: "",
    TipoDato: "",
    Title: "",
    ValorAnterior: "",
    ValorNuevo: ""
  };
}