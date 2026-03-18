import type { HabeasData } from "../../../../models/HabeasData";
import { toISODateFlex } from "../../../../utils/Date";

export function createEmptyHabeas(reportadoPor: string): HabeasData {
  return {
    AbreviacionTipoDoc: "",
    Correo: "",
    Empresa: "",
    Informacionreportadapor: reportadoPor,
    NumeroDocumento: "",
    Tipodoc: "",
    Ciudad: "",
    Fechaenlaquesereporta: toISODateFlex(new Date()),
    Title: ""
  };
}